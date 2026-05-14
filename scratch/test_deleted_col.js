const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_deleted', false)
    .limit(1);

  if (error) {
    console.error('Error (expected if column missing):', error.message);
  } else {
    console.log('Success! Column exists.');
  }
}

testQuery();
