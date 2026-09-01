require('dotenv').config();
const { getSupabaseAnon, supabaseAdmin } = require('../src/lib/supabaseClient');

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);

  try {
    // 1. Test ping to auth
    const anon = getSupabaseAnon();
    console.log('1. Checking Supabase Auth endpoint...');
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: signUpData, error: signUpError } = await anon.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: { data: { name: 'Test User' } },
    });

    if (signUpError) {
      console.error('❌ Auth SignUp error:', signUpError.message);
    } else {
      console.log('✅ Supabase Auth signup successful! User ID:', signUpData.user?.id);
    }

    // 2. Check Database Tables
    console.log('2. Checking Database tables with admin client...');
    const { data: groups, error: dbError } = await supabaseAdmin
      .from('groups')
      .select('count', { count: 'exact', head: true });

    if (dbError) {
      console.error('❌ Database error:', dbError.message);
    } else {
      console.log('✅ Database connected and `groups` table is ready!');
    }

    // 3. Check Storage bucket
    console.log('3. Checking Storage `receipts` bucket...');
    const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets();
    if (storageError) {
      console.error('❌ Storage error:', storageError.message);
    } else {
      const hasReceipts = buckets.some(b => b.name === 'receipts');
      if (hasReceipts) {
        console.log('✅ Storage `receipts` bucket found!');
      } else {
        console.warn('⚠️ `receipts` bucket not found in buckets list:', buckets.map(b => b.name));
      }
    }

    console.log('\n--- Live connection check complete! ---');
  } catch (err) {
    console.error('Fatal error during connection test:', err);
  }
}

testConnection();
