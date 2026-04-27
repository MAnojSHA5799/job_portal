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
(async () => {
  console.log("🚀 Starting Playwright Multi-ATS Scraper...");

  // ── Supabase se active URLs fetch karo ──────────────────────────────────
  let jobUrls = [];
  try {
    const { data: targetUrls, error: urlsError } = await supabase
      .from('scraper_urls')
      .select('url')
      .eq('is_active', true);

    if (urlsError) {
      console.error("⚠️  URL Fetch Error:", urlsError.message);
    } else {
      jobUrls = (targetUrls || []).map(t => t.url);
      console.log(`📊 Found ${jobUrls.length} active URLs in database.`);
    }
  } catch (err) {
    console.error("❌ Supabase connection error:", err.message);
  }

  if (jobUrls.length === 0) {
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
  for (const listingUrl of jobUrls) {
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

      // ── ATS-specific scraper call ──────────────────────────────────────
      const jobsBatch = [];

      if      (type === 'darwinbox')            { await page.waitForSelector('.job-tile',       { timeout: 25000 }).catch(() => {}); await autoScroll(page); await scrapeDarwinbox(page, context, listingUrl, jobsBatch); }
      else if (type === 'caterpillar')          { await page.waitForSelector('.card.card-job',  { timeout: 25000 }).catch(() => {}); await scrapeCaterpillarAllPages(page, context, jobsBatch); }
      else if (type === 'smartrecruiters')      { await scrapeSmartRecruiters(page, context, listingUrl, jobsBatch); }
      else if (type === 'smartrecruiters_jobs') { await scrapeSmartRecruitersJobs(page, context, listingUrl, jobsBatch); }
      else if (type === 'workday')              { await scrapeWorkday(page, context, listingUrl, jobsBatch); }
      else if (type === 'oracle')               { await scrapeOracle(page, context, listingUrl, jobsBatch); }
      else if (type === 'paramai')              { await scrapeParamai(page, context, listingUrl, jobsBatch); }
      else if (type === 'csod')                 { await scrapeCsod(page, context, listingUrl, jobsBatch); }
      else if (type === 'lever')                { await scrapeLever(page, context, listingUrl, jobsBatch); }
      else if (type === 'greenhouse')           { await scrapeGreenhouse(page, context, listingUrl, jobsBatch); }
      else if (type === 'taleo')                { await scrapeTaleo(page, context, listingUrl, jobsBatch); }
      else if (type === 'icims')                { await scrapeIcims(page, context, listingUrl, jobsBatch); }
      else if (type === 'successfactors')       { await scrapeSuccessFactors(page, context, listingUrl, jobsBatch); }
      else if (type === 'brassring')            { await scrapeBrassring(page, context, listingUrl, jobsBatch); }
      else if (type === 'jobvite')              { await scrapeJobvite(page, context, listingUrl, jobsBatch); }
      else if (type === 'ashby')                { await scrapeAshby(page, context, listingUrl, jobsBatch); }
      else if (type === 'naukri_embed')         { await scrapeNaukriEmbed(page, context, listingUrl, jobsBatch); }
      else                                      { await scrapeGenericListing(page, context, listingUrl, jobsBatch); }

      console.log(`  📦 ${jobsBatch.length} jobs scraped from this URL`);
      allResults.push(...jobsBatch);

      // ── Filter + Supabase Save ─────────────────────────────────────────
      const urlJobsSaved = await filterAndSaveJobs(jobsBatch, listingUrl, runLogId);
      totalJobsSaved += urlJobsSaved;

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
  // "TERRITORY MANAGER-SALES\nApply now »" → "TERRITORY MANAGER-SALES"
  return t.replace(/\n.*$/s, '').replace(/Apply now »/gi, '').trim();
}

// ✅ FIX 1: cleanLocation — "Job Segment:" garbage hata ke real city nikalo
function cleanLocation(loc = '') {
  if (!loc) return 'Not Found';

  // "Job Segment: Field Sales, ..." jaisi garbage string — poori hata do
  if (/^Job Segment:/i.test(loc.trim())) return 'Not Found';

  // Agar multiple lines hain, pehli meaningful line lo
  const lines = loc.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // "Job Segment:" wali line skip karo
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
  // "rs, - rs, pa" or "rs, - $1 - rs," jaisi mixed garbage patterns
  // Real salary = actual amount (100+) ke saath honi chahiye
  const numbers = trimmed.match(/\d+/g) || [];
  const hasRealAmount = numbers.some(n => parseInt(n) >= 100);
  if (!hasRealAmount) return 'Not Available';
  return trimmed;
}

function cleanExperience(exp = '') {
  if (!exp) return 'Not Found';
  const n = parseInt(exp);
  // "22 years" jaisa clearly absurd value → Not Found
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
  // "Mon Apr 27 00:00:00 UTC 2026" → "2026-04-27"
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
      if (!location.toLowerCase().includes(scraperFilters.country.toLowerCase())) {
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
  if (u.includes('taleo.net') || u.includes('ibegin.tcs.com'))            return 'taleo';
  if (u.includes('lever.co'))                                              return 'lever';
  if (u.includes('greenhouse.io') || u.includes('boards.greenhouse'))     return 'greenhouse';
  if (u.includes('icims.com'))                                             return 'icims';
  if (u.includes('successfactors.com') || u.includes('sapsf.com'))        return 'successfactors';
  if (u.includes('brassring.com') || u.includes('kenexa.com'))            return 'brassring';
  if (u.includes('jobvite.com'))                                           return 'jobvite';
  if (u.includes('ashbyhq.com') || u.includes('jobs.ashby'))              return 'ashby';
  if (u.includes('param.ai'))                                              return 'paramai';
  if (u.includes('caterpillar.com/en/jobs'))                              return 'caterpillar';
  if (u.includes('careers.smartrecruiters.com'))                          return 'smartrecruiters';
  if (u.includes('smartrecruiters.com') || (u.includes('/search/') && (u.includes('jobs.') || u.includes('careers.')))) return 'smartrecruiters_jobs';
  return null;
}


// ════════════════════════════════════════════════════════════════════════════
// 🔬  LEVEL 2 — DOM Fingerprint se Type Detect
// ════════════════════════════════════════════════════════════════════════════
async function detectTypeFromDom(page) {
  return await page.evaluate(() => {
    const html     = document.documentElement.innerHTML.toLowerCase();
    const metaApp  = document.querySelector('meta[name="application-name"]')?.content?.toLowerCase() || '';
    const scripts  = [...document.querySelectorAll('script[src]')].map(s => s.src.toLowerCase()).join(' ');
    const url      = window.location.href.toLowerCase();

    if (document.querySelector('[data-automation-id="jobTitle"]') || scripts.includes('workday') || url.includes('workday')) return 'workday';
    if (document.querySelector('.job-tile') || document.querySelector('[data-careersite-propertyid]') || html.includes('darwinbox')) return 'darwinbox';
    if (document.querySelector('.js-jobs-list-item') || document.querySelector('li[data-job-id]') || html.includes('smartrecruiters') || metaApp.includes('smartrecruiters')) return 'smartrecruiters_jobs';
    if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
    if (document.querySelector('[class*="rec-listing"]') || html.includes('csod') || scripts.includes('csod')) return 'csod';
    if (document.querySelector('.requisitionListItem') || html.includes('oraclecloud')) return 'oracle';
    if (html.includes('successfactors') || scripts.includes('successfactors')) return 'successfactors';
    if (document.querySelector('[class*="taleo"]') || html.includes('taleo') || url.includes('taleo')) return 'taleo';
    if (document.querySelector('.posting') || html.includes('lever.co')) return 'lever';
    if (document.querySelector('.opening') || html.includes('greenhouse')) return 'greenhouse';
    if (document.querySelector('[class*="iCIMS"]') || html.includes('icims')) return 'icims';
    if (html.includes('brassring') || html.includes('kenexa')) return 'brassring';
    if (document.querySelector('[class*="jv-"]') || html.includes('jobvite')) return 'jobvite';
    if (html.includes('ashbyhq') || scripts.includes('ashby')) return 'ashby';
    if (html.includes('param.ai') || document.querySelector('[class*="JobCard"]')) return 'paramai';
    if (document.querySelector('.card.card-job')) return 'caterpillar';
    if (html.includes('naukri') || document.querySelector('[class*="naukri"]')) return 'naukri_embed';
    return 'generic_listing';
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 🦅  DARWINBOX
// ════════════════════════════════════════════════════════════════════════════
async function scrapeDarwinbox(page, context, listingUrl, results) {
  const jobLinks = await page.evaluate((base) => {
    return [...document.querySelectorAll('.job-tile')].map(tile => {
      const subs = tile.querySelectorAll('.sub-section');
      const rel  = tile.querySelector('a.db-btn')?.getAttribute('href') || '';
      return {
        title:       tile.querySelector('.job-title')?.innerText?.trim()           || 'Not Found',
        location:    subs[0]?.querySelector('span[dbtooltip]')?.innerText?.trim()  || 'Not Found',
        experience:  subs[1]?.querySelector('span span')?.innerText?.trim()        || 'Not Found',
        description: tile.querySelector('.job-description span')?.innerText?.trim()|| '',
        detailUrl:   rel ? new URL(rel, base).href : '',
      };
    });
  }, listingUrl);
  console.log(`  ↳ Darwinbox: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'darwinbox', results); await delay(400); }
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
      document.querySelector('a[rel="next"]')?.href ||
      [...document.querySelectorAll('a')].find(a =>
        a.innerText?.trim().toLowerCase() === 'next' ||
        a.getAttribute('aria-label')?.toLowerCase().includes('next')
      )?.href ||
      document.querySelector('.pagination .active,[aria-current="page"]')?.nextElementSibling?.querySelector('a')?.href ||
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
  await page.waitForSelector('[class*="opening"], article, .js-job', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('li[class*="opening"], article[class*="job"], .js-job')];
    if (!cards.length) return [...document.querySelectorAll('a[href*="/jobs/"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(c => ({
      title:    c.querySelector('h4,h3,h2,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: c.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('.js-jobs-list-item, [class*="job-listing"], li[data-job-id]', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.js-jobs-list-item, [class*="jobCard"], li[data-job-id]')];
    if (!items.length) return [...document.querySelectorAll('a[href*="/job/"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title:    item.querySelector('h2,h3,[class*="title"],a')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],.job-location')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ SR-Jobs: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'smartrecruiters_jobs', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔵  WORKDAY
// ════════════════════════════════════════════════════════════════════════════
async function scrapeWorkday(page, context, listingUrl, results) {
  await page.waitForSelector('[data-automation-id="jobTitle"]', { timeout: 30000 }).catch(() => console.log('⚠️  Workday list nahi mila'));
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('li[class*="css-"]')]
      .filter(li => li.querySelector('[data-automation-id="jobTitle"]'))
      .map(item => ({
        title:    item.querySelector('[data-automation-id="jobTitle"]')?.innerText?.trim() || 'Not Found',
        location: item.querySelector('[data-automation-id="location"]')?.innerText?.trim() || 'Not Found',
        date:     item.querySelector('[data-automation-id="postedOn"]')?.innerText?.trim() || 'Not Found',
        detailUrl: item.querySelector('a')?.href || '',
      }))
  );
  console.log(`  ↳ Workday: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'workday', results); await delay(500); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟣  ORACLE CLOUD
// ════════════════════════════════════════════════════════════════════════════
async function scrapeOracle(page, context, listingUrl, results) {
  await page.waitForSelector('.requisitionListItem, [class*="jobResult"], [class*="job-tile"]', { timeout: 30000 }).catch(() => console.log('⚠️  Oracle list nahi mila'));
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.requisitionListItem, [class*="jobResult"], [class*="job-tile"]')];
    if (!items.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title:    item.querySelector('a,h3,h2,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ Oracle: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'oracle', results); await delay(500); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟠  PARAM.AI
// ════════════════════════════════════════════════════════════════════════════
async function scrapeParamai(page, context, listingUrl, results) {
  await page.waitForSelector('[class*="job"], .card, article', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[class*="JobCard"],[class*="job-card"],.card')].filter(c => c.querySelector('a'));
    if (!cards.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(card => ({
      title:      card.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location:   card.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
      experience: card.querySelector('[class*="exp"]')?.innerText?.trim() || 'Not Found',
      detailUrl:  card.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ Param.ai: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'paramai', results, { company: 'Maruti Suzuki' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔴  CSOD
// ════════════════════════════════════════════════════════════════════════════
async function scrapeCsod(page, context, listingUrl, results) {
  await page.waitForSelector('[class*="rec-listing"], .cs-job-listing, [id*="job"]', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[class*="rec-listing-job"],[class*="job-listing-item"],tr[class*="rec-listing"]')];
    if (!items.length) return [...document.querySelectorAll('a[href*="requisition"],a[href*="job"]')].filter(a => a.innerText?.trim()).map(a => ({ title: a.innerText.trim(), location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title:    item.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('.posting', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.posting')].map(p => ({
      title:    p.querySelector('h5,.posting-name,[data-qa="posting-name"]')?.innerText?.trim() || 'Not Found',
      location: p.querySelector('.sort-by-location,.posting-categories')?.innerText?.trim() || 'Not Found',
      detailUrl: p.querySelector('a')?.href || '',
    }))
  );
  console.log(`  ↳ Lever: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'lever', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🌿  GREENHOUSE
// ════════════════════════════════════════════════════════════════════════════
async function scrapeGreenhouse(page, context, listingUrl, results) {
  await page.waitForSelector('.opening, [class*="opening"]', { timeout: 20000 }).catch(() => {});
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
  await page.waitForSelector('[class*="requisition"], .listSingleColumnLayoutTable, [id*="Requisition"]', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="taleo"]');
    if (iframe) return [{ title: 'Taleo iFrame detected', location: 'Not Found', detailUrl: iframe.src }];
    const rows = [...document.querySelectorAll('tr[class*="requisition"],tr[id*="req"],div[class*="requisition"],.listSingleColumnLayoutTable tr')];
    if (!rows.length) return [...document.querySelectorAll('a[href*="requisition"],a[href*="jobId"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return rows.map(row => ({
      title:    row.querySelector('a,.requisitionTitle')?.innerText?.trim() || 'Not Found',
      location: row.querySelector('[class*="location"],td:nth-child(3)')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="iCIMS"],[class*="icims"],[id*="icims"],.jobs-section', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('[class*="iCIMS_JobsTable"] tr,[class*="job-listing"],.iCIMS_JobsTable tr')];
    if (!items.length) return [...document.querySelectorAll('a[href*="iCIMS"],a[href*="icims"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title:    item.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],td:nth-child(2)')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="jobRequisitionID"],[class*="job-tile"],[data-id]', { timeout: 30000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[class*="job-tile"],[class*="jobCard"],[data-id][class*="job"]')];
    if (!cards.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(card => ({
      title:    card.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: card.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
      detailUrl: card.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ SuccessFactors: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'successfactors', results); await delay(500); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔩  BRASSRING / KENEXA
// ════════════════════════════════════════════════════════════════════════════
async function scrapeBrassring(page, context, listingUrl, results) {
  await page.waitForSelector('[class*="jobTitle"],[class*="job-title"],table.jobs tr', { timeout: 25000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table tr,[class*="jobRow"],[class*="job-row"]')].filter(r => r.querySelector('a'));
    if (!rows.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return rows.map(r => ({
      title:    r.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: r.querySelector('[class*="location"],td:nth-child(2)')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('.jv-job-item,.jv-job-list-item,[class*="jv-job"]', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.jv-job-item,.jv-job-list-item')].map(item => ({
      title:    item.querySelector('a,.jv-job-title')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('.jv-job-location,[class*="location"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="ashby"],[class*="job-posting"],._content', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/jobs/"], a[href*="/posting/"]')].map(a => ({
      title:    a.querySelector('[class*="title"],h3,h2')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
      location: a.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="naukri"],[class*="jobCard"],article', { timeout: 20000 }).catch(() => {});
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('[class*="jobTuple"],[class*="job-card"],article')].map(card => ({
      title:    card.querySelector('a.title,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: card.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
      detailUrl: card.querySelector('a')?.href || '',
    }))
  );
  console.log(`  ↳ Naukri embed: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'naukri_embed', results); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🌐  GENERIC LISTING
// ════════════════════════════════════════════════════════════════════════════
async function scrapeGenericListing(page, context, listingUrl, results) {
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const patterns = [
      '[class*="job-card"] a','[class*="jobCard"] a','[class*="job-listing"] a',
      '[class*="job-result"] a','[class*="job-item"] a','[class*="position"] a',
      'article a','.vacancies a','.career-list a',
      'table tr td a[href*="job"]','ul li a[href*="job"]',
      'a[href*="/job/"]','a[href*="/jobs/"]','a[href*="jobId"]',
      'a[href*="vacancy"]','a[href*="requisition"]',
    ];
    const seen = new Set(), out = [];
    for (const pat of patterns) {
      try {
        for (const a of document.querySelectorAll(pat)) {
          const href = a.href;
          if (!href || href === window.location.href || seen.has(href)) continue;
          seen.add(href);
          const parent = a.closest('li,tr,div,article,section') || a.parentElement;
          out.push({
            title:    (parent?.querySelector('h1,h2,h3,h4,[class*="title"]')?.innerText?.trim() || a.innerText?.trim() || a.getAttribute('title') || 'Not Found').slice(0, 200),
            location: parent?.querySelector('[class*="location"],[class*="city"],address')?.innerText?.trim() || 'Not Found',
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
  if (!job.detailUrl) {
    results.push({ source, ...extra, ...job, salary: 'Not Available', date: 'Not Found', jobId: 'Not Found', company: extra.company || 'Not Found', description: 'Not Found', applyLink: 'Not Found' });
    return;
  }
  const page = await context.newPage();
  console.log(`    🔎 ${job.title?.slice(0, 60)}`);
  try {
    await page.goto(job.detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3500);
    await page.waitForLoadState('networkidle').catch(() => {});
    const details = await page.evaluate(genericJobEvaluator);
    results.push({
      source,
      url:         job.detailUrl,
      title:       details.title       !== 'Not Found' ? details.title       : job.title,
      // ✅ FIX 3: Location — listing page ki scraped location prefer karo agar detail page se nahi mili
      location:    extractBestLocation(details.location, job.location),
      company:     details.company     !== 'Not Found' ? details.company     : (extra.company   || 'Not Found'),
      date:        details.date,
      experience:  details.experience  !== 'Not Found' ? details.experience  : (job.experience  || 'Not Found'),
      description: details.description,
      applyLink:   details.applyLink,
      salary:      details.salary,
      jobId:       details.jobId       !== 'Not Found' ? details.jobId       : (job.jobId       || 'Not Found'),
    });
    console.log(`       ✅ OK`);
  } catch (err) {
    console.log(`       ❌ ${err.message}`);
    results.push({ source, url: job.detailUrl, ...extra, ...job, error: true, message: err.message });
  }
  await page.close();
}

// ✅ FIX 4: Helper — dono locations mein se best ek choose karo
function extractBestLocation(detailLoc = '', listingLoc = '') {
  // "Job Segment:" wali garbage reject karo
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
  const getAllText = (sel) => { try { return [...document.querySelectorAll(sel)].map(el=>el.innerText?.trim()).filter(Boolean).join('\n'); } catch(e){return '';} };
  const getJsonLd = () => { try { for (const b of document.querySelectorAll('script[type="application/ld+json"]')) { const json=JSON.parse(b.textContent); const items=json['@graph']?json['@graph']:[json]; const job=items.find(i=>i['@type']==='JobPosting'||i['@type']==='Job'); if(job) return job; } } catch(e){} return null; };
  const fullText = document.body?.innerText || '';
  const ld = getJsonLd();

  // Oracle/JPMC KO.js
  try { const root=document.querySelector('job-details-page'); if(window.ko&&root){const koData=window.ko.dataFor(root); if(koData?.pageData){const jd=koData.pageData().job; return {title:jd.title||'',location:jd.primaryLocation||'',company:document.querySelector('meta[property="og:site_name"]')?.content||'Not Found',date:jd.postedDate||'Not Found',description:jd.description?.replace(/<[^>]+>/g,'')||'Not Found',applyLink:window.location.href,experience:jd.description?.match(/(\d+\+?\s*(years|yrs))/i)?.[0]||'Not Found',salary:'Not Available',jobId:String(jd.id||'Not Found')};}}} catch(e){}

  // Workday detail
  try { const wdT=document.querySelector('[data-automation-id="jobPostingHeader"]')?.innerText?.trim(); if(wdT) return {title:wdT,location:document.querySelector('[data-automation-id="location"]')?.innerText?.trim()||'Not Found',company:document.querySelector('[data-automation-id="company"]')?.innerText?.trim()||document.querySelector('meta[property="og:site_name"]')?.content||'Not Found',date:document.querySelector('[data-automation-id="postedOn"]')?.innerText?.trim()||'Not Found',description:document.querySelector('[data-automation-id="jobPostingDescription"]')?.innerText?.trim()||fullText.slice(0,3000),applyLink:document.querySelector('a[href*="apply"]')?.href||window.location.href,experience:fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[0]||'Not Found',salary:'Not Available',jobId:window.location.pathname.match(/\/(\d{5,}|[A-Z0-9_-]{6,})(?:[/?#]|$)/)?.[1]||'Not Found'};} catch(e){}

  let title=getText(['span[itemprop="title"][data-careersite-propertyid="title"]','[data-careersite-propertyid="title"]','.job__title h1','.app-title','.posting-headline h2','.jobTitle','h1 span[itemprop="title"]','h1','[data-test="job-title"]','[class*="job-title"]','[id*="job-title"]','[itemprop="title"]','.careers-title','.role-title','.jd-title','.job-header__title','.header-title','[data-automation="job-title"]','[data-ph-at-id="job-title"]','.job-title--h1','[aria-label="Job title"]','meta[property="og:title"]']);
  if(!title) title=ld?.title||ld?.name||'';
  if(!title) title=document.querySelector('meta[property="og:title"]')?.content?.trim()||'';
  if(!title) title=document.title?.split(/[|\-]/)[0]?.trim()||'';
  if(!title) [...document.querySelectorAll('p,li,span,td,h2,h3')].some(el=>{const t=el.innerText?.trim();if(t?.startsWith('Position:')){title=t.replace(/^Position:/i,'').trim();return true;}});

  // ✅ FIX 5: Location scraping improved — SmartRecruiters detail page ke specific selectors add kiye
  let location='',company='';
  const cityText=getText(['.jobCity']);
  if(cityText){const p=cityText.split(',');location=p[0]?.trim();company=p[1]?.trim();}

  if(!location) location=getText([
    // SmartRecruiters specific
    '[data-qa="job-location"]',
    '.job-detail__location',
    '[class*="jobLocation"]',
    '[class*="job-location"]',
    // Standard selectors
    '[data-careersite-propertyid="city"]',
    '[data-careersite-propertyid="location"]',
    '.job__location div',
    '.location',
    '.jobGeoLocation',
    '.posting-categories .location',
    '[data-test="location"]',
    '[itemprop="jobLocation"]',
    '[class*="location"]',
    'address',
    '[data-automation="job-location"]',
    '[data-ph-at-id="location"]',
    '.job-location__city',
    '.location-name',
    '.city-state',
    '[aria-label="Job location"]',
    '.work-location',
    '.office-location',
    '.position-location',
    '[class*="job-city"]',
    '[class*="job-region"]',
  ]);

  // ✅ FIX 6: "Job Segment:" wali garbage location ko reject karo
  if(location && /^Job Segment:/i.test(location.trim())) location = '';

  // Agar location mein multiple lines hain, sirf pehli meaningful line lo
  if(location) {
    const firstLine = location.split('\n').map(l=>l.trim()).find(l => l.length > 1 && !/^Job Segment:/i.test(l));
    location = firstLine || '';
  }

  if(!location&&ld) location=ld.jobLocation?.address?.addressLocality||ld.jobLocation?.address?.addressRegion||ld.jobLocation?.name||'';
  if(!location) [...document.querySelectorAll('p,li,span,td')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Location:/i)){location=t.replace(/^Location:/i,'').trim();return true;}});

  if(!company) company=getText(['[data-careersite-propertyid="businessunit"]','[data-careersite-propertyid="customfield3"]','[data-careersite-propertyid="customfield1"]','.company','.posting-company','[itemprop="hiringOrganization"]','[class*="company-name"]','.employer-name','.org-name','[data-test="company-name"]','[data-automation="company-name"]','.company__name','.employer','.organization-name','[class*="employer"]','[aria-label="Company name"]','.brand-name','.recruiter-name','.client-name','[class*="company"]','meta[property="og:site_name"]','[name="author"]']);
  if(!company&&ld) company=ld.hiringOrganization?.name||ld.organizer?.name||'';
  if(!company) company=document.querySelector('meta[property="og:site_name"]')?.content?.trim()||'';
  if(!company) [...document.querySelectorAll('p,li,span,td')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Company:/i)){company=t.replace(/^Company:/i,'').trim();return true;}});

  let date=getText(['[data-careersite-propertyid="date"]','[itemprop="datePosted"]','[class*="posted-date"]','[class*="post-date"]','[class*="date-posted"]','.job-date','.posting-date','[data-test="posted-date"]','[data-automation="date-posted"]','time','[datetime]','.date','[class*="publish"]','.updated-date','.created-date','[class*="listing-date"]','[class*="job-posted"]','.closingDate','[class*="closing-date"]','[class*="expiry"]']);
  if(!date) date=document.querySelector('meta[itemprop="datePosted"]')?.content||document.querySelector('[itemprop="datePosted"]')?.getAttribute('datetime')||document.querySelector('time')?.getAttribute('datetime')||'';
  if(!date&&ld) date=ld.datePosted||ld.validThrough||'';
  if(!date) date=fullText.match(/Posted\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i)?.[1]||'';

  // ✅ FIX 7: Description — poora text lo, koi cutoff nahi
  let description=getText(['.job__description','#content .content','.jobdescription','.fr-view','[itemprop="description"]','.job-description','.description','#job-description','[data-test="job-description"]','[data-automation="jobAdDetails"]','.job-details__description','.posting-description','.jd-desc','.job-body','.content-description','[class*="job-detail"]','[class*="job-desc"]','.role-description','.opportunity-description','article'])||getAllText('.text5');
  if(!description&&ld) description=ld.description?.replace(/<[^>]+>/g,'')||'';
  if(!description) description=document.querySelector('meta[property="og:description"]')?.content?.trim()||'';
  if(!description) description=getAllText('p');
  // Koi slicing/cutoff nahi — poora description as-is

  let applyLink=document.querySelector('a[href*="apply"]')?.href||document.querySelector('#apply_button')?.href||document.querySelector('[class*="apply"] a')?.href||document.querySelector('a[class*="apply"]')?.href||document.querySelector('[data-test="apply-button"]')?.href||document.querySelector('[data-automation="apply-button"]')?.href||document.querySelector('a[id*="apply"]')?.href||document.querySelector('.btn-apply')?.href||document.querySelector('[class*="btn-apply"]')?.href||document.querySelector('[class*="apply-btn"]')?.href||document.querySelector('a[title*="Apply"]')?.href||document.querySelector('a[aria-label*="Apply"]')?.href||document.querySelector('button[class*="apply"]')?.dataset?.href||document.querySelector('[data-apply-url]')?.dataset?.applyUrl||document.querySelector('[action*="apply"]')?.action||document.querySelector('a[href*="application"]')?.href||document.querySelector('a[href*="submit"]')?.href||document.querySelector('[class*="cta"] a')?.href||ld?.applicationContact?.url||ld?.url||'';
  if(!applyLink){const btn=document.querySelector('button[aria-label="Apply"]')||document.querySelector('button[class*="apply"]');applyLink=btn?'Apply button (JS trigger)':'Not Found';}

  let experience=fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?)(\s+of(\s+relevant)?\s+experience)?)/i)?.[0]||'';
  if(!experience) experience=getText(['[data-careersite-propertyid="experience"]','[class*="experience"]','[data-test="experience"]','.job-experience','.experience-level','[itemprop="experienceRequirements"]','.years-experience','[class*="exp-level"]','[class*="exp-years"]']);
  if(!experience&&ld) experience=ld.experienceRequirements?.monthsOfExperience?`${Math.round(ld.experienceRequirements.monthsOfExperience/12)} years`:String(ld.experienceRequirements||'');
  if(!experience) [...document.querySelectorAll('p,li,span,td,dt,dd')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Experience\s*:/i)){experience=t.replace(/^Experience\s*:/i,'').trim();return true;}});
  if(!experience) experience=fullText.match(/(\d+\+?)\s+years?\s+of\s+(work\s+)?(experience|exp\.?)/i)?.[0]||'';
  if(!experience) experience=fullText.match(/minimum\s+(\d+\+?)\s+years?/i)?.[0]||'';
  if(!experience) experience=fullText.match(/at\s+least\s+(\d+\+?)\s+years?/i)?.[0]||'';
  if(!experience) experience=fullText.match(/(\d+\+)\s*years?/i)?.[0]||'';
  if(!experience&&/fresher|entry[\s-]level|0[\s-]?\d?\s*years?/i.test(fullText)) experience='Fresher / Entry Level';
  if(!experience) experience=fullText.match(/\b(junior|mid[\s-]?level|senior|lead|principal|staff)\b/i)?.[0]||'';
  if(!experience) experience=(document.querySelector('meta[name="description"]')?.content||'').match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[0]||'';
  if(!experience) experience=fullText.match(/\bExp[:\s]+(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[1]||'';

  let salary='';
  const cm=fullText.match(/(\$|₹|Rs\.?|INR|USD|GBP|EUR)\s?[\d,]+(\.\d+)?(\s*(K|L|Lac|Lakh|LPA|CTC|PA|per\s+annum|per\s+month|pm|annually)?)/gi);
  if(cm) salary=cm.join(' - ');
  if(!salary){const sl=[...document.querySelectorAll('p')].map(p=>p.innerText).find(t=>t.toLowerCase().includes('pay range'));if(sl)salary=sl;}
  if(!salary) salary=getText(['[data-careersite-propertyid="salary"]','[class*="salary"]','[itemprop="baseSalary"]','.compensation','[class*="compensation"]','.pay-range','[data-test="salary"]','[class*="pay-"]','.stipend','[class*="stipend"]','.ctc','[class*="ctc"]']);
  if(!salary&&ld?.baseSalary){const bs=ld.baseSalary;if(bs.value?.minValue&&bs.value?.maxValue)salary=`${bs.currency||''} ${bs.value.minValue} - ${bs.value.maxValue} (${bs.value.unitText||''})`;else if(bs.value?.value)salary=`${bs.currency||''} ${bs.value.value} (${bs.value.unitText||''})`;} 
  if(!salary) [...document.querySelectorAll('p,li,span,td,dt,dd')].some(el=>{const t=el.innerText?.trim();if(t?.match(/^Salary\s*:/i)){salary=t.replace(/^Salary\s*:/i,'').trim();return true;}});
  if(!salary) salary=fullText.match(/[\d.]+\s*(to|-)?\s*[\d.]*\s*(LPA|Lakh|Lac|CTC)/gi)?.[0]||'';
  if(!salary) salary=fullText.match(/[Uu]p\s*to\s+(\$|₹|Rs\.?|INR)?\s*[\d,]+\s*(K|L|LPA|Lakh)?/i)?.[0]||'';
  if(!salary) [...document.querySelectorAll('p,li,td,span')].some(el=>{const t=el.innerText?.trim().toLowerCase();if(t?.includes('salary range')||t?.includes('total compensation')){salary=el.innerText.trim();return true;}});
  if(!salary) salary='Not Available';

  let jobId=fullText.match(/Job\s+requisition\s+ID\s*::?\s*(\S+)/i)?.[1]||fullText.match(/Job\s*I[Dd][:\s#]*(\S+)/i)?.[1]||fullText.match(/Req(?:uisition)?\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1]||'';
  if(!jobId){const m=window.location.pathname.match(/\/(\d{5,})/);jobId=m?.[1]||'';}
  if(!jobId){const p=new URLSearchParams(window.location.search);jobId=p.get('jobId')||p.get('id')||p.get('job_id')||p.get('jid')||'';}
  if(!jobId) jobId=getText(['[data-careersite-propertyid="adcode"]','[data-careersite-propertyid="jobid"]','[class*="job-id"]','[class*="jobid"]','[data-test="job-id"]','[data-job-id]','[id*="job-id"]','.req-id','[class*="req-id"]','.reference-id','[class*="reference"]']);
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