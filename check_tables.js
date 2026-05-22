import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('industries').select('*').limit(1);
  console.log('industries:', data, error);
  const { data: d2, error: e2 } = await supabase.from('categories').select('*').limit(1);
  console.log('categories:', d2, e2);
}
check();
