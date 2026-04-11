const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedAdmin() {
  const email = 'manoj-final-test@admin.com';
  const password = 'password123';
  const fullName = 'Manoj Admin';

  console.log(`🚀 Seeding admin user: ${email}...`);

  try {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('✅ Admin user already exists. Updating password...');
      const passwordHash = await bcrypt.hash(password, 10);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('email', email);
      
      if (updateError) throw updateError;
      console.log('✅ Password updated successfully.');
      return;
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert into public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: fullName,
        password_hash: passwordHash,
        role: 'admin'
      });

    if (insertError) throw insertError;

    console.log('🎉 Admin user created successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
  }
}

seedAdmin();
