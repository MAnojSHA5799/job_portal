const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jwmjqlgoettrifzskrtw.supabase.co', 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi');

async function run() {
  const { data, error } = await supabase.from('jobs').select('*').eq('url_slug', 'senior-consultant-|-sap-native-hana-|-bengaluru-|-sap').single();
  console.log(data);
}
run();
