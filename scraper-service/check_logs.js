const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('scraper_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(data);
}
check();
