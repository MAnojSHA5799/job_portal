import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBlogsTable() {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error or table does not exist:', error.message);
  } else {
    console.log('Blogs table exists. Columns:', Object.keys(data[0] || {}));
  }
}

checkBlogsTable();
