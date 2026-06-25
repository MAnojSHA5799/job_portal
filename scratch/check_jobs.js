const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('jobs').select('location').limit(10);
  console.log('Sample locations:', data);
  
  const { data: d2 } = await supabase.from('jobs').select('location').ilike('location', '%Delhi%').limit(5);
  console.log('Delhi jobs:', d2);
  
  const { data: d3 } = await supabase.from('jobs').select('location').ilike('location', '%delhi ncr%').limit(5);
  console.log('delhi ncr jobs:', d3);
}

check();
