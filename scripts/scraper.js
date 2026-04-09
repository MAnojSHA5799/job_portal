const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const jobUrls = [
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

async function getOrCreateCompany(name) {
  if (!name) return null;
  const cleanName = name.split('|')[0].split('-')[0].trim();

  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', cleanName)
    .single();

  if (existingCompany) return existingCompany.id;

  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert([{ name: cleanName, industry: 'Technology' }])
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Company Error (${cleanName}):`, error.message);
    return null;
  }
  return newCompany.id;
}

async function scrapeJobs() {
  console.log("🚀 Starting Simplified Multi-Site Scraper...");
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let totalJobsProcessed = 0;
  let allScrapedJobs = [];

  for (const url of jobUrls) {
    try {
      console.log(`🌐 Visiting: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(5000);

      const jobs = await page.evaluate(() => {
        const results = [];
        const jobCards = document.querySelectorAll('a, div, li');

        jobCards.forEach((el) => {
          const text = el.innerText || "";
          if (
            text.toLowerCase().includes("engineer") ||
            text.toLowerCase().includes("developer") ||
            text.toLowerCase().includes("manager")
          ) {
            results.push({
              title: text.split("\n")[0]?.trim().slice(0, 100),
              company: document.title,
              location: text.includes("India") ? "India" : "Remote",
              applyLink: el.href || window.location.href,
              description: text.slice(0, 500)
            });
          }
        });
        return results.slice(0, 20); 
      });

      console.log(`✅ Found ${jobs.length} potential jobs from ${url}`);

      for (const job of jobs) {
        const companyId = await getOrCreateCompany(job.company);
        if (companyId) {
          // Manual check for existing job to avoid 'ON CONFLICT' error
          const { data: existingJob } = await supabase
            .from('jobs')
            .select('id')
            .eq('title', job.title)
            .eq('company_id', companyId)
            .maybeSingle();

          if (!existingJob) {
            const { error: insertError } = await supabase
              .from('jobs')
              .insert([{
                company_id: companyId,
                title: job.title,
                description: job.description || 'No description provided.',
                location: job.location,
                apply_link: job.applyLink,
                source_url: url,
                is_approved: false,
                category: 'Engineering',
                job_type: 'Full-time'
              }]);

            if (!insertError) {
              totalJobsProcessed++;
              allScrapedJobs.push(job);
            } else {
              console.error(`❌ DB Insert Error: ${insertError.message}`);
            }
          } else {
            // console.log(`⏩ Skipping duplicate: ${job.title}`);
          }
        }
      }
    } catch (err) {
      console.log(`❌ Failed: ${url}`, err.message);
    }
  }

  // Save to JSON for verification
  const outputPath = path.join(__dirname, 'scraped_jobs.json');
  fs.writeFileSync(outputPath, JSON.stringify(allScrapedJobs, null, 2));

  console.log(`📦 Total Jobs Processed & Saved to DB: ${totalJobsProcessed}`);
  console.log(`📄 JSON Preview Saved to: ${outputPath}`);

  await browser.close();
}

scrapeJobs().catch(err => console.error("❌ Fatal Error:", err));
