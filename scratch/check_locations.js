const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

async function check() {
  const res = await fetch(`${url}/rest/v1/jobs?select=location,is_approved&limit=50`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log("All Locations:", data.map(d => d.location).filter(Boolean).slice(0, 20));
  
  const res2 = await fetch(`${url}/rest/v1/jobs?location=ilike.*Delhi*&select=location,is_approved`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data2 = await res2.json();
  console.log("Delhi Locations:", data2);
}

check();
