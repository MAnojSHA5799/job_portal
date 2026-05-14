const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data found to check columns.');
  }
}

checkColumns();
