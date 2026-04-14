import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function diagnose() {
  console.log('🔍 Starting Supabase Storage Diagnostic...\n');

  // 1. Load Environment Variables
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local not found in current directory.');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

  if (!urlMatch || !keyMatch) {
    console.error('❌ Error: Could not find Supabase URL or Anon Key in .env.local.');
    return;
  }

  const supabaseUrl = urlMatch[1].trim();
  const supabaseAnonKey = keyMatch[1].trim();

  console.log(`📡 Connecting to: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 2. Check Connection
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.warn('⚠️  Auth Status: Not logged in (or session expired). This is expected if you haven\'t signed in yet.');
  } else {
    console.log(`✅ Auth Status: Logged in as ${user.email}`);
  }

  // 3. List Buckets
  console.log('\n📦 Checking Database Schema...');
const { data: columns, error: colError } = await supabase
  .from('vendors')
  .select('*')
  .limit(0);

if (colError) {
  console.log(`❌ Table "vendors" test Error: ${colError.message} (${colError.code})`);
} else {
  console.log('✅ Table "vendors" is accessible.');
}

// Check specifically for logo_url
const { data: logoCol, error: logoError } = await supabase
  .from('vendors')
  .select('logo_url')
  .limit(0);

if (logoError) {
  console.log(`❌ Column "vendors.logo_url" NOT FOUND: ${logoError.message}`);
} else {
  console.log('✅ Column "vendors.logo_url" exists.');
}

  console.log('\n📦 Checking Storage Buckets...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error(`❌ Error listing buckets: ${bucketError.message}`);
    console.log('💡 Hint: This often means RLS is enabled on storage.buckets but no SELECT policy exists.');
  } else {
    console.log(`✅ Successfully retrieved ${buckets.length} buckets.`);
    const bucketNames = buckets.map(b => b.name);
    console.log(`📋 Visible Buckets: ${bucketNames.join(', ') || '(none)'}`);

    if (bucketNames.includes('avatars')) {
      console.log('✨ "avatars" bucket FOUND!');
    } else {
      console.error('❌ "avatars" bucket NOT FOUND in the visible list.');
      console.log('💡 Action: Please ensure you ran the SQL setup or manually created the "avatars" bucket in the Dashboard.');
    }
  }

  // 4. Test specific bucket access
  console.log('\n🧪 Testing "avatars" bucket connectivity...');
  const { data: files, error: listError } = await supabase.storage.from('avatars').list();

  if (listError) {
    console.error(`❌ Connectivity Error: ${listError.message}`);
  } else {
    console.log(`✅ Success! Can read contents of "avatars" bucket (${files.length} items found).`);
    
    // 5. Try a dummy upload
    console.log('\n📤 Attempting dummy upload to "avatars/test.txt"...');
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload('test.txt', 'Hello World', { upsert: true });
    
    if (uploadError) {
      console.error(`❌ Upload Error: ${uploadError.message}`);
      if (uploadError.message === 'Bucket not found') {
        console.log('🧐 This is the error the user is seeing! This confirms the bucket exists for listing but is hidden/invalid for uploads.');
      }
    } else {
      console.log('✅ Success! Can write to "avatars" bucket.');
    }
  }

  console.log('\n🏁 Diagnostic Complete.');
}

diagnose().catch(err => {
  console.error('\n💥 Unexpected Runtime Error:', err);
});
