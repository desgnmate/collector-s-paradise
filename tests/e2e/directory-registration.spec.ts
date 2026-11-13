import { test, expect, type Page } from '@playwright/test';

const fixture='http://127.0.0.1:4319';
async function details(page: Page, email='directory@example.test') {
  await page.getByLabel('Business Name *',{exact:true}).fill('Directory Test Business');
  await page.locator('#logo').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.locator('[name=contact_name]').fill('Test Contact');
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=location_state]').selectOption('Victoria');
  await page.locator('textarea[name=description]').fill('Trading cards and accessories for collectors.');
  await page.locator('[name=social_links]').fill('https://example.test/shop');
  await page.getByRole('checkbox',{name:/Pokémon TCG/}).check();
  await page.locator('[name=agreement]').check();
}
test.beforeEach(async({request})=>{await request.post(`${fixture}/test/reset`);});

test('directory-only form saves a private review request without event requirements or emails',async({page,request})=>{
  await page.goto('/vendors/apply');
  await page.getByRole('radio',{name:'Join the vendor directory only'}).check();
  await expect(page.locator('[name=event_ids]')).toHaveCount(0);
  await expect(page.locator('[name=tables_requested]')).toHaveCount(0);
  await details(page);
  await page.getByRole('button',{name:'Submit Directory Registration'}).click();
  await expect(page.getByText('Directory registration received for review.',{exact:false})).toBeVisible();
  const state=await(await request.get(`${fixture}/test/state`)).json();
  expect(state.registrations).toHaveLength(1);
  expect(state.registrations[0].event_ids).toEqual([]);
  expect(state.registrations[0].kind).toBe('directory');
  // Only the admin review alert goes out; the applicant gets nothing until a decision.
  expect(state.sent.map((entry:[string,{to:string|string[]}])=>[entry[1].to].flat())).toEqual([['admin@example.test']]);
});

test('repeat email event application queues submitted details without changing saved applications',async({page,request})=>{
  await page.goto('/vendors/apply');
  await details(page,'owner@example.test');
  await page.getByRole('checkbox',{name:/New Event/}).check();
  await page.locator('[name=tables_requested]').selectOption('2');
  await page.getByRole('button',{name:'Submit Application',exact:true}).click();
  await expect(page.getByText('Application received for admin review.',{exact:false})).toBeVisible();
  const state=await(await request.get(`${fixture}/test/state`)).json();
  expect(state.registrations[0].kind).toBe('events');
  expect(state.registrations[0].details.tables_requested).toBe('2');
  expect(state.applications).toHaveLength(4);
  // Only the admin review alert goes out; the applicant gets nothing until a decision.
  expect(state.sent.map((entry:[string,{to:string|string[]}])=>[entry[1].to].flat())).toEqual([['admin@example.test']]);
});

test('upload error keeps directory selection and entered information for retry',async({page,request})=>{
  await page.goto('/vendors/apply');
  await page.getByRole('radio',{name:'Join the vendor directory only'}).check();
  await details(page);
  await request.post(`${fixture}/test/mode`,{data:{uploadFailure:true}});
  await page.getByRole('button',{name:'Submit Directory Registration'}).click();
  await expect(page.getByText('Failed to upload the logo file.',{exact:false})).toBeVisible();
  await expect(page.getByRole('radio',{name:'Join the vendor directory only'})).toBeChecked();
  await expect(page.locator('[name=email]')).toHaveValue('directory@example.test');
  await request.post(`${fixture}/test/mode`,{data:{uploadFailure:false}});
  await page.getByRole('button',{name:'Submit Directory Registration'}).click();
  await expect(page.getByText('Directory registration received for review.',{exact:false})).toBeVisible();
});

test('missing migration hides directory choice while keeping the event form available',async({page,request})=>{
  await request.post(`${fixture}/test/mode`,{data:{migrationMissing:true}});
  await page.goto('/vendors/apply');
  await expect(page.getByRole('radio',{name:'Join the vendor directory only'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Submit Application',exact:true})).toBeEnabled();
});

test('lost save response never deletes a logo already referenced by a saved registration',async({page,request})=>{
  await page.goto('/vendors/apply');
  await page.getByRole('radio',{name:'Join the vendor directory only'}).check();
  await details(page);
  await request.post(`${fixture}/test/mode`,{data:{registrationLostResponse:true}});
  await page.getByRole('button',{name:'Submit Directory Registration'}).click();
  await expect(page.locator('.vendor-form-alert-error')).toBeVisible();
  const state=await(await request.get(`${fixture}/test/state`)).json();
  expect(state.registrations).toHaveLength(1);
  expect(state.removedLogos).toHaveLength(0);
  await expect(page.locator('.vendor-form-alert-error')).toContainText('could not confirm');
});

test('admin reviews a directory request, links later event request, then removes directory approval',async({page,request})=>{
  await page.goto('/vendors/apply');
  await page.getByRole('radio',{name:'Join the vendor directory only'}).check();
  await details(page);
  await page.getByRole('button',{name:'Submit Directory Registration'}).click();
  await expect(page.getByText('Directory registration received for review.',{exact:false})).toBeVisible();
  await request.post(`${fixture}/test/mode`,{data:{adminUser:true}});
  await page.goto('/vendors/returning');
  await page.getByLabel('Email address',{exact:true}).fill('owner@example.test');
  await page.getByRole('button',{name:'Email me a sign-in link'}).click();
  await expect(page.getByRole('status')).toContainText('Check your email');
  let state=await(await request.get(`${fixture}/test/state`)).json();
  await page.goto(state.mails.at(-1).url);
  await page.goto('/admin/vendors');
  const queue=page.getByRole('region',{name:'Registration review'});
  await page.getByRole('tab',{name:/Review queue/}).click();
  await queue.getByRole('button',{name:'Review Directory Test Business — Directory only'}).click();
  await queue.getByLabel('Profile to use').selectOption('new');
  page.on('dialog',dialog=>dialog.accept());
  await queue.getByRole('button',{name:'Approve directory listing',exact:true}).click();
  await expect(queue.getByRole('status')).toContainText('Request processed');
  state=await(await request.get(`${fixture}/test/state`)).json();
  const vendor=state.vendors.find((v:{email:string})=>v.email==='directory@example.test');
  expect(vendor.directory_approved).toBe(true);
  await page.goto('/vendors/apply');
  await details(page);
  await page.getByRole('checkbox',{name:/New Event/}).check();
  await page.locator('[name=tables_requested]').selectOption('2');
  await page.getByRole('button',{name:'Submit Application',exact:true}).click();
  await expect(page.getByText('Application received for admin review.',{exact:false})).toBeVisible();
  await page.goto('/admin/vendors');
  await page.getByRole('tab',{name:/Review queue/}).click();
  await queue.getByRole('button',{name:'Review Directory Test Business — Event application'}).click();
  await queue.getByLabel('Profile to use').selectOption(vendor.id);
  await queue.getByRole('button',{name:'Create pending event applications'}).click();
  await expect(queue.getByRole('status')).toContainText('Request processed');
  state=await(await request.get(`${fixture}/test/state`)).json();
  expect(state.applications.filter((a:{vendor_id:string})=>a.vendor_id===vendor.id)).toMatchObject([{application_status:'pending'}]);
  await queue.locator('summary').filter({hasText:'Approved directory listings'}).click();
  await queue.getByRole('button',{name:'Remove directory approval'}).click();
  await expect(queue.getByRole('status')).toContainText('Directory-only approval removed');
});
