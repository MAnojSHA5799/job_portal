require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('jobs').select('experience_level');
  if (error) console.error(error);
  
  const distinct = [...new Set(data.map(d => d.experience_level))];
  console.log('Distinct Experience Levels:', distinct);
}
main();
