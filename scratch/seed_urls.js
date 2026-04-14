const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const initialUrls = [
  "https://careers.ril.com/rilcareers/frmJobSearch.aspx",
  "https://careers.smartrecruiters.com/",
  "https://jobs.mercedes-benz.com/en",
  "https://careers.unilever.com/en/search-jobs/India",
  "https://www.hitachienergy.com/careers/open-jobs",
  "https://jobs.tenneco.com/search/?q=engineer&locationsearch=India",
  "https://jobs.heromotocorp.com/search/",
  "https://careers.caterpillar.com/en/jobs/",
  "https://jobs.siemens.com/careers",
];

async function seedUrls() {
  console.log("Seeding initial URLs to database...");
  
  const inserts = initialUrls.map(url => ({ url }));
  
  const { data, error } = await supabase
    .from('scraper_urls')
    .insert(inserts)
    .select();
    
  if (error) {
    console.error("Error seeding:", error.message);
  } else {
    console.log(`Successfully seeded ${data.length} URLs!`);
  }
}

seedUrls();
