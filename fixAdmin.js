// fixSuperadmin.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (MUST use service role key)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSuperadmin() {
  try {
    console.log('⏳ Creating auth user...');
    
    // Step 1: Create in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'Leoemmanuel93@gmail.com',
      password: 'Tracker@_app%.....12', // Change if needed
      email_confirm: true,
      user_metadata: { full_name: 'Emmanuel' }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️ User already exists in auth.users');
        await linkExistingUser();
        return;
      }
      throw authError;
    }

    // Step 2: Link to admins table
    console.log('🔗 Linking to admins table...');
    const { error: dbError } = await supabase
      .from('admins')
      .update({ 
        auth_id: authUser.user.id,
        is_active: true 
      })
      .eq('email', 'Leoemmanuel93@gmail.com');

    if (dbError) throw dbError;

    console.log('✅ Superadmin successfully fixed!');
    console.log('🔑 New auth_id:', authUser.user.id);

  } catch (error) {
    console.error('❌ Critical error:', error.message);
    process.exit(1);
  }
}

async function linkExistingUser() {
  try {
    console.log('🔍 Fetching existing auth user...');
    const { data: { user } } = await supabase.auth.admin.getUserById('605b7c46-9cc7-4d18-b5f0-245f1a7debd2');
    
    console.log('🔗 Linking existing user to admins table...');
    const { error } = await supabase
      .from('admins')
      .update({ auth_id: user.id })
      .eq('email', 'Leoemmanuel93@gmail.com');

    if (error) throw error;
    console.log('✅ Successfully linked existing auth user!');

  } catch (error) {
    console.error('❌ Linking failed:', error.message);
  }
}

linkExistingUser();