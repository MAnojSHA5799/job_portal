console.log("⚡ Scraper Script Loaded");
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ════════════════════════════════════════════════════════════════════════════
// 🔐  SUPABASE CONFIG
// ════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL      = process.env.SUPABASE_URL      || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ════════════════════════════════════════════════════════════════════════════
// ⚙️  FILTERS — CLI se base64 encoded JSON aata hai
// ════════════════════════════════════════════════════════════════════════════
let scraperFilters = {
  jobType:         'All',   // 'All' | 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  jobAge:          'Any',   // 'Any' | '1' | '7' | '30'  (days)
  experienceLevel: 'All',   // 'All' | 'Fresher' | 'Mid' | 'Senior'
  duplicateJob:    'Skip',  // 'Skip' | 'Overwrite'
  country:         'All',   // 'All' | 'India' | 'US' | ...
  maxDescLength:   0,       // 0 = full description save karo, >0 = trim at N chars
  target:          'All Data', // 'All Data' | 'New Only'
};

if (process.argv[2]) {
  try {
    const decoded = Buffer.from(process.argv[2], 'base64').toString('utf8');
    scraperFilters = { ...scraperFilters, ...JSON.parse(decoded) };
    console.log("🛠️  Applied Scraper Filters:", scraperFilters);
  } catch (err) {
    console.error("⚠️  Failed to parse filters:", err.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🏁  MAIN
// ════════════════════════════════════════════════════════════════════════════
let currentExistingLinks = new Set();

let currentTargetExtra = {};

(async () => {
  console.log("🚀 Starting Playwright Multi-ATS Scraper...");
  global.processedUrls = new Set();

  // ── Supabase se active URLs fetch karo ya specific URL use karo ─────────
  let allTargets = [];

  try {
    if (scraperFilters.targetUrl) {
      const targetUrl = scraperFilters.targetUrl;
      
      // Fetch target details from DB even for single URL
      const { data: existing } = await supabase
        .from('scraper_urls')
        .select('id, url, company_name, location')
        .eq('url', targetUrl)
        .single();

      if (existing) {
        allTargets = [existing];
        console.log(`📊 Scrape single target URL from DB: ${targetUrl} (${existing.company_name || 'No Name'})`);
      } else {
        // Fallback for URLs not yet in DB
        allTargets = [{ url: targetUrl }];
        console.log(`📊 Scrape single target URL (Not in DB): ${targetUrl}`);
        
        try {
          await supabase.from('scraper_urls').insert([{ url: targetUrl, is_active: true }]);
          console.log(`📝 Added new target URL to database: ${targetUrl}`);
        } catch (err) {}
      }
    } else {
      const { data: targetUrls, error: urlsError } = await supabase
        .from('scraper_urls')
        .select('id, url, company_name, location')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (urlsError) {
        console.error("⚠️  URL Fetch Error:", urlsError.message);
      } else {
        const fullTargets = targetUrls || [];
        
        if (scraperFilters.target === 'New Only') {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recentLogs } = await supabase
            .from('scraper_logs')
            .select('error_message')
            .eq('status', 'completed')
            .gt('created_at', twentyFourHoursAgo);
          
          const recentlyScraped = new Set((recentLogs || []).map(l => l.error_message));
          allTargets = fullTargets.filter(t => !recentlyScraped.has(t.url));
          console.log(`📊 Found ${fullTargets.length} active URLs. Filtering for 'New Only': ${allTargets.length} to process.`);
        } else {
          allTargets = fullTargets;
          console.log(`📊 Found ${allTargets.length} active URLs in database.`);
        }
      }
    }

  } catch (err) {
    console.error("❌ Supabase connection error:", err.message);
  }

  if (allTargets.length === 0) {
    console.log("⚠️  No active target URLs found. Check 'scraper_urls' table.");
    process.exit(0);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  let totalJobsSaved = 0;
  const allResults = [];

  // ════════════════════════════════════════════════════════════════════════
  // 📋  LISTING URLS LOOP
  // ════════════════════════════════════════════════════════════════════════
  for (const target of allTargets) {
    const listingUrl = target.url;
    const targetId   = target.id;
    
    // Set current target extra info from DB (Admin settings)
    currentTargetExtra = { 
      company:  target.company_name, 
      location: target.location 
    };

    let runLogId = null;
    const page = await context.newPage();


    try {
      // ── Scraper log entry ──────────────────────────────────────────────
      const { data: newLog } = await supabase
        .from('scraper_logs')
        .insert([{ status: 'running', jobs_found: 0, error_message: listingUrl }])
        .select('id')
        .single();
      runLogId = newLog?.id;

      // ── URL se ATS type detect karo ───────────────────────────────────
      let type = detectTypeFromUrl(listingUrl);
      console.log(`\n📋 [URL-detect: ${type || '?'}] ${listingUrl}`);

      // ── Page load ─────────────────────────────────────────────────────
      await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(() => {});

      // ── DOM se detect karo agar URL se nahi mila ──────────────────────
      if (!type) {
        type = await detectTypeFromDom(page);
        console.log(`  🔬 DOM-detect: ${type}`);
      }
      console.log(`  ✅ Final type: [${type}]`);

      // ── ✨ NEW: Fetch existing links to skip detail scraping ───────────
      const { data: existingJobsForUrl } = await supabase
        .from('jobs')
        .select('apply_link')
        .eq('source_url', listingUrl);
      currentExistingLinks = new Set((existingJobsForUrl || []).map(j => j.apply_link));

      // ── ATS-specific scraper call ──────────────────────────────────────
      const jobsBatch = [];

      if      (type === 'ril')                 { await scrapeRil(page, context, listingUrl, jobsBatch); }
      else if (type === 'darwinbox')           { await page.waitForSelector('.job-tile', { timeout: 25000 }).catch(() => {}); await autoScroll(page); await scrapeDarwinbox(page, context, listingUrl, jobsBatch); }
      else if (type === 'caterpillar')         { await page.waitForSelector('.card.card-job', { timeout: 25000 }).catch(() => {}); await scrapeCaterpillarAllPages(page, context, jobsBatch); }
      else if (type === 'smartrecruiters')     { await scrapeSmartRecruiters(page, context, listingUrl, jobsBatch); }
      else if (type === 'smartrecruiters_jobs'){ await scrapeSmartRecruitersJobs(page, context, listingUrl, jobsBatch); }
      else if (type === 'workday')             { await scrapeWorkday(page, context, listingUrl, jobsBatch); }
      else if (type === 'oracle')              { await scrapeOracle(page, context, listingUrl, jobsBatch); }
      else if (type === 'csod')                { await scrapeCsod(page, context, listingUrl, jobsBatch); }
      else if (type === 'lever')               { await scrapeLever(page, context, listingUrl, jobsBatch); }
      else if (type === 'greenhouse')          { await scrapeGreenhouse(page, context, listingUrl, jobsBatch); }
      else if (type === 'taleo')               { await scrapeTaleo(page, context, listingUrl, jobsBatch); }
      else if (type === 'icims')               { await scrapeIcims(page, context, listingUrl, jobsBatch); }
      else if (type === 'successfactors')      { await scrapeSuccessFactors(page, context, listingUrl, jobsBatch); }
      else if (type === 'brassring')           { await scrapeBrassring(page, context, listingUrl, jobsBatch); }
      else if (type === 'jobvite')             { await scrapeJobvite(page, context, listingUrl, jobsBatch); }
      else if (type === 'ashby')               { await scrapeAshby(page, context, listingUrl, jobsBatch); }
      else if (type === 'naukri_embed')        { await scrapeNaukriEmbed(page, context, listingUrl, jobsBatch); }
      else if (type === 'mercedes')            { await scrapeMercedes(page, context, listingUrl, jobsBatch); }
      else if (type === 'unilever')            { await scrapeUnilever(page, context, listingUrl, jobsBatch); }
      else if (type === 'hitachi')             { await scrapeHitachi(page, context, listingUrl, jobsBatch); }
      else if (type === 'siemens')             { await scrapeSiemens(page, context, listingUrl, jobsBatch); }
      else if (type === 'honeywell')           { await scrapeHoneywell(page, context, listingUrl, jobsBatch); }
      else if (type === 'royal_enfield')       { await scrapeRoyalEnfield(page, context, listingUrl, jobsBatch); }
      else if (type === 'bajaj_auto')          { await scrapeBajajAuto(page, context, listingUrl, jobsBatch); }
      else if (type === 'aditya_birla')        { await scrapeAdityaBirla(page, context, listingUrl, jobsBatch); }
      else if (type === 'panasonic')           { await scrapePanasonic(page, context, listingUrl, jobsBatch); }
      else if (type === 'paramai')             { await scrapeParamai(page, context, listingUrl, jobsBatch); }
      else                                     { await scrapeGenericListing(page, context, listingUrl, jobsBatch); }

      console.log(`  📦 ${jobsBatch.length} jobs scraped from this URL`);
      allResults.push(...jobsBatch);

      // ── Filter + Supabase Save ─────────────────────────────────────────
      const urlJobsSaved = await filterAndSaveJobs(jobsBatch, listingUrl, runLogId);
      totalJobsSaved += urlJobsSaved;

      // Update last_scraped_at for this target
      if (targetId) {
        await supabase
          .from('scraper_urls')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', targetId);
      }


      if (runLogId) {
        await supabase.from('scraper_logs').update({
          status: 'completed',
          jobs_found: urlJobsSaved,
          error_message: listingUrl,
        }).eq('id', runLogId);
      }

    } catch (err) {
      console.log(`❌ Fail: ${err.message}`);
      allResults.push({ url: listingUrl, error: true, message: err.message });
      if (runLogId) {
        await supabase.from('scraper_logs').update({
          status: 'failed',
          error_message: err.message,
        }).eq('id', runLogId);
      }
    }

    await page.close();
  }

  // ════════════════════════════════════════════════════════════════════════
  // 💾  Local backup + close
  // ════════════════════════════════════════════════════════════════════════
  fs.writeFileSync('jobs.json', JSON.stringify(allResults, null, 2));
  console.log(`\n✅ DONE — ${totalJobsSaved} jobs saved to Supabase | ${allResults.length} total scraped`);
  console.log('📁 Local backup → jobs.json');

  await browser.close();
  process.exit(0);
})();


// ════════════════════════════════════════════════════════════════════════════
// 🧹  DATA CLEANING HELPERS
// ════════════════════════════════════════════════════════════════════════════

function cleanTitle(t = '') {
  // \"TERRITORY MANAGER-SALES\nApply now »\" → \"TERRITORY MANAGER-SALES\"
  return t.replace(/\n.*$/s, '').replace(/Apply now »/gi, '').trim();
}

// ✅ FIX 1: cleanLocation — \"Job Segment:\" garbage hata ke real city nikalo
function cleanLocation(loc = '') {
  if (!loc) return 'Not Found';

  // \"Job Segment: Field Sales, ...\" jaisi garbage string — poori hata do
  if (/^Job Segment:/i.test(loc.trim())) return 'Not Found';

  // Agar multiple lines hain, pehli meaningful line lo
  const lines = loc.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // \"Job Segment:\" wali line skip karo
    if (/^Job Segment:/i.test(line)) continue;
    // Sirf punctuation ya numbers nahi honi chahiye
    if (line.length < 2) continue;
    return line;
  }

  return 'Not Found';
}

function cleanSalary(s = '') {
  if (!s) return 'Not Available';
  const trimmed = s.replace(/\s+/g, ' ').trim();
  // Koi real number nahi → Not Available
  if (!/\d+/.test(trimmed)) return 'Not Available';
  // \"rs, - rs, pa\" or \"rs, - $1 - rs,\" jaisi mixed garbage patterns
  // Real salary = actual amount (100+) ke saath honi chahiye
  const numbers = trimmed.match(/\d+/g) || [];
  const hasRealAmount = numbers.some(n => parseInt(n) >= 100);
  if (!hasRealAmount) return 'Not Available';
  return trimmed;
}

function cleanExperience(exp = '') {
  if (!exp) return 'Not Found';
  const n = parseInt(exp);
  // \"22 years\" jaisa clearly absurd value → Not Found
  if (!isNaN(n) && n > 20 && !/fresher|entry/i.test(exp)) return 'Not Found';
  return exp.trim();
}

// ✅ FIX 2: cleanDescription — koi bhi boilerplate cut NAHI karega, poora save hoga
function cleanDescription(desc = '') {
  if (!desc || desc === 'Not Found') return 'Not Found';
  // Sirf whitespace normalize karo, koi cutting nahi
  return desc.trim();
}

function cleanDate(d = '') {
  if (!d || d === 'Not Found') return new Date().toISOString().split('T')[0];
  // \"Mon Apr 27 00:00:00 UTC 2026\" → \"2026-04-27\"
  const parsed = new Date(d);
  return isNaN(parsed.getTime())
    ? new Date().toISOString().split('T')[0]
    : parsed.toISOString().split('T')[0];
}

function deriveJobType(title = '', desc = '') {
  const t = (title + ' ' + desc).toLowerCase();
  if (/intern|internship/i.test(t))  return 'Internship';
  if (/contract|freelance/i.test(t)) return 'Contract';
  if (/part.time/i.test(t))          return 'Part-time';
  return 'Full-time';
}

function deriveCategory(title = '') {
  if (/engineer|developer|architect|tech|software|hardware|devops|data|cloud/i.test(title)) return 'Engineering';
  if (/sales|territory|business.?dev|bd manager/i.test(title))                             return 'Sales';
  if (/hr|human.?resource|talent|recruit/i.test(title))                                     return 'HR';
  if (/finance|account|audit|tax/i.test(title))                                             return 'Finance';
  if (/market|brand|digital|content/i.test(title))                                          return 'Marketing';
  if (/design|ux|ui|creative/i.test(title))                                                 return 'Design';
  return 'General';
}


// ════════════════════════════════════════════════════════════════════════════
// 🔽  FILTER + CLEAN + SUPABASE SAVE
// ════════════════════════════════════════════════════════════════════════════
async function filterAndSaveJobs(jobs, sourceUrl, runLogId) {
  let saved = 0;

  // ── Step 1: Deduplicate batch by applyLink + jobId ─────────────────────
  const seenKeys = new Set();
  const uniqueJobs = jobs.filter(job => {
    if (job.error) return false;
    const key = (job.jobId && job.jobId !== 'Not Found') ? job.jobId : job.applyLink;
    if (!key || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
  const dupsRemoved = jobs.length - uniqueJobs.length;
  if (dupsRemoved > 0) console.log(`  🔁 Duplicates removed from batch: ${dupsRemoved}`);

  // ── Step 2: Existing jobs in DB for this source URL ────────────────────
  const { data: existingJobsForUrl } = await supabase
    .from('jobs')
    .select('id, apply_link, is_approved')
    .eq('source_url', sourceUrl);
  const existingLinks = new Map((existingJobsForUrl || []).map(j => [j.apply_link, j]));

  // ── Step 3: Stale jobs cleanup ─────────────────────────────────────────
  const scrapedLinks = new Set(uniqueJobs.map(j => j.applyLink).filter(Boolean));
  const jobsToDelete = (existingJobsForUrl || []).filter(j => !scrapedLinks.has(j.apply_link));
  for (const stale of jobsToDelete) {
    await supabase.from('jobs').delete().eq('id', stale.id);
    console.log(`  🗑️  Deleted stale job id=${stale.id}`);
  }

  // ── Step 4: Company ID for scraper_logs ────────────────────────────────
  if (uniqueJobs.length > 0 && runLogId) {
    const cid = await getOrCreateCompany(uniqueJobs[0].company);
    if (cid) await supabase.from('scraper_logs').update({ company_id: cid }).eq('id', runLogId);
  }

  // ── Step 5: Process each job ───────────────────────────────────────────
  for (const job of uniqueJobs) {

    // ── Skip processing if we already skipped detail page (in DB) ────────
    if (job.isAlreadyInDb) {
      continue;
    }

    // ── Clean raw scraped data ───────────────────────────────────────────
    const title       = cleanTitle(job.title);
    const location    = cleanLocation(job.location);
    const salary      = cleanSalary(job.salary);
    const experience  = cleanExperience(job.experience);
    const date_posted = cleanDate(job.date);
    const jobTypeFinal = scraperFilters.jobType !== 'All'
      ? scraperFilters.jobType
      : deriveJobType(title, job.description || '');
    const category = deriveCategory(title);

    // Description clean (poora save, koi trim nahi)
    let description = cleanDescription(job.description || '');
    if (scraperFilters.maxDescLength > 0 && description.length > scraperFilters.maxDescLength) {
      description = description.slice(0, scraperFilters.maxDescLength) + '...';
    }

    // ── Skip if no title or applyLink ────────────────────────────────────
    if (!title || title === 'Not Found') {
      console.log(`  ⏭️  Skip (no title): ${job.url || ''}`);
      continue;
    }
    if (!job.applyLink || job.applyLink === 'Not Found') {
      console.log(`  ⏭️  Skip (no applyLink): ${title}`);
      continue;
    }

    // ── FILTER: jobAge ───────────────────────────────────────────────────
    if (scraperFilters.jobAge !== 'Any') {
      const maxDays = parseInt(scraperFilters.jobAge);
      if (!isNaN(maxDays)) {
        const posted = new Date(date_posted);
        const diffDays = (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24);
        if (!isNaN(diffDays) && diffDays > maxDays) {
          console.log(`  ⏭️  Skip (too old ${Math.round(diffDays)}d): ${title}`);
          continue;
        }
      }
    }

    // ── FILTER: country ──────────────────────────────────────────────────
    if (scraperFilters.country !== 'All') {
      const countryFilter = scraperFilters.country.toLowerCase();
      const locLower = location.toLowerCase();
      let match = locLower.includes(countryFilter);
      
      if (!match && countryFilter === 'india') {
        const indianCities = [
          'india', ', in', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'noida', 'gurgaon', 'gurugram', 
          'chennai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 
          'chandigarh', 'indore', 'coimbatore', 'nagpur', 'vadodara', 'kochi', 'visakhapatnam', 
          'surat', 'patna', 'ludhiana', 'agra', 'nashik', 'meerut', 'rajkot', 'varanasi', 'srinagar',
          'dharuhera', 'haridwar', 'neemrana', 'halol', 'chittoor', 'mysore', 'mysuru',
          'karnataka', 'maharashtra', 'gujarat', 'tamil nadu', 'telangana', 'kerala', 'haryana', 'uttar pradesh',
          'multiple locations'
        ];
        match = indianCities.some(city => locLower.includes(city));
      }

      if (!match) {
        console.log(`  ⏭️  Skip (country mismatch): ${title}`);
        continue;
      }
    }

    // ── FILTER: experienceLevel ──────────────────────────────────────────
    if (scraperFilters.experienceLevel !== 'All') {
      const exp = experience.toLowerCase();
      const levelMap = {
        fresher: ['fresher', 'entry', '0', '1 year', '1year'],
        mid:     ['mid', '2', '3', '4', '5'],
        senior:  ['senior', 'lead', 'principal', 'staff', '6', '7', '8', '9', '10'],
      };
      const keywords = levelMap[scraperFilters.experienceLevel.toLowerCase()] || [];
      if (!keywords.some(k => exp.includes(k))) {
        console.log(`  ⏭️  Skip (exp mismatch '${scraperFilters.experienceLevel}'): ${title}`);
        continue;
      }
    }

    // ── Derived slug fields ──────────────────────────────────────────────
    const companyId    = await getOrCreateCompany(job.company);
    if (!companyId) continue;

    const focusKeyword = `${title} ${location.split(',')[0]}`.trim();
    const url_slug     = focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingJob  = existingLinks.get(job.applyLink);

    if (existingJob) {
      // ── DUPLICATE: Skip ──────────────────────────────────────────────
      if (scraperFilters.duplicateJob === 'Skip') {
        console.log(`  ⏭️  Skip duplicate: ${title}`);
        continue;
      }
      // ── DUPLICATE: Overwrite ─────────────────────────────────────────
      const { error } = await supabase.from('jobs').update({
        title,
        company_id:       companyId,
        description,
        location,
        salary_range:     salary,
        job_type:         jobTypeFinal,
        experience_level: experience,
        category,
        source_url:       sourceUrl,
        date_posted,
        focus_keyword:    focusKeyword,
        url_slug,
        // is_approved — intentionally NOT updated
      }).eq('id', existingJob.id);

      if (!error) { saved++; console.log(`  💾 Updated: ${title} | ${location} | ${job.company}`); }
      else console.error(`  ❌ Update error (${title}):`, error.message);

    } else {
      // ── NEW JOB: Insert ──────────────────────────────────────────────
      const { error } = await supabase.from('jobs').insert([{
        title,
        company_id:       companyId,
        description,
        location,
        salary_range:     salary,
        job_type:         jobTypeFinal,
        experience_level: experience,
        category,
        apply_link:       job.applyLink,
        source_url:       sourceUrl,
        date_posted,
        focus_keyword:    focusKeyword,
        url_slug,
        is_approved:      false,
      }]);

      if (!error) { saved++; console.log(`  💾 Saved: ${title} | ${location} | ${job.company}`); }
      else console.error(`  ❌ Insert error (${title}):`, error.message);
    }
  }

  return saved;
}


// ════════════════════════════════════════════════════════════════════════════
// 🏢  COMPANY HELPER
// ════════════════════════════════════════════════════════════════════════════
async function getOrCreateCompany(name) {
  if (!name || name === 'Not Found') return null;
  const cleanName = name.split('|')[0].split('-')[0].split('–')[0].trim();

  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', cleanName)
    .single();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('companies')
    .insert([{ name: cleanName, industry: 'Technology' }])
    .select('id')
    .single();
  if (error) { console.error(`❌ Company Error (${cleanName}):`, error.message); return null; }
  return created.id;
}


// ════════════════════════════════════════════════════════════════════════════
// 🎯  LEVEL 1 — URL Pattern se Type Detect
// ════════════════════════════════════════════════════════════════════════════
function detectTypeFromUrl(url) {
  const u = url.toLowerCase();

  if (u.includes('darwinbox.in') || u.includes('darwinbox.com'))          return 'darwinbox';
  if (u.includes('myworkdayjobs.com') || u.includes('workday.com'))       return 'workday';
  if (u.includes('csod.com'))                                              return 'csod';
  if (u.includes('oraclecloud.com') && u.includes('hcmui'))               return 'oracle';
  if (u.includes('nayaraenergy.com') && u.includes('hcmui'))              return 'oracle';
  if (u.includes('nayaraenergy.com'))                                      return 'oracle';
  if (u.includes('taleo.net') || u.includes('ibegin.tcs.com'))            return 'taleo';
  if (u.includes('jobs.lever.co'))                                         return 'lever';
  if (u.includes('greenhouse.io') || u.includes('boards.greenhouse'))     return 'greenhouse';
  if (u.includes('icims.com'))                                             return 'icims';
  if (u.includes('successfactors.com') || u.includes('sapsf.com'))        return 'successfactors';
  if (u.includes('brassring.com') || u.includes('kenexa.com'))            return 'brassring';
  if (u.includes('jobvite.com'))                                           return 'jobvite';
  if (u.includes('ashbyhq.com') || u.includes('jobs.ashby'))              return 'ashby';
  if (u.includes('param.ai'))                                              return 'paramai';
  if (u.includes('caterpillar.com/en/jobs'))                               return 'caterpillar';
  if (u.includes('careers.ril.com'))                                       return 'ril';
  if (u.includes('mercedes-benz.com') || u.includes('jobs.mercedes'))     return 'mercedes';
  if (u.includes('careers.unilever.com'))                                  return 'unilever';
  if (u.includes('hitachienergy.com') || u.includes('hitachi.com'))       return 'hitachi';
  if (u.includes('jobs.siemens.com'))                                      return 'siemens';
  if (u.includes('careers.honeywell.com'))                                 return 'honeywell';
  if (u.includes('careers.royalenfield.com'))                              return 'royal_enfield';
  if (u.includes('bajajauto.com/careers'))                                 return 'bajaj_auto';
  if (u.includes('careers.adityabirla.com'))                               return 'aditya_birla';
  if (u.includes('panasonic.com'))                                         return 'panasonic';
  if (u.includes('heromotocorp.com') || u.includes('tenneco.com'))        return 'successfactors';

  // SmartRecruiters
  if (u.includes('careers.smartrecruiters.com'))                           return 'smartrecruiters';
  if (u.includes('smartrecruiters.com') ||
    (u.includes('/search/') && (u.includes('jobs.') || u.includes('careers.'))))
                                                                            return 'smartrecruiters_jobs';

  return null;
}


// ════════════════════════════════════════════════════════════════════════════
// 🔬  LEVEL 2 — DOM Fingerprint se Type Detect
// ════════════════════════════════════════════════════════════════════════════
async function detectTypeFromDom(page) {
  return await page.evaluate(() => {
    const html    = document.documentElement.innerHTML.toLowerCase();
    const scripts = [...document.querySelectorAll('script[src]')].map(s => s.src.toLowerCase()).join(' ');
    const url     = window.location.href.toLowerCase();
    const metaApp = document.querySelector('meta[name="application-name"]')?.content?.toLowerCase() || '';

    if (document.querySelector('[data-automation-id="jobTitle"]') || scripts.includes('workday') || url.includes('workday')) return 'workday';
    if (document.querySelector('.job-tile') || html.includes('darwinbox')) return 'darwinbox';
    if (document.querySelector('.js-jobs-list-item') || document.querySelector('li[data-job-id]') || metaApp.includes('smartrecruiters') || html.includes('smartrecruiters')) return 'smartrecruiters_jobs';
    if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
    if (document.querySelector('[class*="rec-listing"]') || html.includes('csod')) return 'csod';
    if (document.querySelector('.requisitionListItem') || html.includes('oraclecloud') || html.includes('hcmui')) return 'oracle';
    if (html.includes('successfactors') || scripts.includes('successfactors')) return 'successfactors';
    if (html.includes('taleo') || url.includes('taleo')) return 'taleo';
    if (document.querySelector('.posting') || html.includes('lever.co')) return 'lever';
    if (document.querySelector('.opening') || html.includes('greenhouse')) return 'greenhouse';
    if (html.includes('icims')) return 'icims';
    if (html.includes('brassring') || html.includes('kenexa')) return 'brassring';
    if (document.querySelector('[class*="jv-"]') || html.includes('jobvite')) return 'jobvite';
    if (html.includes('ashbyhq')) return 'ashby';
    if (html.includes('param.ai') || document.querySelector('[class*="JobCard"]')) return 'paramai';
    if (document.querySelector('.card.card-job')) return 'caterpillar';
    if (html.includes('naukri') || document.querySelector('[class*="naukri"]')) return 'naukri_embed';

    // New site fingerprints
    if (url.includes('ril.com')) return 'ril';
    if (html.includes('mercedes-benz') || document.querySelector('[class*="job-listing-item"]')) return 'mercedes';
    if (html.includes('unilever') || document.querySelector('[class*="job-search-results"]')) return 'unilever';
    if (html.includes('hitachi') || document.querySelector('[class*="job-result"]')) return 'hitachi';
    if (html.includes('siemens') || document.querySelector('[class*="sc-job"]')) return 'siemens';
    if (html.includes('honeywell') || document.querySelector('[class*="jobs-list"]')) return 'honeywell';
    if (url.includes('royalenfield')) return 'royal_enfield';
    if (url.includes('bajajauto')) return 'bajaj_auto';
    if (html.includes('adityabirla')) return 'aditya_birla';
    if (url.includes('panasonic')) return 'panasonic';

    return 'generic_listing';
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 🏭  RIL — Reliance Industries (ASP.NET GridView)
// Selector: table#dgJobs / tr with job rows
// ════════════════════════════════════════════════════════════════════════════
async function scrapeRil(page, context, listingUrl, results) {
  // RIL uses ASP.NET WebForms — wait for GridView table
  await page.waitForSelector('#dgJobs, table.grid, .joblisting, [id*="GridView"], [id*="Job"]', { timeout: 30000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Try GridView rows
    let rows = [...document.querySelectorAll('#dgJobs tr, table.grid tr, [id*="GridView"] tr')].filter(r => r.querySelector('a'));
    if (!rows.length) {
      // Fallback: any link with jobId param
      return [...document.querySelectorAll('a[href*="jobId"], a[href*="JobId"], a[href*="job_id"]')].map(a => ({
        title: a.innerText?.trim() || 'Not Found',
        location: a.closest('tr')?.querySelectorAll('td')[1]?.innerText?.trim() || 'Not Found',
        detailUrl: a.href,
      }));
    }
    return rows.slice(1).map(row => { // skip header row
      const cells = row.querySelectorAll('td');
      const a = row.querySelector('a');
      return {
        title:    a?.innerText?.trim() || cells[0]?.innerText?.trim() || 'Not Found',
        location: cells[2]?.innerText?.trim() || cells[1]?.innerText?.trim() || 'Not Found',
        experience: cells[3]?.innerText?.trim() || 'Not Found',
        detailUrl: a?.href || '',
      };
    });
  });

  console.log(`  ↳ RIL: ${jobLinks.length} jobs`);
  for (const job of jobLinks) {
    await visitDetailPage(context, job, 'ril', results, { company: 'Reliance Industries Ltd' });
    await delay(500);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🦅  DARWINBOX
// ════════════════════════════════════════════════════════════════════════════
async function scrapeDarwinbox(page, context, listingUrl, results) {
  const jobLinks = await page.evaluate((base) => {
    // 1. Table-based layout (e.g., Ashok Leyland)
    const tableRows = [...document.querySelectorAll('table.db-table-one tbody tr, .table-details tr')].filter(tr => tr.innerText.trim());
    if (tableRows.length) {
       return tableRows.map(tr => {
         const titleA = tr.querySelector('td[data-th=\"Job title\"] a') || tr.querySelector('a');
         const loc    = tr.querySelector('td[data-th=\"Location\"]') || tr.querySelectorAll('td')[2];
         const dept   = tr.querySelector('td[data-th=\"Department\"]') || tr.querySelectorAll('td')[1];
         return {
           title:     titleA?.innerText?.trim() || 'Not Found',
           location:  loc?.innerText?.trim() || 'Not Found',
           detailUrl: titleA ? new URL(titleA.getAttribute('href'), base).href : '',
           extra: { department: dept?.innerText?.trim() }
         };
       }).filter(j => j.detailUrl && j.title !== 'Not Found');
    }

    // 2. Tile-based layout (Traditional Darwinbox)
    return [...document.querySelectorAll('.job-tile')].map(tile => {
      const subs = tile.querySelectorAll('.sub-section');
      const rel  = tile.querySelector('a.db-btn')?.getAttribute('href') || '';
      return {
        title:       tile.querySelector('.job-title')?.innerText?.trim()          || 'Not Found',
        location:    subs[0]?.querySelector('span[dbtooltip]')?.innerText?.trim() || 'Not Found',
        experience:  subs[1]?.querySelector('span span')?.innerText?.trim()       || 'Not Found',
        description: tile.querySelector('.job-description span')?.innerText?.trim() || '',
        detailUrl:   rel ? new URL(rel, base).href : '',
      };
    });
  }, listingUrl);
  
  console.log(`  ↳ Darwinbox: Found ${jobLinks.length} jobs`);

  // Determine company name from URL
  let company = 'Not Found';
  const u = listingUrl.toLowerCase();
  if (u.includes('ashokleyland')) {
    company = 'Ashok Leyland';
  } else if (u.includes('jslhrms')) {
    company = 'Jindal Stainless';
  } else {
    // Generic fallback: extract subdomain
    try {
      const host = new URL(listingUrl).hostname;
      const sub = host.split('.')[0];
      company = sub.charAt(0).toUpperCase() + sub.slice(1);
    } catch (e) {}
  }

  for (const job of jobLinks) {
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'darwinbox', results, { company });
    await delay(400);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🐱  CATERPILLAR — Pagination
// ════════════════════════════════════════════════════════════════════════════
async function scrapeCaterpillarAllPages(firstPage, context, results) {
  let currentPage = firstPage, pageNum = 1;
  while (true) {
    console.log(`  📄 Caterpillar page ${pageNum}...`);
    const jobLinks = await currentPage.evaluate(() =>
      [...document.querySelectorAll('.card.card-job')].map(card => {
        const a = card.querySelector('.card-title a.js-view-job');
        return {
          title:     a?.innerText?.trim() || 'Not Found',
          location:  card.querySelector('.list-inline-item')?.innerText?.trim() || 'Not Found',
          jobId:     card.getAttribute('data-id') || 'Not Found',
          detailUrl: a ? new URL(a.getAttribute('href'), window.location.origin).href : '',
        };
      })
    );
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'caterpillar', results, { company: 'Caterpillar' }); await delay(400); }

    const nextUrl = await currentPage.evaluate(() =>
      document.querySelector('a[rel=\"next\"]')?.href ||
      [...document.querySelectorAll('a')].find(a =>
        a.innerText?.trim().toLowerCase() === 'next' ||
        a.getAttribute('aria-label')?.toLowerCase().includes('next')
      )?.href ||
      document.querySelector('.pagination .active,[aria-current=\"page\"]')?.nextElementSibling?.querySelector('a')?.href ||
      null
    );
    if (!nextUrl) { console.log(`  ✅ Caterpillar done — ${pageNum} pages`); break; }
    await currentPage.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await currentPage.waitForSelector('.card.card-job', { timeout: 20000 }).catch(() => {});
    await currentPage.waitForTimeout(2000);
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟢  SMARTRECRUITERS
// ════════════════════════════════════════════════════════════════════════════
async function scrapeSmartRecruiters(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"opening\"], article, .js-job', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('li[class*=\"opening\"], article[class*=\"job\"], .js-job')];
    if (!cards.length) return [...document.querySelectorAll('a[href*=\"/jobs/\"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(c => ({
      title:    c.querySelector('h4,h3,h2,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: c.querySelector('[class*=\"location\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: c.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ SmartRecruiters: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'smartrecruiters', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟢  SMARTRECRUITERS JOBS (custom domain)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeSmartRecruitersJobs(page, context, listingUrl, results) {
  await page.waitForSelector('.js-jobs-list-item, [class*=\"job-listing\"], li[data-job-id]', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.js-jobs-list-item, [class*=\"jobCard\"], li[data-job-id]')];
    if (!items.length) return [...document.querySelectorAll('a[href*=\"/job/\"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*=\"title\"],a')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*=\"location\"],.job-location')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ SR-Jobs: ${jobLinks.length} jobs`);

  // Determine company name from listing URL
  let company = 'Not Found';
  if (listingUrl.includes('technipfmc')) company = 'TechnipFMC';

  for (const job of jobLinks) { await visitDetailPage(context, job, 'smartrecruiters_jobs', results, { company }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔵  WORKDAY (Applied Materials, Suncor, etc.)
// Selector: [data-automation-id=\"jobTitle\"]
// ════════════════════════════════════════════════════════════════════════════
async function scrapeWorkday(page, context, listingUrl, results) {
  // Determine company name from listing URL
  let company = 'Not Found';
  if (listingUrl.includes('amat.wd1.myworkdayjobs.com')) company = 'Applied Materials';

  // Workday loads jobs via XHR — wait for first job card
  await page.waitForSelector('[data-automation-id=\"jobTitle\"]', { timeout: 40000 }).catch(() => console.log('⚠️  Workday list nahi mila'));

  // Workday has pagination — scrape all pages
  let pageNum = 1;
  while (true) {
    console.log(`  📄 Workday page ${pageNum}...`);
    await autoScroll(page);
    const jobLinks = await page.evaluate(() =>
      [...document.querySelectorAll('li[class*=\"css-\"]')]
        .filter(li => li.querySelector('[data-automation-id=\"jobTitle\"]'))
        .map(item => ({
          title:    item.querySelector('[data-automation-id=\"jobTitle\"]')?.innerText?.trim() || 'Not Found',
          location: (item.querySelector('[data-automation-id=\"location\"]') || item.querySelector('[data-automation-id=\"locations\"]'))?.innerText?.trim() || 'Not Found',
          date:     item.querySelector('[data-automation-id=\"postedOn\"]')?.innerText?.trim() || 'Not Found',
          detailUrl: item.querySelector('a')?.href || '',
        }))
    );
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'workday', results, { company }); await delay(500); }

    // Check for next page button
    const nextBtn = await page.$('[data-uxi-element-id=\"next\"] button:not([disabled]), button[aria-label=\"next page\"]:not([disabled]), [aria-label=\"Go to next page\"]:not([disabled])');
    if (!nextBtn) break;
    await nextBtn.click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-automation-id=\"jobTitle\"]', { timeout: 20000 }).catch(() => {});
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟣  ORACLE CLOUD (Nayara Energy + fa-eski Oracle)
// Selector: .requisitionListItem  OR  [class*=\"job-grid-item\"]
// ════════════════════════════════════════════════════════════════════════════
async function scrapeOracle(page, context, listingUrl, results) {
  // Oracle uses hash-based navigation — handle #/en/sites/
  if (listingUrl.includes('#/')) {
    // Hash URL — let JS render
    await page.waitForTimeout(6000);
  }
  await page.waitForSelector('.requisitionListItem, [class*=\"jobResult\"], [class*=\"job-tile\"], [class*=\"job-grid-item\"], .job-grid-item', { timeout: 35000 }).catch(() => console.log('⚠️  Oracle list nahi mila'));
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Oracle Cloud HCM selectors (various versions)
    const selectors = [
      '.requisitionListItem',
      '[class*=\"job-grid-item\"]',
      '[class*=\"jobResult\"]',
      '[class*=\"job-tile\"]',
      'li[class*=\"job\"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)];
      if (items.length) break;
    }
    if (!items.length) return [...document.querySelectorAll('a[href*=\"job\"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => {
      const titleEl = item.querySelector('.job-tile__title, [class*=\"title\"], h3, h2');
      const locEl   = item.querySelector('posting-locations, [class*=\"value\"], [class*=\"location\"]:not([class*=\"label\"]), [class*=\"city\"]');
      const linkEl  = item.querySelector('a.job-list-item__link, a[href*=\"/job/\"], a');
      
      return {
        title:     titleEl?.innerText?.trim() || 'Not Found',
        location:  locEl?.innerText?.trim()?.replace(/\s+/g, ' ') || 'Not Found',
        date:      item.querySelector('[class*=\"date\"],[class*=\"posted\"]')?.innerText?.trim() || 'Not Found',
        detailUrl: linkEl?.href || '',
      };
    }).filter(j => j.detailUrl && j.title !== 'Not Found');
  });

  console.log(`  ↳ Oracle: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { 
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'oracle', results); 
    await delay(500); 
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟠  PARAM.AI
// ════════════════════════════════════════════════════════════════════════════
async function scrapeParamai(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"job\"], .card, article', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[class*=\"JobCard\"],[class*=\"job-card\"],.card')].filter(c => c.querySelector('a'));
    if (!cards.length) return [...document.querySelectorAll('a[href*=\"job\"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(card => ({
      title:      card.querySelector('h2,h3,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location:   card.querySelector('[class*=\"location\"]')?.innerText?.trim() || 'Not Found',
      experience: card.querySelector('[class*=\"exp\"]')?.innerText?.trim() || 'Not Found',
      detailUrl:  card.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ Param.ai: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'paramai', results, { company: 'Maruti Suzuki' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔴  CSOD (Apollo Tyres)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeCsod(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"rec-listing\"], .cs-job-listing, [id*=\"job\"]', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-tag=\"displayJobTitle\"]')].map(a => a.closest('div'));
    if (!items.length) {
      const genericItems = [...document.querySelectorAll('[class*=\"rec-listing-job\"],[class*=\"job-listing-item\"],tr[class*=\"rec-listing\"]')];
      if (!genericItems.length) return [...document.querySelectorAll('a[href*=\"requisition\"],a[href*=\"job\"]')].filter(a => a.innerText?.trim()).map(a => ({ title: a.innerText.trim(), location: 'Not Found', detailUrl: a.href }));
      return genericItems.map(item => ({
        title:    item.querySelector('a,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
        location: item.querySelector('[class*=\"location\"]')?.innerText?.trim() || 'Not Found',
        detailUrl: item.querySelector('a')?.href || '',
      }));
    }
    return items.map(item => ({
      title:    item.querySelector('[data-tag=\"displayJobTitle\"], p')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[data-tag=\"displayJobLocation\"]')?.innerText?.trim() || 'Not Found',
      date:     item.querySelector('[data-tag=\"displayJobPostingDate\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ CSOD: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'csod', results, { company: 'Apollo Tyres' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 📌  LEVER
// ════════════════════════════════════════════════════════════════════════════
async function scrapeLever(page, context, listingUrl, results) {
  await page.waitForSelector('.posting, [class*=\"posting\"], h2', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.posting')].map(p => ({
      title:    p.querySelector('h5,.posting-name,[data-qa=\"posting-name\"]')?.innerText?.trim() || 'Not Found',
      location: p.querySelector('.sort-by-location,.posting-categories')?.innerText?.trim() || 'Not Found',
      detailUrl: p.querySelector('a')?.href || '',
    }))
  );

  if (jobLinks.length === 0) {
    // Check if this is a direct job page
    const details = await page.evaluate(genericJobEvaluator);
    if (details.title !== 'Not Found') {
      results.push({ source: 'lever', url: listingUrl, ...details });
      console.log(`  ↳ Lever: 1 job (direct detail)`);
      return;
    }
  }

  console.log(`  ↳ Lever: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'lever', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🌿  GREENHOUSE
// ════════════════════════════════════════════════════════════════════════════
async function scrapeGreenhouse(page, context, listingUrl, results) {
  await page.waitForSelector('.opening, [class*=\"opening\"]', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.opening')].map(o => ({
      title:    o.querySelector('a')?.innerText?.trim() || 'Not Found',
      location: o.querySelector('.location')?.innerText?.trim() || 'Not Found',
      detailUrl: o.querySelector('a')?.href || '',
    }))
  );
  console.log(`  ↳ Greenhouse: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'greenhouse', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏛️  TALEO
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTaleo(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"requisition\"], .listSingleColumnLayoutTable, [id*=\"Requisition\"]', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*=\"taleo\"]');
    if (iframe) return [{ title: 'Taleo iFrame detected', location: 'Not Found', detailUrl: iframe.src }];
    const rows = [...document.querySelectorAll('tr[class*=\"requisition\"],tr[id*=\"req\"],div[class*=\"requisition\"],.listSingleColumnLayoutTable tr')];
    if (!rows.length) return [...document.querySelectorAll('a[href*=\"requisition\"],a[href*=\"jobId\"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return rows.map(row => ({
      title:    row.querySelector('a,.requisitionTitle')?.innerText?.trim() || 'Not Found',
      location: row.querySelector('[class*=\"location\"],td:nth-child(3)')?.innerText?.trim() || 'Not Found',
      detailUrl: row.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ Taleo: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'taleo', results); await delay(500); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔷  iCIMS
// ════════════════════════════════════════════════════════════════════════════
async function scrapeIcims(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"iCIMS\"],[class*=\"icims\"],[id*=\"icims\"],.jobs-section', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[class*=\"iCIMS_JobsTable\"] tr,[class*=\"job-listing\"],.iCIMS_JobsTable tr')];
    if (!items.length) return [...document.querySelectorAll('a[href*=\"iCIMS\"],a[href*=\"icims\"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title:    item.querySelector('a,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*=\"location\"],td:nth-child(2)')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ iCIMS: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'icims', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 💼  SAP SUCCESSFACTORS
// ════════════════════════════════════════════════════════════════════════════
async function scrapeSuccessFactors(page, context, listingUrl, results) {
  // SuccessFactors can have table-based or card-based layouts
  await page.waitForSelector('tr.data-row, [class*=\"job-tile\"], [class*=\"jobTitle\"], li[data-id]', { timeout: 30000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Check for table rows first (Hero MotoCorp style)
    let items = [...document.querySelectorAll('tr.data-row')];
    if (items.length) {
      return items.map(tr => ({
        title:    tr.querySelector('.jobTitle-link, .colTitle a')?.innerText?.trim() || 'Not Found',
        location: tr.querySelector('.jobLocation')?.innerText?.replace(/\s+/g, ' ')?.trim() || 'Not Found',
        detailUrl: tr.querySelector('a')?.href || '',
      })).filter(j => j.detailUrl);
    }

    // Check for cards (Standard SF style)
    const cards = [...document.querySelectorAll('[class*=\"job-tile\"], [class*=\"jobCard\"], [data-id][class*=\"job\"]')];
    if (cards.length) {
      return cards.map(card => ({
        title:    card.querySelector('a, [class*=\"title\"]')?.innerText?.trim() || 'Not Found',
        location: card.querySelector('[class*=\"location\"], [class*=\"city\"]')?.innerText?.trim() || 'Not Found',
        detailUrl: card.querySelector('a')?.href || '',
      })).filter(j => j.detailUrl);
    }

    // Fallback: any anchor that looks like a job link
    return [...document.querySelectorAll('a[href*=\"/job/\"]')].map(a => ({
      title: a.innerText.trim() || 'Not Found',
      location: 'Not Found',
      detailUrl: a.href
    }));
  });

  console.log(`  ↳ SuccessFactors: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'successfactors', results); await delay(500); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔩  BRASSRING / KENEXA
// ════════════════════════════════════════════════════════════════════════════
async function scrapeBrassring(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"jobTitle\"],[class*=\"job-title\"],table.jobs tr', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table tr,[class*=\"jobRow\"],[class*=\"job-row\"]')].filter(r => r.querySelector('a'));
    if (!rows.length) return [...document.querySelectorAll('a[href*=\"job\"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return rows.map(r => ({
      title:    r.querySelector('a,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: r.querySelector('[class*=\"location\"],td:nth-child(2)')?.innerText?.trim() || 'Not Found',
      detailUrl: r.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ BrassRing: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'brassring', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🎯  JOBVITE
// ════════════════════════════════════════════════════════════════════════════
async function scrapeJobvite(page, context, listingUrl, results) {
  await page.waitForSelector('.jv-job-item,.jv-job-list-item,[class*=\"jv-job\"]', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.jv-job-item,.jv-job-list-item')].map(item => ({
      title:    item.querySelector('a,.jv-job-title')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('.jv-job-location,[class*=\"location\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }))
  );
  console.log(`  ↳ Jobvite: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'jobvite', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🌑  ASHBY
// ════════════════════════════════════════════════════════════════════════════
async function scrapeAshby(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"ashby\"],[class*=\"job-posting\"],._content', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*=\"/jobs/\"], a[href*=\"/posting/\"]')].map(a => ({
      title:    a.querySelector('[class*=\"title\"],h3,h2')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
      location: a.querySelector('[class*=\"location\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: a.href || '',
    }))
  );
  console.log(`  ↳ Ashby: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'ashby', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 📰  NAUKRI EMBED
// ════════════════════════════════════════════════════════════════════════════
async function scrapeNaukriEmbed(page, context, listingUrl, results) {
  await page.waitForSelector('[class*=\"naukri\"],[class*=\"jobCard\"],article', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('[class*=\"jobTuple\"],[class*=\"job-card\"],article')].map(card => ({
      title:    card.querySelector('a.title,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: card.querySelector('[class*=\"location\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: card.querySelector('a')?.href || '',
    }))
  );
  console.log(`  ↳ Naukri embed: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'naukri_embed', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🚗  MERCEDES-BENZ
// Site uses React SPA — selector: [class*=\"job-listing-item\"] OR article
// Jobs API endpoint also available: /api/job-search
// ════════════════════════════════════════════════════════════════════════════
async function scrapeMercedes(page, context, listingUrl, results) {
  // Mercedes uses React with client-side rendering
  await page.waitForSelector('[class*=\"job-listing-item\"], [class*=\"JobListItem\"], article[class*=\"job\"], .job-card, [data-testid=\"job-item\"]', { timeout: 35000 }).catch(() => {});
  await autoScroll(page);

  // Try pagination
  let pageNum = 1;
  while (true) {
    console.log(`  📄 Mercedes page ${pageNum}...`);
    const jobLinks = await page.evaluate(() => {
      // Multiple possible selectors for Mercedes CMS (MJP style)
      let items = [...document.querySelectorAll('.mjp-job-ad-card')];
      if (items.length) {
        return items.map(item => ({
          title:    item.querySelector('.mjp-job-ad-card__title-text')?.innerText?.trim() || 'Not Found',
          location: item.querySelector('.mjp-job-ad-card__location')?.innerText?.trim() || 'Not Found',
          date:     item.querySelector('.mjp-job-ad-card__date')?.innerText?.trim() || 'Not Found',
          detailUrl: item.querySelector('.mjp-job-ad-card__link')?.href || item.querySelector('a')?.href || '',
        }));
      }

      // Fallback selectors
      const selectors = [
        '[class*=\"job-listing-item\"]',
        '[class*=\"JobListItem\"]',
        'article[class*=\"job\"]',
        '[data-testid=\"job-item\"]',
        '.job-card',
        'li[class*=\"job\"]',
      ];
      for (const sel of selectors) {
        items = [...document.querySelectorAll(sel)];
        if (items.length) break;
      }
      if (!items.length) {
        return [...document.querySelectorAll('a[href*=\"/en/job\"]')].map(a => ({
          title: a.querySelector('h3,h2,strong,[class*=\"title\"]')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
          location: 'Not Found',
          detailUrl: a.href,
        }));
      }
      return items.map(item => ({
        title:    item.querySelector('h2,h3,[class*=\"title\"],[class*=\"headline\"]')?.innerText?.trim() || 'Not Found',
        location: item.querySelector('[class*=\"location\"],[class*=\"city\"]')?.innerText?.trim() || 'Not Found',
        date:     item.querySelector('[class*=\"date\"],[class*=\"posted\"]')?.innerText?.trim() || 'Not Found',
        detailUrl: item.querySelector('a')?.href || '',
      }));
    });
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'mercedes', results, { company: 'Mercedes-Benz' }); await delay(400); }

    // Try next page
    const nextBtn = await page.$('[aria-label=\"Next page\"], [aria-label=\"next\"], button[class*=\"next\"]:not([disabled]), a[class*=\"next\"]:not([disabled])');
    if (!nextBtn) break;
    await nextBtn.click();
    await page.waitForTimeout(3000);
    pageNum++;
    if (pageNum > 50) break; // safety
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🧴  UNILEVER
// Site: careers.unilever.com — uses custom ATS with React
// Selector: [class*=\"job-search-results\"] li  OR  .job-item
// ════════════════════════════════════════════════════════════════════════════
async function scrapeUnilever(page, context, listingUrl, results) {
  // Unilever uses TalentBrew
  await page.waitForSelector('.global-job-list li, [class*=\"job-list\"] li', { timeout: 30000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.global-job-list li, [class*=\"job-list\"] li')];
    return items.map(li => {
      const a = li.querySelector('a');
      return {
        title:    li.querySelector('h2, .global-job-list__title')?.innerText?.trim() || a?.innerText?.trim() || 'Not Found',
        location: li.querySelector('.job-location')?.innerText?.trim() || 'Not Found',
        detailUrl: a?.href || '',
        jobId:    a?.getAttribute('data-job-id') || 'Not Found'
      };
    }).filter(j => j.detailUrl);
  });

  console.log(`  ↳ Unilever: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { 
    await visitDetailPage(context, job, 'unilever', results, { company: 'Unilever' }); 
    await delay(400); 
  }
}


// ════════════════════════════════════════════════════════════════════════════
// ⚡  HITACHI ENERGY
// Site: hitachienergy.com/careers/open-jobs — Angular SPA
// Selector: [class*=\"job-result\"] OR app-job-result
// ════════════════════════════════════════════════════════════════════════════
async function scrapeHitachi(page, context, listingUrl, results) {
  // Hitachi uses Angular — needs extra wait
  await page.waitForTimeout(5000);
  await page.waitForSelector('[class*=\"job-result\"], app-job-card, .job-card, [class*=\"position-card\"]', { timeout: 35000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*=\"job-result\"]',
      'app-job-card',
      '[class*=\"position-card\"]',
      '.job-card',
      '[class*=\"opening\"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)];
      if (items.length) break;
    }
    if (!items.length) {
      return [...document.querySelectorAll('a[href*=\"job\"]')].map(a => ({
        title: a.innerText?.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
      }));
    }
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*=\"location\"],[class*=\"city\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });

  console.log(`  ↳ Hitachi: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'hitachi', results, { company: 'Hitachi Energy' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔧  SIEMENS
// Site: jobs.siemens.com — React SPA with virtual scroll
// Selector: [class*=\"sc-job\"] OR .job-item OR article
// ════════════════════════════════════════════════════════════════════════════
async function scrapeSiemens(page, context, listingUrl, results) {
  await page.waitForTimeout(5000);
  await page.waitForSelector('[class*=\"sc-job\"], [class*=\"job-item\"], article, [data-testid*=\"job\"]', { timeout: 35000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*=\"sc-job-card\"]',
      '[class*=\"job-card\"]',
      '[data-testid*=\"job\"]',
      'article',
      '[class*=\"job-item\"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)].filter(el => el.querySelector('a'));
      if (items.length) break;
    }
    if (!items.length) {
      return [...document.querySelectorAll('a[href*=\"/job\"]')].map(a => ({
        title: a.querySelector('h2,h3,strong')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
      }));
    }
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*=\"title\"],[class*=\"headline\"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*=\"location\"],[class*=\"city\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });

  console.log(`  ↳ Siemens: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'siemens', results, { company: 'Siemens' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🍯  HONEYWELL
// Site: careers.honeywell.com — custom career portal (React)
// Selector: [class*=\"job-card\"] OR [class*=\"JobCard\"] OR article
// ════════════════════════════════════════════════════════════════════════════
async function scrapeHoneywell(page, context, listingUrl, results) {
  await page.waitForTimeout(5000);
  await page.waitForSelector('[class*=\"job-card\"], [class*=\"JobCard\"], article, [class*=\"position\"]', { timeout: 35000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*=\"job-card\"]',
      '[class*=\"JobCard\"]',
      '[class*=\"position-item\"]',
      'article',
      'li[class*=\"job\"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)].filter(el => el.querySelector('a'));
      if (items.length) break;
    }
    if (!items.length) {
      return [...document.querySelectorAll('a[href*=\"job\"]')].map(a => ({
        title: a.innerText?.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
      }));
    }
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*=\"location\"],[class*=\"city\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });

  console.log(`  ↳ Honeywell: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'honeywell', results, { company: 'Honeywell' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏍️  ROYAL ENFIELD
// Site: careers.royalenfield.com — uses Phenom People ATS (custom React)
// Selector: [class*=\"job-card\"] OR [class*=\"card-jobs\"]
// ════════════════════════════════════════════════════════════════════════════
async function scrapeRoyalEnfield(page, context, listingUrl, results) {
  await page.waitForTimeout(5000);
  await page.waitForSelector('[class*=\"job-card\"], [class*=\"card-jobs\"], [class*=\"phenom\"], article', { timeout: 35000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Phenom People ATS selectors
    const selectors = [
      '[class*=\"job-card\"]',
      '[class*=\"card-jobs\"]',
      '[class*=\"phenom-job\"]',
      '[class*=\"opening\"]',
      'article',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)].filter(el => el.querySelector('a'));
      if (items.length) break;
    }
    if (!items.length) {
      return [...document.querySelectorAll('a[href*=\"job\"]')].map(a => ({
        title: a.innerText?.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
      }));
    }
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*=\"title\"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*=\"location\"],[class*=\"city\"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });

  console.log(`  ↳ Royal Enfield: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'royal_enfield', results, { company: 'Royal Enfield' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏎️  BAJAJ AUTO
// Site: bajajauto.com/careers/search-result — custom ASP / React hybrid
// Selector: .career-listing  OR  [class*=\"job-item\"]  OR table rows
// ════════════════════════════════════════════════════════════════════════════
async function scrapeBajajAuto(page, context, listingUrl, results) {
  console.log(`  📄 Loading ${listingUrl}...`);
  await page.goto(listingUrl, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForSelector('.jobContainer', { timeout: 20000 }).catch(async () => {
     console.log(`    ⚠️ .jobContainer not found. Trying autoScroll...`);
     await autoScroll(page);
  });
  
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.jobContainer')];
    return cards.map(el => {
      // Find title - usually the first element or a header
      const titleEl = el.querySelector('h3, h4, .jobTitle, .title') || el.firstChild;
      const title = titleEl?.innerText?.trim() || el.innerText.split('\n')[0] || 'Not Found';
      
      // Find location - often in a specific span or after title
      let location = 'India';
      const text = el.innerText;
      const match = text.match(/([A-Za-z\s]+),\s*(?:[A-Za-z\s]+,)?\s*India/i);
      if (match) location = match[0].replace(/[\n\t\r]+/g, ' ').replace(/^,\s*/, '').trim();
      
      const link = el.querySelector('a')?.href;
      return { title, location, detailUrl: link };
    }).filter(j => j.detailUrl && j.title !== 'Not Found');
  });

  console.log(`  ↳ Bajaj Auto: Found ${jobLinks.length} candidates`);
  for (const job of jobLinks) {
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'bajaj_auto', results, { company: 'Bajaj Auto' });
    await delay(400);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 💎  ADITYA BIRLA GROUP
// Site: careers.adityabirla.com — custom React portal
// Selector: [class*=\"job-card\"] OR [class*=\"JobCard\"]
// ════════════════════════════════════════════════════════════════════════════
async function scrapeAdityaBirla(page, context, listingUrl, results) {
  await page.waitForTimeout(5000);
  await page.waitForSelector('[class*="job-card"], [class*="JobCard"], [class*="job-item"], article', { timeout: 35000 }).catch(() => {});
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*="job-card"]',
      '[class*="JobCard"]',
      '[class*="job-item"]',
      'article',
      'li[class*="position"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)].filter(el => el.querySelector('a'));
      if (items.length) break;
    }
    if (!items.length) {
      return [...document.querySelectorAll('a[href*="job"]')].map(a => ({
        title: a.innerText?.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
      }));
    }
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });

  console.log(`  ↳ Aditya Birla: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'aditya_birla', results, { company: 'Aditya Birla Group' }); await delay(400); }
}



// ════════════════════════════════════════════════════════════════════════════
// 📺  PANASONIC
// Site: careers.na.panasonic.com — single job page (direct detail)
// This URL is already a specific job listing, not a search page
// ════════════════════════════════════════════════════════════════════════════
async function scrapePanasonic(page, context, listingUrl, results) {
  // Check if this is a listing page
  const isListing = await page.evaluate(() => !!document.querySelector('.search-results__list, mat-expansion-panel'));
  
  if (isListing) {
    await page.waitForSelector('mat-expansion-panel', { timeout: 20000 }).catch(() => {});
    await autoScroll(page);
    
    const jobLinks = await page.evaluate(() => {
      return [...document.querySelectorAll('mat-expansion-panel')].map(panel => ({
        title:     panel.querySelector('.job-title-link span[itemprop="title"]')?.innerText?.trim() || 'Not Found',
        location:  panel.querySelector('.job-result__location .label-value.location')?.innerText?.trim()?.replace(/\n/g, ' ') || 'Not Found',
        detailUrl: panel.querySelector('.job-title-link')?.href || '',
      })).filter(j => j.detailUrl && j.title !== 'Not Found');
    });
    
    console.log(`  ↳ Panasonic: Found ${jobLinks.length} jobs`);
    for (const job of jobLinks) {
      console.log(`    🔎 ${job.title} [${job.location}]`);
      await visitDetailPage(context, job, 'panasonic', results, { company: 'Panasonic' });
      await delay(500);
    }
  } else {
    // Direct detail page
    const details = await page.evaluate(genericJobEvaluator);
    results.push({
      source:   'panasonic',
      url:       listingUrl,
      company:   details.company !== 'Not Found' ? details.company : 'Panasonic',
      ...details,
    });
    console.log(`  ↳ Panasonic: 1 job (direct detail page)`);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🌐  GENERIC LISTING
// ════════════════════════════════════════════════════════════════════════════
async function scrapeGenericListing(page, context, listingUrl, results) {
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const patterns = [
      '[class*=\"job-card\"] a','[class*=\"jobCard\"] a','[class*=\"job-listing\"] a',
      '[class*=\"job-result\"] a','[class*=\"job-item\"] a','[class*=\"position\"] a',
      'article a','.vacancies a','.career-list a',
      'table tr td a[href*=\"job\"]','ul li a[href*=\"job\"]',
      'a[href*=\"/job/\"]','a[href*=\"/jobs/\"]','a[href*=\"jobId\"]',
      'a[href*=\"vacancy\"]','a[href*=\"requisition\"]',
    ];
    const seen = new Set(), out = [];
    for (const pat of patterns) {
      try {
        for (const a of document.querySelectorAll(pat)) {
          const href = a.href;
          if (!href || href === window.location.href || seen.has(href)) continue;
          if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
          seen.add(href);
          const parent = a.closest('li,tr,div,article,section') || a.parentElement;
          out.push({
            title:    (parent?.querySelector('h1,h2,h3,h4,[class*=\"title\"]')?.innerText?.trim() || a.innerText?.trim() || a.getAttribute('title') || 'Not Found').slice(0, 200),
            location: parent?.querySelector('[class*=\"location\"],[class*=\"city\"],address')?.innerText?.trim() || 'Not Found',
            detailUrl: href,
          });
        }
      } catch (e) {}
      if (out.length) break;
    }
    return out;
  });

  console.log(`  ↳ Generic: ${jobLinks.length} jobs`);
  if (!jobLinks.length) {
    const job = await page.evaluate(genericJobEvaluator);
    results.push({ source: 'generic_listing', url: listingUrl, ...job });
    return;
  }
  for (const job of jobLinks) { await visitDetailPage(context, job, 'generic', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔗  VISIT DETAIL PAGE
// ════════════════════════════════════════════════════════════════════════════
async function visitDetailPage(context, job, source, results, extra = {}) {
  if (!job.detailUrl || global.processedUrls?.has(job.detailUrl)) return;
  
  if (currentExistingLinks.has(job.detailUrl)) {
    console.log(`    ⏭️  Skip detail scrape (already in DB): ${job.title?.slice(0, 60)}`);
    results.push({ ...job, source, applyLink: job.detailUrl, isAlreadyInDb: true });
    return;
  }

  global.processedUrls?.add(job.detailUrl);
  const page = await context.newPage();
  console.log(`    🔎 ${job.title?.slice(0, 60)}`);
  try {
    await page.goto(job.detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Wait for critical containers
    if (source === 'darwinbox') {
      await page.waitForSelector('.job-main-details, .job-summary, .box', { timeout: 15000 }).catch(() => {});
    } else if (source === 'paramai') {
      await page.waitForSelector('.ql-editor, [class*=\"job-description\"]', { timeout: 15000 }).catch(() => {});
    }

    const details = await page.evaluate(genericJobEvaluator);
    
    // Cleanup: If title is generic, use the listing title
    const genericTitles = ['job details page', 'job details', 'careers', 'career', 'job description'];
    let finalTitle = details.title;
    if (!finalTitle || finalTitle === 'Not Found' || genericTitles.includes(finalTitle.toLowerCase())) {
      finalTitle = job.title;
    }

    // ── Metadata Priority ───────────────────────────────────────────
    const dbCompany  = currentTargetExtra.company;
    const dbLocation = currentTargetExtra.location;

    // Location priority: DB override > Listing location > Detail page location
    let finalLocation = details.location;
    if (dbLocation && dbLocation !== 'Not Found') {
      finalLocation = dbLocation;
    } else if (job.location && job.location !== 'Not Found') {
      finalLocation = job.location;
    } else if (!finalLocation || finalLocation === 'Not Found') {
      finalLocation = 'Not Found';
    }


    // Title cleanup
    if (finalTitle) {
      finalTitle = finalTitle.replace(/[\n\r\s]+Apply now.*/gi, '').trim();
    }

    let finalApplyLink = (!details.applyLink || details.applyLink === 'Not Found' || details.applyLink === 'Apply button (JS trigger)' || (details.applyLink && String(details.applyLink).startsWith('mailto:'))) ? job.detailUrl : details.applyLink;

    if (job.detailUrl.includes('heromotocorp.com') || job.detailUrl.includes('darwinbox.in') || job.detailUrl.includes('unilever.com') || job.detailUrl.includes('caterpillar.com') || job.detailUrl.includes('tenneco.com') || job.detailUrl.includes('bajajelectricals.com') || job.detailUrl.includes('technipfmc.com') || job.detailUrl.includes('royalenfield.com') || job.detailUrl.includes('panasonic.com')) {
      finalApplyLink = job.detailUrl;
    }

    if (job.detailUrl.includes('heromotocorp.com')) {
      const match = job.detailUrl.match(/\/(\d+)\/?(?:[?#].*)?$/);
      if (match && (!job.jobId || job.jobId === 'Not Found')) {
        job.jobId = match[1];
      }
    }

    // Company priority: DB override > Function extra > Detail page
    let finalCompany = dbCompany;
    if (!finalCompany || finalCompany === 'Not Found') {
      finalCompany = (extra.company && extra.company !== 'Not Found') ? extra.company : (details.company !== 'Not Found' ? details.company : extractFallbackCompany(job.detailUrl));
    }

    if (finalCompany === 'Office') {
      if (job.detailUrl.includes('heromotocorp.com')) finalCompany = 'Hero Motocorp';
      else if (job.detailUrl.includes('technipfmc.com')) finalCompany = 'TechnipFMC';
      else finalCompany = extractFallbackCompany(job.detailUrl);
    }


    results.push({
      source,
      url:         job.detailUrl,
      title:       finalTitle,
      location:    finalLocation,
      company:     finalCompany,
      date:        details.date,
      experience:  details.experience  !== 'Not Found' ? details.experience  : (job.experience || 'Not Found'),
      description: details.description,
      applyLink:   finalApplyLink,
      salary:      details.salary,
      jobId:       details.jobId       !== 'Not Found' ? details.jobId       : (job.jobId || 'Not Found'),
    });
    console.log(`       ✅ OK`);
  } catch (err) {
    console.log(`       ❌ ${err.message}`);
    results.push({ source, url: job.detailUrl, ...extra, ...job, error: true, message: err.message });
  }
  await page.close();
}

function extractFallbackCompany(urlStr) {
  try {
    const host = new URL(urlStr).hostname;
    const parts = host.split('.');
    let name = parts[0];
    if (name.length < 3 && parts.length > 1) name = parts[1];
    return name.toUpperCase() || 'Unknown Company';
  } catch(e) {
    return 'Unknown Company';
  }
}

// ✅ FIX 4: Helper — dono locations mein se best ek choose karo
function extractBestLocation(detailLoc = '', listingLoc = '') {
  // \"Job Segment:\" wali garbage reject karo
  const isGarbage = (loc) =>
    !loc ||
    loc === 'Not Found' ||
    /^Job Segment:/i.test(loc.trim()) ||
    loc.trim().length < 2;

  if (!isGarbage(detailLoc)) return detailLoc.split('\n')[0].trim();
  if (!isGarbage(listingLoc)) return listingLoc.split('\n')[0].trim();
  return 'Not Found';
}


// ════════════════════════════════════════════════════════════════════════════
// 🔧  GENERIC JOB PAGE EVALUATOR
// ════════════════════════════════════════════════════════════════════════════
function genericJobEvaluator() {
  const getText = (sels) => { for (const s of sels) { try { const el=document.querySelector(s); if (el?.innerText?.trim()) return el.innerText.trim(); if (el?.content?.trim()) return el.content.trim(); } catch(e){} } return ''; };
  const getByLabel = (label) => { 
    try {
      const dts = [...document.querySelectorAll('dt, .text-sm.font-medium, label')];
      const target = dts.find(dt => dt.innerText.toLowerCase().includes(label.toLowerCase()));
      if (target) {
        // Direct sibling (SuccessFactors style)
        const dd = target.nextElementSibling;
        if (dd && (dd.tagName.toLowerCase() === 'dd' || dd.classList.contains('value'))) return dd.innerText.trim();
        // Child of parent (Maruti style)
        const val = target.parentElement?.querySelector('.value');
        if (val) return val.innerText.trim();
        // Text node after label (SuccessFactors style)
        const labelText = target.innerText;
        let pText = target.parentElement?.innerText || '';
        if (pText.includes(labelText)) {
           let v = pText.replace(labelText, '').replace(/^[:\s-]+/, '').trim();
           if (v) return v;
        }
      }
      // MJP Tag style (Mercedes)
      const tags = [...document.querySelectorAll('.mjp-job-ad-tag')];
      const mjpTarget = tags.find(tag => tag.querySelector('.mjp-job-ad-tag__title')?.innerText.toLowerCase().includes(label.toLowerCase()));
      if (mjpTarget) return mjpTarget.querySelector('.mjp-job-ad-tag__content')?.innerText.trim();
    } catch(e) {}
    return '';
  };
  const getAllText = (sel) => { try { return [...document.querySelectorAll(sel)].map(el=>el.innerText?.trim()).filter(Boolean).join('\n'); } catch(e){return '';} };
  const getJsonLd = () => { try { for (const b of document.querySelectorAll('script[type=\"application/ld+json\"]')) { const json=JSON.parse(b.textContent); const items=json['@graph']?json['@graph']:[json]; const job=items.find(i=>i['@type']==='JobPosting'||i['@type']==='Job'); if(job) return job; } } catch(e){} return null; };
  const fullText = document.body?.innerText || '';
  const ld = getJsonLd();

  // Oracle KO.js
  try { const root=document.querySelector('job-details-page'); if(window.ko&&root){const koData=window.ko.dataFor(root); if(koData?.pageData){const jd=koData.pageData().job; return {title:jd.title||'',location:jd.primaryLocation||'',company:document.querySelector('meta[property=\"og:site_name\"]')?.content||'Not Found',date:jd.postedDate||'Not Found',description:jd.description?.replace(/<[^>]+>/g,'')||'Not Found',applyLink:window.location.href,experience:jd.description?.match(/(\d+\+?\s*(years|yrs))/i)?.[0]||'Not Found',salary:'Not Available',jobId:String(jd.id||'Not Found')};}}} catch(e){}

  // Workday detail
  try { const wdT=document.querySelector('[data-automation-id=\"jobPostingHeader\"]')?.innerText?.trim(); if(wdT) return {title:wdT,location:(document.querySelector('[data-automation-id=\"location\"]') || document.querySelector('[data-automation-id=\"locations\"]'))?.innerText?.trim()||'Not Found',company:document.querySelector('[data-automation-id=\"company\"]')?.innerText?.trim()||document.querySelector('meta[property=\"og:site_name\"]')?.content||'Not Found',date:document.querySelector('[data-automation-id=\"postedOn\"]')?.innerText?.trim()||'Not Found',description:document.querySelector('[data-automation-id=\"jobPostingDescription\"]')?.innerText?.trim()||fullText.slice(0,3000),applyLink:document.querySelector('a[href*=\"apply\"]')?.href||window.location.href,experience:fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[0]||'Not Found',salary:'Not Available',jobId:window.location.pathname.match(/\/(\d{5,}|[A-Z0-9_-]{6,})(?:[/?#]|$)/)?.[1]||'Not Found'};} catch(e){}

  // Title
  let title=getText(['.job-details__title','h4.display-2','.text-3xl.font-bold','span[itemprop=\"title\"][data-careersite-propertyid=\"title\"]','[data-careersite-propertyid=\"title\"]','.job__title h1','.app-title','.posting-headline h2','.jobTitle','h1 span[itemprop=\"title\"]','h1','[data-test=\"job-title\"]','[class*=\"job-title\"]','[id*=\"job-title\"]','[itemprop=\"title\"]','.careers-title','.role-title','.jd-title','.job-header__title','.header-title','[data-automation=\"job-title\"]','[data-ph-at-id=\"job-title\"]','.job-title--h1','[aria-label=\"Job title\"]','meta[property=\"og:title\"]','meta[name=\"twitter:title\"]']);
  
  // Darwinbox specific title extraction
  if (!title || title.toLowerCase() === 'key responsibilities') {
    const breadcrumb = [...document.querySelectorAll('.link.ng-star-inserted')].pop();
    if (breadcrumb && breadcrumb.innerText.trim()) {
      title = breadcrumb.innerText.trim();
    }
  }
  if (!title) {
    const dbHeader = document.querySelector('.view-container h2, .view-container h1, .view-container .title');
    if (dbHeader) title = dbHeader.innerText.trim();
  }

  if(!title) title=ld?.title||ld?.name||'';
  if(!title) title=document.querySelector('meta[property=\"og:title\"]')?.content?.trim()||'';
  if(!title) title=document.title?.split(/[|\-]/)[0]?.trim()||'';
  
  // Darwinbox specific: Clean up og:title (Company | Title (Location))
  if (title && title.includes('|')) {
    const parts = title.split('|');
    if (parts.length > 1) {
      title = parts[1].split('(')[0].trim();
    }
  }

  const genericTitles = ['job details page', 'job details', 'careers', 'career', 'job description', 'key responsibilities', 'role summary', 'job summary'];
  if (title && genericTitles.includes(title.toLowerCase())) {
    title = '';
  }

  if(!title) [...document.querySelectorAll('p,li,span,td,h2,h3')].some(el=>{const t=el.innerText?.trim();if(t?.startsWith('Position:')){title=t.replace(/^Position:/i,'').trim();return true;}});

  // Location + Company
  let location='',company='';
  const cityText=getText(['.jobCity']);
  if(cityText){const p=cityText.split(',');location=p[0]?.trim();company=p[1]?.trim();}
  if(!location) location=getByLabel('Job Location')||getText(['posting-locations','.job-details__subtitle','.user_info p','[data-careersite-propertyid=\"city\"]','[data-careersite-propertyid=\"location\"]','.job__location div','.location','.job-location','.jobGeoLocation','.posting-categories .location','[data-test=\"location\"]','[itemprop=\"jobLocation\"]','[class*=\"location\"]','address','[data-automation=\"job-location\"]','[data-ph-at-id=\"location\"]','.job-location__city','.location-name','.city-state','[aria-label=\"Job location\"]','.work-location','.office-location','.position-location','[class*=\"job-city\"]','[class*=\"job-region\"]']);
  if(!location&&ld) location=ld.jobLocation?.address?.addressLocality||ld.jobLocation?.address?.addressRegion||ld.jobLocation?.name||'';
  if(!location) [...document.querySelectorAll('p,li,span,td')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Location:/i)){location=t.replace(/^Location:/i,'').trim();return true;}});

  if(!company) company=getText(['[data-careersite-propertyid=\"businessunit\"]','[data-careersite-propertyid=\"customfield3\"]','[data-careersite-propertyid=\"customfield1\"]','.company','.posting-company','[itemprop=\"hiringOrganization\"]','[class*=\"company-name\"]','.employer-name','.org-name','[data-test=\"company-name\"]','[data-automation=\"company-name\"]','.company__name','.employer','.organization-name','[class*=\"employer\"]','[aria-label=\"Company name\"]','.brand-name','.recruiter-name','.client-name','[class*=\"company\"]','meta[property=\"og:site_name\"]','[name=\"author\"]']);
  if(!company&&ld) company=ld.hiringOrganization?.name||ld.organizer?.name||'';
  if(!company) company=document.querySelector('meta[property=\"og:site_name\"]')?.content?.trim()||'';
  if(!company) company=getByLabel('Company')||getByLabel('Hiring Organization');
  if(!company) [...document.querySelectorAll('p,li,span,td')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Company:/i)){company=t.replace(/^Company:/i,'').trim();return true;}});

  // Date
  let date=getText(['[data-careersite-propertyid=\"date\"]','[itemprop=\"datePosted\"]','[class*=\"posted-date\"]','[class*=\"post-date\"]','[class*=\"date-posted\"]','.posting-date','[data-test=\"posted-date\"]','[data-automation=\"date-posted\"]','time','[datetime]','.date','[class*=\"publish\"]','.updated-date','.created-date','[class*=\"listing-date\"]','[class*=\"job-posted\"]','.closingDate','[class*=\"closing-date\"]','[class*=\"expiry\"]']);
  if(!date || date.toLowerCase().includes('date')) date=getByLabel('Posted')||getByLabel('Date posted')||getByLabel('Date');
  if(!date) date=document.querySelector('meta[itemprop=\"datePosted\"]')?.content||document.querySelector('[itemprop=\"datePosted\"]')?.getAttribute('datetime')||document.querySelector('time')?.getAttribute('datetime')||'';
  if(!date&&ld) date=ld.datePosted||ld.validThrough||'';
  if(!date) date=fullText.match(/Posted\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i)?.[1]||'';

  // Description
  let category=getByLabel('Job Category') || getByLabel('Department');
  let jobType=getByLabel('Job Type') || getByLabel('Employee Type');
  let description=getText(['.job-summary','.box.p-24','.ql-editor','.mjp-job-ad__content','.ats-description','.main-jd-body','.job__description','#content .content','.jobdescription','.fr-view','[itemprop=\"description\"]','.job-description','.description','#job-description','[data-test=\"job-description\"]','[data-automation=\"jobAdDetails\"]','.job-details__description','.posting-description','.jd-desc','.job-body','.content-description','article']);
  if(!description) description=getAllText('.mjp-show-more__content');
  if(!description) description=getAllText('.text5');
  
  let finalDesc = '';
  if(category) finalDesc += `Category: ${category}\n`;
  if(jobType)  finalDesc += `Type: ${jobType}\n`;
  if(finalDesc) finalDesc += `\n`;
  finalDesc += description || getAllText('p') || fullText.slice(0, 2000);
  description = finalDesc;

  // Apply Link
  let applyLink = '';
  const applySelectors = [
    '[data-tag=\"applyNowBtn\"]',
    'a[href*=\"apply\"]:not([href^=\"mailto:\"])',
    '#apply_button',
    '[class*=\"apply\"] a:not([href^=\"mailto:\"])',
    'a[class*=\"apply\"]:not([href^=\"mailto:\"])',
    '[data-test=\"apply-button\"]',
    '[data-automation=\"apply-button\"]',
    'a[id*=\"apply\"]:not([href^=\"mailto:\"])',
    '.btn-apply',
    '[class*=\"btn-apply\"]',
    '[class*=\"apply-btn\"]',
    'a[title*=\"Apply\"]:not([href^=\"mailto:\"])',
    'a[aria-label*=\"Apply\"]:not([href^=\"mailto:\"])',
    'a[href*=\"application\"]:not([href^=\"mailto:\"])',
    'a[href*=\"submit\"]:not([href^=\"mailto:\"])',
    '[class*=\"cta\"] a:not([href^=\"mailto:\"])'
  ];

  for (const sel of applySelectors) {
    const el = document.querySelector(sel);
    if (el && el.href && !el.href.startsWith('mailto:')) {
      applyLink = el.href;
      break;
    }
    if (el && el.dataset?.href && !el.dataset.href.startsWith('mailto:')) {
      applyLink = el.dataset.href;
      break;
    }
    if (el && el.dataset?.applyUrl && !el.dataset.applyUrl.startsWith('mailto:')) {
      applyLink = el.dataset.applyUrl;
      break;
    }
  }

  if(!applyLink){
    const btn = document.querySelector('[data-tag=\"applyNowBtn\"]') ||
                document.querySelector('button[aria-label=\"Apply\"]') || 
                document.querySelector('button[class*=\"apply\"]') || 
                [...document.querySelectorAll('button')].find(b => b.innerText.toLowerCase().includes('apply'));
    applyLink = btn ? 'Apply button (JS trigger)' : 'Not Found';
  }

  // Experience
  let experience=getByLabel('Experience range (Years)')||fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?)(\s+of(\s+relevant)?\s+experience)?)/i)?.[0]||'';
  if(!experience) experience=getText(['.experience-range p','[data-careersite-propertyid=\"experience\"]','[class*=\"experience\"]','[data-test=\"experience\"]','.job-experience','.experience-level','[itemprop=\"experienceRequirements\"]','.years-experience','[class*=\"exp-level\"]','[class*=\"exp-years\"]']);
  if(!experience&&ld) experience=ld.experienceRequirements?.monthsOfExperience?`${Math.round(ld.experienceRequirements.monthsOfExperience/12)} years`:String(ld.experienceRequirements||'');
  if(!experience) [...document.querySelectorAll('p,li,span,td,dt,dd')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Experience\s*:/i)){experience=t.replace(/^Experience\s*:/i,'').trim();return true;}});
  if(!experience) experience=fullText.match(/(\d+\+?)\s+years?\s+of\s+(work\s+)?(experience|exp\.?)/i)?.[0]||'';
  if(!experience) experience=fullText.match(/minimum\s+(\d+\+?)\s+years?/i)?.[0]||'';
  if(!experience) experience=fullText.match(/at\s+least\s+(\d+\+?)\s+years?/i)?.[0]||'';
  if(!experience) experience=fullText.match(/(\d+\+)\s*years?/i)?.[0]||'';
  if(!experience&&/fresher|entry[\s-]level|0[\s-]?\d?\s*years?/i.test(fullText)) experience='Fresher / Entry Level';
  if(!experience) experience=fullText.match(/\b(junior|mid[\s-]?level|senior|lead|principal|staff)\b/i)?.[0]||'';
  if(!experience) experience=(document.querySelector('meta[name=\"description\"]')?.content||'').match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[0]||'';
  if(!experience) experience=fullText.match(/\bExp[:\s]+(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[1]||'';

  // Salary
  let salary='';
  const cm=fullText.match(/(\$|₹|Rs\.?|INR|USD|GBP|EUR)\s?[\d,]+(\.\d+)?(\s*(K|L|Lac|Lakh|LPA|CTC|PA|per\s+annum|per\s+month|pm|annually)?)/gi);
  if(cm) salary=cm.join(' - ');
  if(!salary){const sl=[...document.querySelectorAll('p')].map(p=>p.innerText).find(t=>t.toLowerCase().includes('pay range'));if(sl)salary=sl;}
  if(!salary) salary=getText(['[data-careersite-propertyid=\"salary\"]','[class*=\"salary\"]','[itemprop=\"baseSalary\"]','.compensation','[class*=\"compensation\"]','.pay-range','[data-test=\"salary\"]','[class*=\"pay-\"]','.stipend','[class*=\"stipend\"]','.ctc','[class*=\"ctc\"]']);
  if(!salary&&ld?.baseSalary){const bs=ld.baseSalary;if(bs.value?.minValue&&bs.value?.maxValue)salary=`${bs.currency||''} ${bs.value.minValue} - ${bs.value.maxValue} (${bs.value.unitText||''})`;else if(bs.value?.value)salary=`${bs.currency||''} ${bs.value.value} (${bs.value.unitText||''})`;} 
  if(!salary) [...document.querySelectorAll('p,li,span,td,dt,dd')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Salary\s*:/i)){salary=t.replace(/^Salary\s*:/i,'').trim();return true;}});
  if(!salary) salary=fullText.match(/[\d.]+\s*(to|-)?\s*[\d.]*\s*(LPA|Lakh|Lac|CTC)/gi)?.[0]||'';
  if(!salary) salary=fullText.match(/[Uu]p\s*to\s+(\$|₹|Rs\.?|INR)?\s*[\d,]+\s*(K|L|LPA|Lakh)?/i)?.[0]||'';
  if(!salary) [...document.querySelectorAll('p,li,td,span')].some(el=>{const t=el.innerText?.trim().toLowerCase();if(t?.includes('salary range')||t?.includes('total compensation')){salary=el.innerText.trim();return true;}});
  if(!salary) salary='Not Available';

  // Job ID
  let jobId=getByLabel('Job ID')||getByLabel('Job number')||fullText.match(/Job\s+requisition\s+ID\s*::?\s*(\S+)/i)?.[1]||fullText.match(/Job\s*I[Dd][:\s#]*(\S+)/i)?.[1]||fullText.match(/Req(?:uisition)?\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1]||'';
  if(!jobId){const m=window.location.pathname.match(/\/(\d{5,})/);jobId=m?.[1]||'';}
  if(!jobId){const p=new URLSearchParams(window.location.search);jobId=p.get('jobId')||p.get('id')||p.get('job_id')||p.get('jid')||'';}
  if(!jobId) jobId=getText(['[data-careersite-propertyid=\"adcode\"]','[data-careersite-propertyid=\"jobid\"]','[class*=\"job-id\"]','[class*=\"jobid\"]','[data-test=\"job-id\"]','[data-job-id]','[id*=\"job-id\"]','.req-id','[class*=\"req-id\"]','.reference-id','[class*=\"reference\"]']);
  if(!jobId) jobId=document.querySelector('[data-job-id]')?.getAttribute('data-job-id')||'';
  if(!jobId&&ld) jobId=ld.identifier?.value||String(ld.identifier||'')||'';
  if(!jobId) jobId=fullText.match(/Ref(?:erence)?\s*(?:No|#|ID)[:\s]*(\S+)/i)?.[1]||'';
  if(!jobId) jobId=fullText.match(/Position\s*ID[:\s]*(\S+)/i)?.[1]||'';
  if(!jobId) jobId=fullText.match(/Opening\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1]||'';
  if(!jobId) jobId=fullText.match(/Vacancy\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1]||'';

  return {
    title:       title       || 'Not Found',
    location:    location    || 'Not Found',
    company:     company     || 'Not Found',
    date:        date        || 'Not Found',
    description: description || 'Not Found',
    applyLink:   applyLink   || 'Not Found',
    experience:  experience  || 'Not Found',
    salary:      salary      || 'Not Available',
    jobId:       jobId       || 'Not Found',
  };
}


// ════════════════════════════════════════════════════════════════════════════
// 🛠️  UTILITIES
// ════════════════════════════════════════════════════════════════════════════
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let lastH = 0;
      const t = setInterval(() => {
        window.scrollBy(0, 600);
        if (document.body.scrollHeight === lastH) { clearInterval(t); resolve(); }
        lastH = document.body.scrollHeight;
      }, 800);
    });
  });
  await page.waitForTimeout(1500);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
