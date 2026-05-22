require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// We need the service role key to bypass RLS, or anon key if RLS is disabled.
// But we didn't see NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local earlier. Let me check.
