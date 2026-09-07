import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const fixture = 'http://127.0.0.1:4319';
async function signIn(page: Page, request: APIRequestContext) {
  await page.goto('/vendors/returning');
  await page.getByLabel('Email address', { exact:true }).fill('owner@example.test');
  await page.getByRole('button',{name:'Email me a sign-in link'}).click();
  await expect(page.getByRole('status')).toContainText('Check your email');
  const state=await (await request.get(`${fixture}/test/state`)).json();
  await page.goto(state.mails.at(-1).url);
  await expect(page.getByLabel('Business profile')).toBeVisible();
}
async function requirements(page: Page) {
  await page.getByLabel('Number of tables',{exact:true}).selectOption('2');
  await page.getByLabel('Power requirements',{exact:true}).selectOption('standard');
  await page.getByLabel('Notes for these events').fill('Please allow wheelchair access.');
  await page.getByRole('checkbox',{name:/I agree/}).check();
}
test.beforeEach(async ({request}) => { await request.post(`${fixture}/test/reset`); });

test('email → PKCE session → saved profile → mixed events → receipt → safe retry',async ({page,request}) => {
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await signIn(page,request);
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await expect(page.getByLabel('Business profile')).toHaveValue('20000000-0000-4000-8000-000000000001');
  await page.getByRole('checkbox',{name:/Approved Event/}).check();
  await page.getByRole('checkbox',{name:/New Event/}).check();
  await requirements(page);
  await page.getByRole('button',{name:'Submit selected events'}).click();
  const results=page.getByRole('region',{name:'Application results'});
  await expect(results).toContainText('Already approved');
  await expect(results).toContainText('Application received — pending review');
  await expect(page.getByRole('status')).toContainText('A receipt has been sent');
  await page.getByRole('button',{name:'Submit selected events'}).click();
  await expect(page.getByRole('status')).toContainText('No new applications were created');
  const state=await (await request.get(`${fixture}/test/state`)).json();
  expect(state.receipts).toHaveLength(1);expect(state.receipts[0].status).toBe('sent');
  expect(state.sent).toHaveLength(2); // one admin email + one vendor receipt
  const approved=state.applications.find((x:{application_status:string})=>x.application_status==='approved');
  expect(approved.approved_vendor_fee).toBe('125');expect(approved.invitation_status).toBe('sent');
  expect(state.applications.filter((x:{additional_notes:string})=>x.additional_notes==='Please allow wheelchair access.')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('connection failure preserves inputs; lost save response can be safely retried',async ({page,request}) => {
  await signIn(page,request);await requirements(page);
  await page.getByRole('checkbox',{name:/New Event/}).check();
  await request.post(`${fixture}/test/mode`,{data:{lostResponse:true}});
  await page.getByRole('button',{name:'Submit selected events'}).click();
  await expect(page.getByRole('status')).toContainText('could not confirm the save');
  await expect(page.getByLabel('Notes for these events')).toHaveValue('Please allow wheelchair access.');
  await expect(page.getByRole('checkbox',{name:/New Event/})).toBeChecked();
  await expect(page.getByLabel('Number of tables',{exact:true})).toHaveValue('2');
  await page.getByRole('button',{name:'Submit selected events'}).click();
  await expect(page.getByRole('region',{name:'Application results'})).toContainText('Pending review');
  const state=await (await request.get(`${fixture}/test/state`)).json();
  expect(state.receipts).toHaveLength(1);expect(state.sent).toHaveLength(2);
});

test('email provider failure never reports the saved application as failed',async ({page,request}) => {
  await signIn(page,request);await requirements(page);
  await page.getByRole('checkbox',{name:/New Event/}).check();
  await request.post(`${fixture}/test/mode`,{data:{emailFailure:true}});
  await page.getByRole('button',{name:'Submit selected events'}).click();
  await expect(page.getByRole('status')).toContainText('receipt is still pending');
  await expect(page.getByRole('region',{name:'Application results'})).toContainText('Application received');
  const state=await (await request.get(`${fixture}/test/state`)).json();
  expect(state.receipts[0].status).toBe('failed');
});

test('mobile form and declined/waitlisted outcomes are clear without reopening applications',async ({page,request}) => {
  await page.setViewportSize({width:390,height:844});
  await signIn(page,request);await requirements(page);
  await page.getByRole('checkbox',{name:/Declined Event/}).check();
  await page.getByRole('checkbox',{name:/Waitlisted Event/}).check();
  await page.getByRole('button',{name:'Submit selected events'}).click();
  const results=page.getByRole('region',{name:'Application results'});
  await expect(results).toContainText('Previously declined');await expect(results).toContainText('On the waitlist');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const state=await (await request.get(`${fixture}/test/state`)).json();expect(state.sent).toHaveLength(0);
});

test('invalid sign-in links and email sending errors have recoverable feedback',async ({page,request}) => {
  await page.goto('/vendors/auth/callback?code=expired&next=https://example.com');
  await expect(page).toHaveURL(/\/vendors\/returning\?error=sign_in$/);
  await expect(page.getByRole('alert').filter({hasText:'expired'})).toContainText('expired');
  await request.post(`${fixture}/test/mode`,{data:{authFailure:true}});
  await page.getByLabel('Email address',{exact:true}).fill('owner@example.test');
  await page.getByRole('button',{name:'Email me a sign-in link'}).click();
  await expect(page.getByRole('status')).toContainText('could not send a sign-in link');
  await expect(page.getByLabel('Email address',{exact:true})).toHaveValue('owner@example.test');
});
