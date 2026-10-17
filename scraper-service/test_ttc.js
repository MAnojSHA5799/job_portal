// Full Parker scraper: listing-based, all pages, save to Supabase
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const listingUrl = 'https://parkercareers.ttcportals.com/search/jobs/in/country/india';
  const origin = 'https://parkercareers.ttcportals.com';
  const page = await context.newPage();
  const allJobs = [];

  let currentUrl = listingUrl;
  let pageNum = 1;

  while (true) {
    console.log(`📄 Page ${pageNum}: ${currentUrl}`);
    await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // Wait for job cards to render (JS-driven site)
    await page.waitForSelector('div.jobs-section__item, .jobs-section__list', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const { jobs, nextUrl } = await page.evaluate((origin) => {
      // Correct selector for TTC portals
      const cards = [...document.querySelectorAll('div.jobs-section__item')];

      const jobs = cards.map(card => {
        // Title + link: p > a
        const a = card.querySelector('p a, a[href*="/jobs/"]');
        if (!a) return null;

        const title = a.innerText.trim();
        if (!title) return null;

        let href = a.getAttribute('href') || '';
        if (href && !href.startsWith('http')) href = origin + href;

        // Location: large-4 columns div (text nodes with commas)
        const locDiv = card.querySelector('.large-4.columns, [class*="large-4"]');
        let location = '';
        if (locDiv) {
          // Remove the hidden span, get remaining text
          const clone = locDiv.cloneNode(true);
          clone.querySelectorAll('.hide').forEach(el => el.remove());
          location = clone.innerText.replace(/\s+/g, ' ').trim().replace(/,\s*$/, '');
        }

        // Date: large-2 columns
        const dateDiv = card.querySelector('.large-2.columns, [class*="large-2"]');
        let date = '';
        if (dateDiv) {
          const clone = dateDiv.cloneNode(true);
          clone.querySelectorAll('.hide-for-large').forEach(el => el.remove());
          date = clone.innerText.replace(/\s+/g, ' ').trim();
        }

        // Job ID from URL
        const jobId = href.split('/').filter(Boolean).pop() || '';

        return {
          title,
          location: location || 'Not Found',
          date: date || 'Not Found',
          url: href,
          jobId
        };
      }).filter(j => j && j.url && j.title);

      // Pagination: "View more jobs" link
      const nextLink = document.querySelector('a.jobs-section__paginate-view-more, a[href*="?page="]');
      let nextUrl = null;
      if (nextLink) {
        let href = nextLink.getAttribute('href') || '';
        if (href && !href.startsWith('http')) href = origin + href;
        nextUrl = href || null;
      }

      return { jobs, nextUrl };
    }, origin);

    console.log(`  ✅ Found ${jobs.length} jobs on page ${pageNum}`);
    jobs.forEach(j => console.log(`     - ${j.title} | ${j.location} | ${j.date}`));
    allJobs.push(...jobs);

    if (!nextUrl) {
      console.log(`  ↳ No more pages. Done.`);
      break;
    }
    console.log(`  ↳ Next page: ${nextUrl}`);
    currentUrl = nextUrl;
    pageNum++;
    await page.waitForTimeout(1500);
  }

  console.log(`\n📦 Total jobs scraped: ${allJobs.length}`);
  await browser.close();

  if (allJobs.length === 0) {
    console.log('No jobs to save!');
    return;
  }

  // Get company_id for Parker
  const { data: companyRows, error: compErr } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%parker%')
    .limit(5);

  console.log('Companies found:', companyRows, compErr);
  const company_id = companyRows?.[0]?.id || null;
  const companyName = companyRows?.[0]?.name || 'Parker Hannifin';

  const jobsToInsert = allJobs.map(job => ({
    title: job.title,
    company_id,
    description: `${job.title} at ${companyName}. Location: ${job.location}. Apply at: ${job.url}`,
    location: job.location,
    salary_range: 'Not Available',
    job_type: 'Full-time',
    experience_level: 'Not Available',
    category: 'Engineering',
    apply_link: job.url,
    source_url: listingUrl,
    date_posted: job.date,
    focus_keyword: job.title,
    url_slug: job.jobId,
    is_approved: false,
  }));



  console.log(`\n💾 Inserting ${jobsToInsert.length} jobs into Supabase...`);

  let saved = 0, skipped = 0;
  for (const job of jobsToInsert) {
    const { error } = await supabase.from('jobs').upsert(job, {
      onConflict: 'apply_link',
      ignoreDuplicates: false
    });
    if (error) {
      console.log(`  ⚠️ Error: ${error.message} | ${job.title}`);
    } else {
      saved++;
      console.log(`  ✅ Saved: ${job.title} | ${job.location} | ${job.date_posted}`);
    }
  }


  console.log(`\n✅ DONE — ${saved} jobs saved to Supabase | ${allJobs.length} total scraped`);

  // Save local backup
  fs.writeFileSync(
    '/Users/manojshakya/Desktop/job_portal/scraper-service/jobs.json',
    JSON.stringify(allJobs, null, 2)
  );
  console.log(`📁 Local backup → jobs.json`);
})();
