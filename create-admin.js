const { createClient } = require('@supabase/supabase-js');

// We need the service role key to create users and bypass RLS
// Check if SUPABASE_SERVICE_ROLE_KEY is set
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set!');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key (secret)');
  console.error('Then run: SUPABASE_SERVICE_ROLE_KEY=your_key node /tmp/create-admin.js');
  process.exit(1);
}

const supabase = createClient(
  'https://gzebdkjlwtcgdjxbxpwf.supabase.co',
  serviceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createAdmin() {
  const email = 'admin@collectorsparadise.com';
  const password = '@Collectors2026!23';

  // Step 1: Create the auth user
  console.log('Creating admin auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: 'Admin' }
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      console.log('User already exists in Auth, fetching existing user...');
      // Try to get the user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError.message);
        process.exit(1);
      }
      const existingUser = users.users.find(u => u.email === email);
      if (existingUser) {
        console.log('Found existing user ID:', existingUser.id);
        // Step 2: Insert into admin_users
        const { error: insertError } = await supabase
          .from('admin_users')
          .upsert({ user_id: existingUser.id, role: 'admin' }, { onConflict: 'user_id' });
        
        if (insertError) {
          console.error('Error inserting into admin_users:', insertError.message);
          process.exit(1);
        }
        console.log('✅ Admin user successfully set up!');
        console.log('   Email:', email);
        console.log('   User ID:', existingUser.id);
        return;
      }
    }
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log('Auth user created with ID:', userId);

  // Step 2: Insert into admin_users table
  console.log('Inserting into admin_users table...');
  const { error: insertError } = await supabase
    .from('admin_users')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });

  if (insertError) {
    console.error('Error inserting into admin_users:', insertError.message);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!');
  console.log('   Email:', email);
  console.log('   User ID:', userId);
}

createAdmin();
