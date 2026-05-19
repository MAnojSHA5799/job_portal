import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .eq('url_slug', 'territory-sales-officer-navi-mumbai')
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return;
  }

  const descPath = path.join(__dirname, 'description.html');
  fs.writeFileSync(descPath, data.description || '');
  console.log('Saved description to', descPath);
  console.log('MEDIA URL IN DB:', data.media_url);
}

main();
