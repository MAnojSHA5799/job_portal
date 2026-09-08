console.log("⚡ Scraper Script Loaded");
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const MAX_JOBS = 1000;

// ════════════════════════════════════════════════════════════════════════════
// 🔐  SUPABASE CONFIG
// ════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ════════════════════════════════════════════════════════════════════════════
// ⚙️  FILTERS — CLI se base64 encoded JSON aata hai
// ════════════════════════════════════════════════════════════════════════════
let scraperFilters = {
  jobType: 'All',   // 'All' | 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
  jobAge: 'Any',   // 'Any' | '1' | '7' | '30'  (days)
  experienceLevel: 'All',   // 'All' | 'Fresher' | 'Mid' | 'Senior'
  duplicateJob: 'Skip',  // 'Skip' | 'Overwrite'
  country: 'All',   // 'All' | 'India' | 'US' | ...
  maxDescLength: 0,       // 0 = full description save karo, >0 = trim at N chars
  target: 'All Data', // 'All Data' | 'New Only'
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

// ── Global filter config (also used by saveJobsNow) ──────────────────────────
const FILTER_LOCATION = ['india', 'us', 'uae'];
const FILTER_DATE = ''; // Leave empty to match all dates
const JOBS_JSON_PATH = require('path').join(__dirname, 'jobs.json');

// ── Immediate filtered save ───────────────────────────────────────────────────
function saveJobsNow(results) {
  const indianCities = [
    'india', ', in', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'noida', 'gurgaon', 'gurugram',
    'chennai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur',
    'chandigarh', 'indore', 'coimbatore', 'nagpur', 'vadodara', 'kochi', 'visakhapatnam',
    'surat', 'patna', 'ludhiana', 'agra', 'nashik', 'meerut', 'rajkot', 'varanasi', 'srinagar',
    'dharuhera', 'haridwar', 'neemrana', 'halol', 'chittoor', 'mysore', 'mysuru',
    'karnataka', 'maharashtra', 'gujarat', 'tamil nadu', 'telangana', 'kerala', 'haryana', 'uttar pradesh',
    'divitipalli', 'petamitta', 'tenepalli', 'diguvamagham', 'tirupati', 'andhra pradesh', 'head office',
    'terminal a', 'e positive lab', 'corporate office', 'multiple locations'
  ];
  const uaeCities = [
    'united arab emirates', 'uae', 'u.a.e.', 'dubai', 'abu dhabi', 'sharjah', 'ajman',
    'ummal quwain', 'ras al khaimah', 'fujairah'
  ];
  const usCitiesAndStates = [
    'united states', 'usa', 'u.s.a.', 'u.s.', 'north america', 'usa-area', 'usa area',
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
    'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
    'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
    'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
    'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma',
    'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee',
    'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming',
    'new york city', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio',
    'san diego', 'dallas', 'san jose', 'austin', 'san francisco', 'seattle', 'denver', 'boston'
  ];

  const filterArray = Array.isArray(FILTER_LOCATION) ? FILTER_LOCATION : (FILTER_LOCATION ? [FILTER_LOCATION] : []);

  const filtered = results.filter(job => {
    if (job.error) return false;
    const loc = (job.location || '').toLowerCase();
    const jobUrl = ((job.url || '') + ' ' + (job.detailUrl || '') + ' ' + (job.sourceUrl || '')).toLowerCase();

    const isPorscheIndiaUrl = jobUrl.includes('search_criterion_country%5b%5d=81') || jobUrl.includes('search_criterion_country[]=81');
    const isPorscheUSUrl = jobUrl.includes('search_criterion_country%5b%5d=230') || jobUrl.includes('search_criterion_country[]=230');
    const isPorscheUAEUrl = jobUrl.includes('search_criterion_country%5b%5d=231') || jobUrl.includes('search_criterion_country[]=231');

    let locMatch = filterArray.length === 0;
    for (const fi of filterArray) {
      const nf = fi.toLowerCase().trim();
      const urlDash = nf.replace(/\s+/g, '-');
      const inUrl = jobUrl.includes(nf) || jobUrl.includes(urlDash);
      if (nf === 'india') {
        if (indianCities.some(c => loc.includes(c)) || inUrl || isPorscheIndiaUrl || jobUrl.includes('talentrecruit.com') || jobUrl.includes('peoplestrong.com')) { locMatch = true; break; }
      } else if (nf === 'us' || nf === 'usa' || nf === 'united states') {
        const isUS = usCitiesAndStates.some(i => loc.includes(i)) || /\b(us|usa|u\.s\.|u\.s\.a\.)\b/i.test(loc) || /,\s*[a-z]{2}\b/i.test(loc);
        if (isUS || inUrl || jobUrl.includes('united-states') || isPorscheUSUrl) { locMatch = true; break; }
      } else if (nf === 'uae' || nf === 'united arab emirates') {
        const isUAE = uaeCities.some(c => loc.includes(c)) || /\buae\b/i.test(loc);
        if (isUAE || inUrl || jobUrl.includes('united-arab-emirates') || isPorscheUAEUrl) { locMatch = true; break; }
      } else {
        if (loc.includes(nf) || inUrl) { locMatch = true; break; }
      }
    }
    const dateMatch = !FILTER_DATE || (job.date || '').toLowerCase().includes(FILTER_DATE.toLowerCase());
    return locMatch && dateMatch;
  });

  fs.writeFileSync(JOBS_JSON_PATH, JSON.stringify(filtered, null, 2));
  process.stdout.write(`\r  💾 jobs.json updated — ${filtered.length} filtered / ${results.length} total  `);
}

let currentExistingLinks = new Set();

(async () => {
  console.log("🚀 Starting Playwright Multi-ATS Scraper...");
  global.processedUrls = new Set();

  // ── Supabase se active URLs fetch karo ya specific URL use karo ─────────
  let jobUrls = [];
  try {
    if (scraperFilters.targetUrl) {
      const targetUrl = scraperFilters.targetUrl;
      jobUrls = [targetUrl];
      console.log(`📊 Scrape single target URL: ${targetUrl}`);

      // ── ✨ NEW: Ensure targetUrl is saved in the database for tracking ──
      try {
        const { data: existing } = await supabase
          .from('scraper_urls')
          .select('id')
          .eq('url', targetUrl)
          .single();

        if (!existing) {
          await supabase.from('scraper_urls').insert([{ url: targetUrl, is_active: true }]);
          console.log(`📝 Added new target URL to database: ${targetUrl}`);
        }
      } catch (err) {
        // Ignore errors for single() if not found, or other minor db issues
      }
    } else {
      const { data: targetUrls, error: urlsError } = await supabase
        .from('scraper_urls')
        .select('url')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (urlsError) {
        console.error("⚠️  URL Fetch Error:", urlsError.message);
      } else {
        const allUrls = (targetUrls || []).map(t => t.url);

        if (scraperFilters.target === 'New Only') {
          // Fetch URLs that have been scraped successfully in the last 24 hours
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recentLogs } = await supabase
            .from('scraper_logs')
            .select('error_message')
            .eq('status', 'completed')
            .gt('created_at', twentyFourHoursAgo);

          const recentlyScraped = new Set((recentLogs || []).map(l => l.error_message));
          jobUrls = allUrls.filter(url => !recentlyScraped.has(url));
          console.log(`📊 Found ${allUrls.length} active URLs. Filtering for 'New Only': ${jobUrls.length} to process.`);
        } else {
          jobUrls = allUrls;
          console.log(`📊 Found ${jobUrls.length} active URLs in database.`);
        }
      }
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
      await page.waitForLoadState('networkidle').catch(() => { });

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

      if (type === 'kbr') { await scrapeKbr(page, context, listingUrl, jobsBatch); }
      else if (type === 'worley') { await scrapeWorley(page, context, listingUrl, jobsBatch); }
      else if (type === 'ril') { await scrapeRil(page, context, listingUrl, jobsBatch); }
      else if (type === 'darwinbox') { await page.waitForSelector('.job-tile', { timeout: 25000 }).catch(() => { }); await autoScroll(page); await scrapeDarwinbox(page, context, listingUrl, jobsBatch); }
      else if (type === 'caterpillar') { await page.waitForSelector('.card.card-job', { timeout: 25000 }).catch(() => { }); await scrapeCaterpillarAllPages(page, context, jobsBatch); }
      else if (type === 'smartrecruiters') { await scrapeSmartRecruiters(page, context, listingUrl, jobsBatch); }
      else if (type === 'smartrecruiters_jobs') { await scrapeSmartRecruitersJobs(page, context, listingUrl, jobsBatch); }
      else if (type === 'workday') { await scrapeWorkday(page, context, listingUrl, jobsBatch); }
      else if (type === 'oracle') { await scrapeOracle(page, context, listingUrl, jobsBatch); }
      else if (type === 'csod') { await scrapeCsod(page, context, listingUrl, jobsBatch); }
      else if (type === 'lever') { await scrapeLever(page, context, listingUrl, jobsBatch); }
      else if (type === 'greenhouse') { await scrapeGreenhouse(page, context, listingUrl, jobsBatch); }
      else if (type === 'taleo') { await scrapeTaleo(page, context, listingUrl, jobsBatch); }
      else if (type === 'icims') { await scrapeIcims(page, context, listingUrl, jobsBatch); }
      else if (type === 'successfactors') { await scrapeSuccessFactors(page, context, listingUrl, jobsBatch); }
      else if (type === 'brassring') { await scrapeBrassring(page, context, listingUrl, jobsBatch); }
      else if (type === 'jobvite') { await scrapeJobvite(page, context, listingUrl, jobsBatch); }
      else if (type === 'ashby') { await scrapeAshby(page, context, listingUrl, jobsBatch); }
      else if (type === 'naukri_embed') { await scrapeNaukriEmbed(page, context, listingUrl, jobsBatch); }
      else if (type === 'mercedes') { await scrapeMercedes(page, context, listingUrl, jobsBatch); }
      else if (type === 'unilever') { await scrapeUnilever(page, context, listingUrl, jobsBatch); }
      else if (type === 'hitachi') { await scrapeHitachi(page, context, listingUrl, jobsBatch); }
      else if (type === 'siemens') { await scrapeSiemens(page, context, listingUrl, jobsBatch); }
      else if (type === 'honeywell') { await scrapeHoneywell(page, context, listingUrl, jobsBatch); }
      else if (type === 'royal_enfield') { await scrapeRoyalEnfield(page, context, listingUrl, jobsBatch); }
      else if (type === 'bajaj_auto') { await scrapeBajajAuto(page, context, listingUrl, jobsBatch); }
      else if (type === 'aditya_birla') { await scrapeAdityaBirla(page, context, listingUrl, jobsBatch); }
      else if (type === 'panasonic') { await scrapePanasonic(page, context, listingUrl, jobsBatch); }
      else if (type === 'paramai') { await scrapeParamai(page, context, listingUrl, jobsBatch); }
      else if (type === 'jabil') { await scrapeJabil(page, context, listingUrl, jobsBatch); }
      else if (type === 'bp') { await scrapeBp(page, context, listingUrl, jobsBatch); }
      else if (type === 'titan') { await scrapeTitan(page, context, listingUrl, jobsBatch); }
      else if (type === 'regalrexnord') { await scrapeRegalRexnordAllPages(page, context, jobsBatch); }
      else if (type === 'se') { await scrapeSeAllPages(page, context, jobsBatch); }
      else if (type === 'ramboll') { await scrapeRamboll(page, context, listingUrl, jobsBatch); }
      else if (type === 'zohorecruit') { await scrapeZohoRecruit(page, context, listingUrl, jobsBatch); }
      else if (type === 'turbohire') { await scrapeTurbohire(page, context, listingUrl, jobsBatch); }
      else if (type === 'porsche') { await scrapePorsche(page, context, listingUrl, jobsBatch); }
      else if (type === 'tataelxsi') { await scrapeTataElxsi(page, context, listingUrl, jobsBatch); }
      else if (type === 'araymond') { await scrapeARaymond(page, context, listingUrl, jobsBatch); }
      else if (type === 'mokahr') { await scrapeMokaHr(page, context, listingUrl, jobsBatch); }
      else if (type === 'workline') { await scrapeWorkline(page, context, listingUrl, jobsBatch); }
      else if (type === 'mphasis') { await scrapeMphasis(page, context, listingUrl, jobsBatch); }
      else if (type === 'dejobs') { await scrapeDeJobs(page, context, listingUrl, jobsBatch); }
      else if (type === 'atlascopco') { await scrapeAtlasCopco(page, context, listingUrl, jobsBatch); }
      else if (type === 'aecom') { await scrapeAecom(page, context, listingUrl, jobsBatch); }
      else if (type === 'peoplestrong') { await scrapePeopleStrong(page, context, listingUrl, jobsBatch); }
      else if (type === 'ttcportals') { await scrapeTtcPortals(page, context, listingUrl, jobsBatch); }
      else if (type === 'workable') { await scrapeWorkable(page, context, listingUrl, jobsBatch); }
      else if (type === 'teamtailor') { await scrapeTeamtailor(page, context, listingUrl, jobsBatch); }
      else if (type === 'talentrecruit') { await scrapeTalentRecruit(page, context, listingUrl, jobsBatch); }
      else if (type === 'konecranes') { await scrapeKonecranes(page, context, listingUrl, jobsBatch); }
      else { await scrapeGenericListing(page, context, listingUrl, jobsBatch); }

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
  fs.writeFileSync(require('path').join(__dirname, 'jobs.json'), JSON.stringify(allResults, null, 2));
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
  let cleaned = t.replace(/\n.*$/s, '').replace(/Apply now »/gi, '').trim();

  // Clean "Blue Star is hiring for ‘...’ Position"
  const blueStarRegex = /Blue\s+Star\s+is\s+hiring\s+for\s+['"‘`‘“](.*?)['"’`’”“]\s*Position/i;
  const match = cleaned.match(blueStarRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  return cleaned;
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
  if (/intern|internship/i.test(t)) return 'Internship';
  if (/contract|freelance/i.test(t)) return 'Contract';
  if (/part.time/i.test(t)) return 'Part-time';
  return 'Full-time';
}

function deriveCategory(title = '') {
  if (/engineer|developer|architect|tech|software|hardware|devops|data|cloud/i.test(title)) return 'Engineering';
  if (/sales|territory|business.?dev|bd manager/i.test(title)) return 'Sales';
  if (/hr|human.?resource|talent|recruit/i.test(title)) return 'HR';
  if (/finance|account|audit|tax/i.test(title)) return 'Finance';
  if (/market|brand|digital|content/i.test(title)) return 'Marketing';
  if (/design|ux|ui|creative/i.test(title)) return 'Design';
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
    const title = cleanTitle(job.title);
    const location = cleanLocation(job.location);
    const salary = cleanSalary(job.salary);
    const experience = cleanExperience(job.experience);
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

      const jobApplyLink = (job.applyLink || '').toLowerCase();
      const sourceUrlLower = (sourceUrl || '').toLowerCase();
      const isUrlMatch = jobApplyLink.includes(countryFilter) ||
        jobApplyLink.includes(countryFilter.replace(/\s+/g, '-')) ||
        sourceUrlLower.includes(countryFilter) ||
        sourceUrlLower.includes(countryFilter.replace(/\s+/g, '-'));

      let match = locLower.includes(countryFilter) || isUrlMatch;

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

        // Kuch sources ka URL hi India-filtered hota hai (e.g. Workday locationCountry param)
        // Unke liye location filter bypass karo
        if (!match) {
          match = jobApplyLink.includes('locationcountry=c4f78be1a8f14da0ab49ce1162348a5e') ||
            sourceUrlLower.includes('locationcountry=') ||
            sourceUrlLower.includes('selectedlocationsfacet=') ||
            sourceUrlLower.includes('country=') ||
            sourceUrlLower.includes('search_criterion_country%5b%5d=81') ||
            sourceUrlLower.includes('search_criterion_country[]=81') ||
            sourceUrlLower.includes('joblocationcountry') ||
            sourceUrlLower.includes('talentrecruit.com') ||
            sourceUrlLower.includes('facetfilters');
        }
      }

      if (!match && (countryFilter === 'us' || countryFilter === 'usa' || countryFilter === 'united states')) {
        const usCitiesAndStates = [
          'united states', 'usa', 'u.s.a.', 'u.s.', 'united states of america', 'america',
          'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia',
          'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland',
          'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey',
          'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina',
          'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming',
          // Common US cities
          'new york city', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose',
          'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'nashville',
          'oklahoma city', 'el paso', 'boston', 'las vegas', 'portland', 'louisville', 'memphis', 'baltimore', 'milwaukee',
          'albuquerque', 'tucson', 'fresno', 'mesa', 'kansas city', 'omaha', 'atlanta', 'colorado springs', 'raleigh', 'long beach',
          'virginia beach', 'minneapolis', 'tampa', 'new orleans', 'honolulu', 'anaheim', 'lexington', 'aurora', 'st. louis', 'pittsburgh',
          'corpus christi', 'riverside', 'cincinnati', 'santa ana', 'greensboro', 'toledo', 'st. paul', 'newark', 'buffalo', 'plano',
          'lincoln', 'henderson', 'fort wayne', 'jersey city', 'durham', 'chula vista', 'chandler', 'st. petersburg', 'laredo', 'norfolk',
          'madison', 'detroit', 'lubbock', 'garland', 'glendale', 'hialeah', 'reno', 'baton rouge', 'irvine', 'fremont',
          'scottsdale', 'richmond', 'boise', 'san bernardino', 'birmingham', 'spokane', 'rochester', 'des moines', 'montgomery', 'tacoma',
          'akron', 'little rock', 'salt lake city', 'amarillo', 'huntington beach', 'grand rapids', 'tallahassee', 'worcester', 'huntsville',
          'knoxville', 'tempe', 'brownsville', 'modesto', 'oxnard', 'hartford', 'shreveport',
          'peoria', 'mckinney', 'fayetteville', 'providence', 'cape coral', 'moreno valley', 'sioux falls', 'jackson',
          'torrance', 'escondido', 'el monte', 'pembroke pines', 'hayward', 'savannah', 'sunnyvale', 'alexandria', 'cary', 'clarksville',
          'lakewood', 'pomona', 'fort collins', 'sterling heights', 'pasadena', 'macon', 'rockford', 'columbia', 'paterson', 'joliet',
          'bridgeport', 'mcallen', 'salinas', 'killeen', 'bellevue', 'palmdale', 'surprise', 'roseville', 'charleston', 'denton',
          'frisco', 'wichita', 'el cajon', 'overland park', 'santa clarita', 'springfield', 'orange', 'fullerton',
          'fort lauderdale', 'paradise', 'cedar rapids', 'rancho cucamonga', 'dayton', 'santa rosa', 'mesquite', 'oceanside',
          'murfreesboro', 'elk grove', 'lancaster', 'kent', 'corona',
          'easton', 'costa mesa', 'carson', 'usa-area', 'usa area', 'north america'
        ];
        const isPorscheUS = sourceUrlLower.includes('search_criterion_country%5b%5d=230') || sourceUrlLower.includes('search_criterion_country[]=230');
        match = usCitiesAndStates.some(city => locLower.includes(city)) || /\b(us|usa|u\.s\.|u\.s\.a\.)\b/i.test(locLower) || /,\s*[a-z]{2}\b/i.test(locLower) || jobApplyLink.includes('united-states') || sourceUrlLower.includes('united-states') || isPorscheUS;
      }

      if (!match && (countryFilter === 'uae' || countryFilter === 'united arab emirates')) {
        const uaeCities = ['united arab emirates', 'uae', 'u.a.e.', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ummal quwain', 'ras al khaimah', 'fujairah'];
        const isPorscheUAE = sourceUrlLower.includes('search_criterion_country%5b%5d=231') || sourceUrlLower.includes('search_criterion_country[]=231');
        match = uaeCities.some(city => locLower.includes(city)) || /\buae\b/i.test(locLower) || jobApplyLink.includes('united-arab-emirates') || sourceUrlLower.includes('united-arab-emirates') || isPorscheUAE;
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
        mid: ['mid', '2', '3', '4', '5'],
        senior: ['senior', 'lead', 'principal', 'staff', '6', '7', '8', '9', '10'],
      };
      const keywords = levelMap[scraperFilters.experienceLevel.toLowerCase()] || [];
      if (!keywords.some(k => exp.includes(k))) {
        console.log(`  ⏭️  Skip (exp mismatch '${scraperFilters.experienceLevel}'): ${title}`);
        continue;
      }
    }

    // ── Derived slug fields ──────────────────────────────────────────────
    const companyId = await getOrCreateCompany(job.company);
    if (!companyId) continue;

    const focusKeyword = `${title} ${location.split(',')[0]}`.trim();
    const url_slug = focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingJob = existingLinks.get(job.applyLink);

    if (existingJob) {
      // ── DUPLICATE: Skip ──────────────────────────────────────────────
      if (scraperFilters.duplicateJob === 'Skip') {
        console.log(`  ⏭️  Skip duplicate: ${title}`);
        continue;
      }
      // ── DUPLICATE: Overwrite ─────────────────────────────────────────
      const { error } = await supabase.from('jobs').update({
        title,
        company_id: companyId,
        description,
        location,
        salary_range: salary,
        job_type: jobTypeFinal,
        experience_level: experience,
        category,
        source_url: sourceUrl,
        date_posted,
        focus_keyword: focusKeyword,
        url_slug,
        // is_approved — intentionally NOT updated
      }).eq('id', existingJob.id);

      if (!error) { saved++; console.log(`  💾 Updated: ${title} | ${location} | ${job.company}`); }
      else console.error(`  ❌ Update error (${title}):`, error.message);

    } else {
      // ── NEW JOB: Insert ──────────────────────────────────────────────
      const { error } = await supabase.from('jobs').insert([{
        title,
        company_id: companyId,
        description,
        location,
        salary_range: salary,
        job_type: jobTypeFinal,
        experience_level: experience,
        category,
        apply_link: job.applyLink,
        source_url: sourceUrl,
        date_posted,
        focus_keyword: focusKeyword,
        url_slug,
        is_approved: false,
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

  if (u.includes('jobs.porsche.com')) return 'porsche';
  if (u.includes('careers.kbr.com')) return 'kbr';
  if (u.includes('careers.philips.com')) return 'kbr';
  if (u.includes('pgcareers.com') || u.includes('careers.pg.com')) return 'kbr';
  if (u.includes('jobs.worley.com')) return 'worley';
  if (u.includes('darwinbox.in') || u.includes('darwinbox.com')) return 'darwinbox';
  if (u.includes('myworkdayjobs.com') || u.includes('workday.com')) return 'workday';
  if (u.includes('csod.com')) return 'csod';
  if (u.includes('oraclecloud.com') && u.includes('hcmui')) return 'oracle';
  if (u.includes('nayaraenergy.com') && u.includes('hcmui')) return 'oracle';
  if (u.includes('nayaraenergy.com')) return 'oracle';
  if (u.includes('adani.com/opportunity')) return 'oracle';
  if (u.includes('taleo.net') || u.includes('ibegin.tcs.com')) return 'taleo';
  if (u.includes('jobs.lever.co')) return 'lever';
  if (u.includes('greenhouse.io') || u.includes('boards.greenhouse')) return 'greenhouse';
  if (u.includes('icims.com')) return 'icims';
  if (u.includes('successfactors.com') || u.includes('sapsf.com')) return 'successfactors';
  if (u.includes('brassring.com') || u.includes('kenexa.com')) return 'brassring';
  if (u.includes('jobvite.com')) return 'jobvite';
  if (u.includes('ashbyhq.com') || u.includes('jobs.ashby')) return 'ashby';
  if (u.includes('param.ai')) return 'paramai';
  if (u.includes('caterpillar.com/en/jobs')) return 'caterpillar';
  if (u.includes('careers.ril.com')) return 'ril';
  if (u.includes('mercedes-benz.com') || u.includes('jobs.mercedes')) return 'mercedes';
  if (u.includes('careers.unilever.com')) return 'unilever';
  if (u.includes('hitachienergy.com') || u.includes('hitachi.com')) return 'hitachi';
  if (u.includes('jobs.siemens.com')) return 'siemens';
  if (u.includes('careers.honeywell.com')) return 'honeywell';
  if (u.includes('careers.royalenfield.com')) return 'royal_enfield';
  if (u.includes('bajajauto.com/careers')) return 'bajaj_auto';
  if (u.includes('careers.adityabirla.com')) return 'aditya_birla';
  if (u.includes('panasonic.com')) return 'panasonic';
  if (u.includes('alstom.com') || u.includes('heromotocorp.com') || u.includes('tenneco.com') || u.includes('tataconsumer.com') || u.includes('tataelectronics.com') || u.includes('jobs.zf.com') || u.includes('jobs.danfoss.com') || u.includes('join.cnh.com') || u.includes('jobs.tuvsud.com') || u.includes('schindler.com')) return 'successfactors';
  if (u.includes('careers.araymond.com')) return 'araymond';
  if (u.includes('mokahr.com')) return 'mokahr';
  if (u.includes('workline.hr')) return 'workline';
  if (u.includes('mphasis.com')) return 'mphasis';
  if (u.includes('dejobs.org')) return 'dejobs';
  if (u.includes('atlascopcogroup.com')) return 'atlascopco';
  if (u.includes('aecom.jobs')) return 'aecom';
  if (u.includes('peoplestrong.com')) return 'peoplestrong';
  if (u.includes('ttcportals.com')) return 'ttcportals';
  if (u.includes('workable.com') || u.includes('apply.workable.com')) return 'workable';
  if (u.includes('teamtailor.com')) return 'teamtailor';
  if (u.includes('talentrecruit.com')) return 'talentrecruit';
  if (u.includes('careers.jabil.com') || u.includes('jabil.com')) return 'jabil';
  if (u.includes('careers.bp.com')) return 'bp';
  if (u.includes('careers.titan.in')) return 'titan';
  if (u.includes('careers.regalrexnord.com')) return 'regalrexnord';
  if (u.includes('careers.se.com')) return 'se';
  if (u.includes('ramboll.com')) return 'ramboll';
  if (u.includes('zohorecruit.com')) return 'zohorecruit';
  if (u.includes('turbohire.co')) return 'turbohire';
  if (u.includes('tataelxsi.com')) return 'tataelxsi';
  if (u.includes('konecranes.careers') || u.includes('attrax')) return 'konecranes';

  // SmartRecruiters
  if (u.includes('careers.smartrecruiters.com')) return 'smartrecruiters';
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
    const html = document.documentElement.innerHTML.toLowerCase();
    const scripts = [...document.querySelectorAll('script[src]')].map(s => s.src.toLowerCase()).join(' ');
    const url = window.location.href.toLowerCase();
    const metaApp = document.querySelector('meta[name="application-name"]')?.content?.toLowerCase() || '';

    if (html.includes('jobs.porsche.com') || document.querySelector('.jb-datatable')) return 'porsche';
    if (url.includes('careers.titan.in')) return 'titan';
    if (document.querySelector('li.jobs-list-item') || document.querySelector('[ph-tag="ph-search-results-v2"]') || html.includes('ph-search-results') || url.includes('careers.kbr.com') || url.includes('careers.philips.com') || url.includes('pgcareers.com')) return 'kbr';
    if (document.querySelector('[data-test-id="job-listing"]') || html.includes('jobs.worley.com')) return 'worley';
    if (document.querySelector('[data-automation-id="jobTitle"]') || scripts.includes('workday') || url.includes('workday')) return 'workday';
    if (document.querySelector('.job-tile') || html.includes('darwinbox')) return 'darwinbox';
    if (document.querySelector('.js-jobs-list-item') || document.querySelector('li[data-job-id]') || metaApp.includes('smartrecruiters') || html.includes('smartrecruiters')) return 'smartrecruiters_jobs';
    if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
    if (document.querySelector('[class*="rec-listing"]') || html.includes('csod')) return 'csod';
    if (document.querySelector('.requisitionListItem') || html.includes('oraclecloud') || html.includes('hcmui') || url.includes('adani.com/opportunity')) return 'oracle';
    if (html.includes('successfactors') || scripts.includes('successfactors') || url.includes('alstom.com') || url.includes('tataconsumer.com') || url.includes('tataelectronics.com') || url.includes('jobs.zf.com') || url.includes('jobs.danfoss.com') || url.includes('join.cnh.com') || url.includes('jobs.tuvsud.com') || url.includes('schindler.com') || document.querySelector('li[data-testid="jobCard"]')) return 'successfactors';
    if (url.includes('araymond') || html.includes('araymond') || document.querySelector('.node-offer')) return 'araymond';
    if (url.includes('mokahr') || html.includes('mokahr') || document.querySelector('[class*="jobs-list-"]')) return 'mokahr';
    if (url.includes('workline') || html.includes('workline') || document.querySelector('.jobs-wrapper')) return 'workline';
    if (url.includes('mphasis.com') || html.includes('mphasis')) return 'mphasis';
    if (url.includes('dejobs.org') || html.includes('dejobs.org') || document.querySelector('a[id^="job-link-"]')) return 'dejobs';
    if (url.includes('atlascopcogroup.com') || html.includes('atlascopco') || document.querySelector('.ds_ais-Hits-item')) return 'atlascopco';
    if (url.includes('aecom.jobs') || document.querySelector('ul#jobs a[href*="/job/"]')) return 'aecom';
    if (url.includes('peoplestrong.com') || document.querySelector('app-joblist') || document.querySelector('app-job-detail')) return 'peoplestrong';
    if (url.includes('ttcportals.com') || document.querySelector('.job-result') && document.querySelector('.facet-item')) return 'ttcportals';
    if (url.includes('workable.com') || html.includes('workable') || document.querySelector('[data-ui="job"]')) return 'workable';
    if (url.includes('teamtailor.com') || html.includes('teamtailor') || document.querySelector('#jobs_list_container') || document.querySelector('[data-blocks--jobs-target="jobsListContainer"]')) return 'teamtailor';
    if (url.includes('talentrecruit.com') || html.includes('talentrecruit') || (document.querySelector('.card-wrap') && document.querySelector('.right-listing'))) return 'talentrecruit';
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
    if (url.includes('jabil.com') || html.includes('jabil')) return 'jabil';
    if (url.includes('ramboll.com') || html.includes('ramboll')) return 'ramboll';
    if (url.includes('zohorecruit.com') || html.includes('zohorecruit')) return 'zohorecruit';
    if (url.includes('tataelxsi.com') || html.includes('tataelxsi')) return 'tataelxsi';
    if (document.querySelector('.attrax-vacancy-tile') || document.querySelector('.attrax-list-widget') || html.includes('attrax-vacancy-tile') || url.includes('konecranes.careers')) return 'konecranes';

    return 'generic_listing';
  });
}


// ════════════════════════════════════════════════════════════════════════════
// 🏭  RIL — Reliance Industries (ASP.NET GridView)
// Selector: table#dgJobs / tr with job rows
// ════════════════════════════════════════════════════════════════════════════
async function scrapeRil(page, context, listingUrl, results) {
  // RIL uses ASP.NET WebForms — wait for GridView table
  await page.waitForSelector('#dgJobs, table.grid, .joblisting, [id*="GridView"], [id*="Job"]', { timeout: 30000 }).catch(() => { });
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
        title: a?.innerText?.trim() || cells[0]?.innerText?.trim() || 'Not Found',
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
// 🏢  TATA ELXSI
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTataElxsi(page, context, listingUrl, results) {
  let pageNum = 1;
  while (true) {
    console.log(`  📄 Tata Elxsi Page ${pageNum}...`);
    await page.waitForSelector('.jjbcdeo1', { timeout: 35000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.jjbcdeo1')];
      return cards.map(card => {
        const titleEl = card.querySelector('h3');
        const pEl = card.querySelector('.jjbcdeo11 p');
        const dateEl = card.querySelector('.jjbcdeo12 p');
        const a = card.querySelector('a.jknmre');

        let location = 'Not Found';
        let experience = 'Not Found';
        if (pEl) {
          const parts = pEl.innerText.split('|').map(p => p.trim());
          if (parts.length > 0) location = parts[0];
          if (parts.length > 1) experience = parts[1];
        }

        return {
          title: titleEl?.innerText?.trim() || 'Not Found',
          location: location,
          experience: experience,
          date: dateEl?.innerText?.trim() || 'Not Found',
          detailUrl: a ? new URL(a.getAttribute('href'), window.location.origin).href : '',
        };
      }).filter(j => j.detailUrl);
    });

    console.log(`     ↳ Tata Elxsi: ${jobLinks.length} jobs`);
    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'tataelxsi', results, { company: 'Tata Elxsi' });
      await delay(500);
    }

    if (results.length >= MAX_JOBS) break;

    const hasNext = await page.evaluate(() => {
      const nextBtn = [...document.querySelectorAll('.pagination a')].find(a => a.innerText.includes('»') || a.innerText.toLowerCase().includes('next'));
      if (nextBtn && nextBtn.href) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ Tata Elxsi done — ${pageNum} pages`);
      break;
    }

    await page.waitForTimeout(4000);
    pageNum++;
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
        const titleA = tr.querySelector('td[data-th="Job title"] a') || tr.querySelector('a');
        const loc = tr.querySelector('td[data-th="Location"]') || tr.querySelectorAll('td')[2];
        const dept = tr.querySelector('td[data-th="Department"]') || tr.querySelectorAll('td')[1];
        return {
          title: titleA?.innerText?.trim() || 'Not Found',
          location: loc?.innerText?.trim() || 'Not Found',
          detailUrl: titleA ? new URL(titleA.getAttribute('href'), base).href : '',
          extra: { department: dept?.innerText?.trim() }
        };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    }

    // 2. Tile-based layout (Traditional Darwinbox)
    return [...document.querySelectorAll('.job-tile')].map(tile => {
      const subs = tile.querySelectorAll('.sub-section');
      const rel = tile.querySelector('a.db-btn')?.getAttribute('href') || '';
      return {
        title: tile.querySelector('.job-title')?.innerText?.trim() || 'Not Found',
        location: subs[0]?.querySelector('span[dbtooltip]')?.innerText?.trim() || 'Not Found',
        experience: subs[1]?.querySelector('span span')?.innerText?.trim() || 'Not Found',
        description: tile.querySelector('.job-description span')?.innerText?.trim() || '',
        detailUrl: rel ? new URL(rel, base).href : '',
      };
    });
  }, listingUrl);

  console.log(`  ↳ Darwinbox: Found ${jobLinks.length} jobs`);

  // Determine company name from URL
  let company = 'Not Found';
  if (listingUrl.includes('ashokleyland')) company = 'Ashok Leyland';
  else if (listingUrl.includes('jslhrms')) company = 'Jindal Stainless';

  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
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
    console.log(`  📄 Page ${pageNum}...`);
    const jobLinks = await currentPage.evaluate(() =>
      [...document.querySelectorAll('.card.card-job')].map(card => {
        const a = card.querySelector('.card-title a.js-view-job');
        return {
          title: a?.innerText?.trim() || 'Not Found',
          location: card.querySelector('.list-inline-item')?.innerText?.trim() || 'Not Found',
          jobId: card.getAttribute('data-id') || 'Not Found',
          detailUrl: a ? new URL(a.getAttribute('href'), window.location.origin).href : '',
        };
      })
    );
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'caterpillar', results, { company: 'Caterpillar' }); await delay(400); }

    if (pageNum >= 3) { console.log(`  🛑 Caterpillar limit reached — stopping at ${pageNum} pages`); break; }

    const nextUrl = await currentPage.evaluate(() =>
      document.querySelector('a[rel="next"]')?.href ||
      [...document.querySelectorAll('a')].find(a =>
        a.innerText?.trim().toLowerCase() === 'next' ||
        a.getAttribute('aria-label')?.toLowerCase().includes('next')
      )?.href || null
    );
    if (!nextUrl) { console.log(`  ✅ Caterpillar done — ${pageNum} pages`); break; }
    await currentPage.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await currentPage.waitForSelector('.card.card-job', { timeout: 20000 }).catch(() => { });
    await currentPage.waitForTimeout(2000);
    pageNum++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🟢  Regal Rexnord Careers
// ════════════════════════════════════════════════════════════════════════════
async function scrapeRegalRexnordAllPages(firstPage, context, results) {
  let currentPage = firstPage, pageNum = 1;
  while (true) {
    console.log(`  📄 Page ${pageNum}...`);
    const jobLinks = await currentPage.evaluate(() =>
      [...document.querySelectorAll('.card.card-job')].map(card => {
        const a = card.querySelector('.card-title a.js-view-job');
        const metaLis = card.querySelectorAll('.job-meta li');
        let loc = 'Not Found';
        metaLis.forEach(li => {
          if (li.innerText.toLowerCase().includes('india') || li.querySelector('use[href*="map-marker"]')) {
            loc = li.innerText.trim();
          }
        });

        return {
          title: a?.innerText?.trim() || 'Not Found',
          location: loc,
          jobId: card.getAttribute('data-id') || 'Not Found',
          detailUrl: a ? new URL(a.getAttribute('href'), window.location.origin).href : '',
        };
      })
    );
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'regalrexnord', results, { company: 'Regal Rexnord' }); await delay(400); }

    if (pageNum >= 3) { console.log(`  🛑 RegalRexnord limit reached — stopping at ${pageNum} pages`); break; }

    const nextUrl = await currentPage.evaluate(() =>
      document.querySelector('a[rel="next"]')?.href ||
      [...document.querySelectorAll('a')].find(a =>
        a.innerText?.trim().toLowerCase() === 'next' ||
        a.getAttribute('aria-label')?.toLowerCase().includes('next')
      )?.href || null
    );
    if (!nextUrl) { console.log(`  ✅ RegalRexnord done — ${pageNum} pages`); break; }
    await currentPage.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await currentPage.waitForSelector('.card.card-job', { timeout: 20000 }).catch(() => { });
    await currentPage.waitForTimeout(2000);
    pageNum++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🟢  Schneider Electric Careers (careers.se.com)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeSeAllPages(firstPage, context, results) {
  let currentPage = firstPage, pageNum = 1;
  while (true) {
    console.log(`  📄 Page ${pageNum}...`);
    // Wait for jobs to load
    await currentPage.waitForSelector('.search-result-item', { timeout: 20000 }).catch(() => { });

    const jobLinks = await currentPage.evaluate(() =>
      [...document.querySelectorAll('.search-result-item')].map(card => {
        const a = card.querySelector('.job-title-link');
        const loc = card.querySelector('.label-value.location');
        const reqId = card.querySelector('.req-id span');
        const applyBtn = card.querySelector('.apply-button');

        return {
          title: a?.innerText?.trim() || 'Not Found',
          location: loc?.innerText?.trim() || 'Not Found',
          jobId: reqId?.innerText?.trim() || 'Not Found',
          detailUrl: a ? new URL(a.getAttribute('href'), window.location.origin).href : '',
          applyLink: applyBtn ? applyBtn.getAttribute('href') : ''
        };
      })
    );
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'se', results, { company: 'Schneider Electric' }); await delay(400); }

    if (pageNum >= 3) { console.log(`  🛑 SE limit reached — stopping at ${pageNum} pages`); break; }

    // Next page logic
    const hasNextPage = await currentPage.evaluate(() => {
      const nextBtn = document.querySelector('.mat-paginator-navigation-next');
      if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('mat-button-disabled')) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNextPage) { console.log(`  ✅ SE done — ${pageNum} pages`); break; }
    await currentPage.waitForTimeout(3000); // Wait for Angular to render the next page
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟢  SMARTRECRUITERS
// ════════════════════════════════════════════════════════════════════════════
async function scrapeSmartRecruiters(page, context, listingUrl, results) {
  await page.waitForSelector('.openings-section, [class*="opening"], article, .js-job', { timeout: 20000 }).catch(() => { });

  let moreButtons = await page.$$('.js-more');
  for (const btn of moreButtons) {
    try {
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) { }
  }

  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const resultsList = [];

    // 1. Check for grouped layout (like ASSYSTEM)
    const groupedSections = [...document.querySelectorAll('section.openings-section, section.opening--grouped')];
    if (groupedSections.length > 0) {
      groupedSections.forEach(sec => {
        const loc = sec.querySelector('.opening-title, h3')?.innerText?.trim() || 'Not Found';
        const lis = [...sec.querySelectorAll('li.opening-job, .job')];
        lis.forEach(li => {
          const a = li.querySelector('a');
          if (a && !li.classList.contains('js-more-container') && !li.querySelector('.js-more')) {
            resultsList.push({
              title: li.querySelector('h4, h3, .job-title')?.innerText?.trim() || 'Not Found',
              location: loc,
              experience: li.querySelector('.details-desc span')?.innerText?.trim() || 'Not Found',
              detailUrl: a.href || ''
            });
          }
        });
      });
      if (resultsList.length > 0) return resultsList;
    }

    // 2. Flat layout fallback
    const cards = [...document.querySelectorAll('li[class*="opening"], article[class*="job"], .js-job')];
    if (!cards.length) return [...document.querySelectorAll('a[href*="/jobs/"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(c => ({
      title: c.querySelector('h4,h3,h2,[class*="title"]')?.innerText?.trim() || 'Not Found',
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
  // SR custom-domain pages use infinite scroll — keep scrolling until no new jobs appear
  let prevCount = 0;
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('.js-jobs-list-item, [class*="job-listing"], li[data-job-id]', { timeout: 20000 }).catch(() => { });
    await autoScroll(page);
    const count = await page.evaluate(() =>
      document.querySelectorAll('.js-jobs-list-item, [class*="jobCard"], li[data-job-id]').length
    );
    if (count === prevCount) break;
    prevCount = count;
    await delay(1500);
  }

  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.js-jobs-list-item, [class*="jobCard"], li[data-job-id]')];
    if (!items.length) return [...document.querySelectorAll('a[href*="/job/"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title: item.querySelector('h2,h3,[class*="title"],a')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],.job-location')?.innerText?.trim() || 'Not Found',
      detailUrl: item.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ SR-Jobs: ${jobLinks.length} jobs`);

  // Determine company name from listing URL
  let company = 'Not Found';
  if (listingUrl.includes('technipfmc')) company = 'TechnipFMC';
  if (listingUrl.includes('tataprojects')) company = 'Tata Projects';

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
  if (listingUrl.includes('hillenbrand.wd3.myworkdayjobs.com')) company = 'Hillenbrand';
  if (listingUrl.includes('rockwellautomation.wd1.myworkdayjobs.com')) company = 'Rockwell Automation';
  if (listingUrl.includes('weir.wd3.myworkdayjobs.com')) company = 'Weir';

  // Workday loads jobs via XHR — wait for first job card
  await page.waitForSelector('[data-automation-id="jobTitle"]', { timeout: 40000 }).catch(() => console.log('⚠️  Workday list nahi mila'));

  // Workday has pagination — scrape all pages
  let pageNum = 1;
  while (true) {
    console.log(`  📄 Workday page ${pageNum}...`);
    await autoScroll(page);
    const jobLinks = await page.evaluate(() =>
      [...document.querySelectorAll('li[class*="css-"]')]
        .filter(li => li.querySelector('[data-automation-id="jobTitle"]'))
        .map(item => {
          const title = item.querySelector('[data-automation-id="jobTitle"]')?.innerText?.trim() || 'Not Found';
          const rawLoc = (item.querySelector('[data-automation-id="location"]') || item.querySelector('[data-automation-id="locations"]'))?.innerText?.trim() || 'Not Found';
          const detailUrl = item.querySelector('a')?.href || '';
          // "locations\n2 Locations" jaisi generic text → URL path se real location nikalo
          // e.g. /job/Noida-India/... → "Noida India"
          let location = rawLoc.replace(/^locations\n/i, '').trim();
          if (/\d+\s+locations?/i.test(rawLoc) || !rawLoc || rawLoc === 'Not Found') {
            const pathMatch = detailUrl.match(/\/job\/([^/]+)\//i);
            location = pathMatch ? pathMatch[1].replace(/-/g, ' ').trim() : '';
          }
          return {
            title,
            location,
            date: item.querySelector('[data-automation-id="postedOn"]')?.innerText?.trim() || 'Not Found',
            detailUrl,
          };
        })
    );
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'workday', results, { company }); await delay(500); }

    if (pageNum >= 3) { console.log(`  🛑 Workday limit reached — stopping at ${pageNum} pages`); break; }

    // Check for next page button
    const nextBtn = await page.$('[data-uxi-element-id="next"] button:not([disabled]), button[aria-label="next page"]:not([disabled]), [aria-label="Go to next page"]:not([disabled])');
    if (!nextBtn) break;
    await nextBtn.click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-automation-id="jobTitle"]', { timeout: 20000 }).catch(() => { });
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟣  ORACLE CLOUD (Nayara Energy + fa-eski Oracle)
// Selector: .requisitionListItem  OR  [class*=\"job-grid-item\"]
// ════════════════════════════════════════════════════════════════════════════
async function scrapeOracle(page, context, listingUrl, results) {
  let company = 'Not Found';
  if (listingUrl.includes('eibd.fa.em2.oraclecloud.com')) company = 'Adani';
  if (listingUrl.includes('adani.com/opportunity')) company = 'Adani';

  // ── Helper: extract jobs from current page DOM ────────────────────────────
  async function extractOracleJobs() {
    return await page.evaluate(() => {
      const selectors = [
        '.requisitionListItem',
        '[class*="job-grid-item"]',
        '[class*="jobResult"]',
        '[class*="job-tile"]',
        'li[class*="job"]',
      ];
      let items = [];
      for (const sel of selectors) {
        items = [...document.querySelectorAll(sel)];
        if (items.length) break;
      }
      if (!items.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
      return items.map(item => {
        const titleEl = item.querySelector('.job-tile__title, [class*="title"], h3, h2');
        const locEl = item.querySelector('posting-locations, [class*="value"], [class*="location"]:not([class*="label"]), [class*="city"]');
        const linkEl = item.querySelector('a.job-list-item__link, a[href*="/job/"], a');

        let dateVal = 'Not Found';
        const infoItems = [...item.querySelectorAll('.job-list-item__job-info-item')];
        const dateInfo = infoItems.find(mi => mi.querySelector('[class*="label"]')?.innerText?.trim().toLowerCase() === 'posting date');
        if (dateInfo) {
          dateVal = dateInfo.querySelector('[class*="value"]')?.innerText?.trim() || 'Not Found';
        }
        if (dateVal === 'Not Found') {
          const metaItems = [...item.querySelectorAll('.job-meta__item')];
          const dateMeta = metaItems.find(mi => mi.querySelector('.job-meta__title')?.innerText?.trim().toLowerCase() === 'posting date');
          if (dateMeta) {
            dateVal = dateMeta.querySelector('.job-meta__subitem')?.innerText?.trim() || 'Not Found';
          }
        }
        if (dateVal === 'Not Found') {
          const dateEl = item.querySelector('[class*="date"],[class*="posted"]');
          if (dateEl) {
            dateVal = dateEl.innerText.trim();
            if (dateVal.toLowerCase() === 'posting date' && dateEl.nextElementSibling) {
              dateVal = dateEl.nextElementSibling.innerText.trim();
            }
          }
        }
        return {
          title: titleEl?.innerText?.trim() || 'Not Found',
          location: locEl?.innerText?.trim()?.replace(/\s+/g, ' ') || 'Not Found',
          date: dateVal,
          detailUrl: linkEl?.href || '',
        };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    });
  }

  // ── Adani Oracle CX — hash-based all-pages pagination ────────────────────
  if (listingUrl.includes('adani.com/opportunity')) {
    // Base hash path, e.g. #en/sites/CX_2027/jobs
    const hashMatch = listingUrl.match(/#(.+?)(\/jobs)?$/);
    const hashBase = hashMatch ? '#' + hashMatch[1] + (hashMatch[2] || '/jobs') : listingUrl;
    // Strip any trailing page param from the base URL
    const urlBase = listingUrl.split('#')[0];

    let pageNum = 1;
    while (true) {
      const pageUrl = pageNum === 1 ? listingUrl : `${urlBase}${hashBase}?page=${pageNum}`;
      console.log(`  📄 Adani Oracle CX page ${pageNum}... (${pageUrl})`);

      if (pageNum === 1) {
        // Already navigated — just wait for render
        await page.waitForTimeout(6000);
      } else {
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => { });
        await page.waitForTimeout(6000);
      }

      await page.waitForSelector('.requisitionListItem, [class*="jobResult"], [class*="job-tile"], [class*="job-grid-item"]', { timeout: 30000 })
        .catch(() => console.log('⚠️  Oracle list nahi mila (page ' + pageNum + ')'));
      await autoScroll(page);

      const jobLinks = await extractOracleJobs();
      console.log(`  ↳ Oracle Adani page ${pageNum}: ${jobLinks.length} jobs`);
      if (!jobLinks.length) break;

      for (const job of jobLinks) {
        if (results.length >= MAX_JOBS) break;
        console.log(`    🔎 ${job.title} [${job.location}]`);
        await visitDetailPage(context, job, 'oracle', results, { company });
        await delay(500);
      }

      // Check if next page button exists and is enabled
      const hasNext = await page.evaluate(() => {
        const nextBtn = document.querySelector('[aria-label="Next"], .pagination-next:not(.disabled), button[data-bind*="nextPage"]:not([disabled]),[class*="next"]:not([disabled]):not([aria-disabled="true"]),[aria-label*="next" i]');
        return !!nextBtn && !nextBtn.hasAttribute('disabled') && nextBtn.getAttribute('aria-disabled') !== 'true';
      });
      if (!hasNext) break;
      pageNum++;
    }
    return;
  }

  // ── Generic Oracle (other sites) — single page ───────────────────────────
  if (listingUrl.includes('#/')) {
    await page.waitForTimeout(6000);
  }
  await page.waitForSelector('.requisitionListItem, [class*="jobResult"], [class*="job-tile"], [class*="job-grid-item"], .job-grid-item', { timeout: 35000 }).catch(() => console.log('⚠️  Oracle list nahi mila'));
  await autoScroll(page);

  const jobLinks = await extractOracleJobs();
  console.log(`  ↳ Oracle: ${jobLinks.length} jobs`);
  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'oracle', results, { company });
    await delay(500);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟠  PARAM.AI
// ════════════════════════════════════════════════════════════════════════════
async function scrapeParamai(page, context, listingUrl, results) {
  await page.waitForSelector('[class*="JobCard"], [class*="job-card"], .card', { timeout: 25000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[class*="JobCard"],[class*="job-card"],.card')].filter(c => c.querySelector('a'));
    if (!cards.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText?.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return cards.map(card => ({
      title: card.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: card.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
      experience: card.querySelector('[class*="exp"]')?.innerText?.trim() || 'Not Found',
      detailUrl: card.querySelector('a')?.href || '',
    }));
  });
  console.log(`  ↳ Param.ai: ${jobLinks.length} jobs`);
  for (const job of jobLinks) { await visitDetailPage(context, job, 'paramai', results, { company: 'Maruti Suzuki' }); await delay(400); }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔴  CSOD (Apollo Tyres)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeCsod(page, context, listingUrl, results) {
  let company = 'Not Found';
  if (listingUrl.includes('hella')) company = 'HELLA';
  else if (listingUrl.includes('apollotyres')) company = 'Apollo Tyres';
  else {
    try {
      const u = new URL(listingUrl);
      const host = u.hostname;
      let comp = host.split('.')[0];
      if (comp) company = comp.charAt(0).toUpperCase() + comp.slice(1);
    } catch (e) { }
  }

  let pageNum = 1;
  while (true) {
    console.log(`  📄 CSOD Page ${pageNum}...`);
    await page.waitForSelector('[data-tag="displayJobTitle"], [class*="rec-listing"], .cs-job-listing, [id*="job"], a[href*="requisition"]', { timeout: 35000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const titleLinks = [...document.querySelectorAll('[data-tag="displayJobTitle"], a[href*="requisition"]')];
      if (titleLinks.length > 0) {
        return titleLinks.map(a => {
          const card = a.closest('.p-panel, div, tr') || a.parentElement;
          let href = a.getAttribute('href') || a.href || '';
          if (href && href.startsWith('/')) {
            href = window.location.origin + href;
          }
          return {
            title: a.innerText?.trim() || card?.querySelector('p, [class*="title"]')?.innerText?.trim() || 'Not Found',
            location: card?.querySelector('[data-tag="displayJobLocation"], [class*="location"]')?.innerText?.trim() || 'Not Found',
            date: card?.querySelector('[data-tag="displayJobPostingDate"], [class*="date"]')?.innerText?.trim() || 'Not Found',
            detailUrl: href
          };
        }).filter(j => j.detailUrl && j.title !== 'Not Found');
      }

      const genericItems = [...document.querySelectorAll('[class*="rec-listing-job"],[class*="job-listing-item"],tr[class*="rec-listing"]')];
      return genericItems.map(item => {
        const a = item.querySelector('a[href*="requisition"], a');
        let href = a ? (a.getAttribute('href') || a.href) : '';
        if (href && href.startsWith('/')) {
          href = window.location.origin + href;
        }
        return {
          title: item.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
          location: item.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
          detailUrl: href,
        };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    });

    console.log(`     ↳ CSOD Page ${pageNum}: ${jobLinks.length} jobs found`);

    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'csod', results, { company });
      await delay(400);
    }

    if (results.length >= MAX_JOBS) break;

    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('button.next, button[aria-label*="Next Page"], .page-nav-caret.next, button[data-tag="search-results-pagination-next"]');
      if (nextBtn && !nextBtn.disabled && nextBtn.getAttribute('aria-disabled') !== 'true' && !nextBtn.classList.contains('disabled')) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ CSOD done — ${pageNum} pages`);
      break;
    }

    await page.waitForTimeout(4000);
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 📌  LEVER
// ════════════════════════════════════════════════════════════════════════════
async function scrapeLever(page, context, listingUrl, results) {
  await page.waitForSelector('.posting, [class*="posting"], h2', { timeout: 20000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.posting')].map(p => ({
      title: p.querySelector('h5,.posting-name,[data-qa="posting-name"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('.opening, [class*="opening"]', { timeout: 20000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.opening')].map(o => ({
      title: o.querySelector('a')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="requisition"], .listSingleColumnLayoutTable, [id*="Requisition"]', { timeout: 25000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="taleo"]');
    if (iframe) return [{ title: 'Taleo iFrame detected', location: 'Not Found', detailUrl: iframe.src }];
    const rows = [...document.querySelectorAll('tr[class*="requisition"],tr[id*="req"],div[class*="requisition"],.listSingleColumnLayoutTable tr')];
    if (!rows.length) return [...document.querySelectorAll('a[href*="requisition"],a[href*="jobId"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return rows.map(row => ({
      title: row.querySelector('a,.requisitionTitle')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="iCIMS"],[class*="icims"],[id*="icims"],.jobs-section, li[data-testid="jobCard"]', { timeout: 25000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    // --- RMK platform (Danfoss, ZF) — uses pageNumber param, 10 items/page ---
    if (document.querySelector('li[data-testid="jobCard"]')) {
      const headerEl = document.querySelector('h2[data-testid="headerTitle"], span[data-testid="searchResultAriaLive"]');
      const headerText = headerEl ? (headerEl.innerText || headerEl.textContent || '') : '';
      // "1 to 10 of 58 results"
      const rmkMatch = headerText.match(/(\d+)\s+to\s+(\d+)\s+of\s+([\d,]+)/i);
      if (rmkMatch) {
        const showing = parseInt(rmkMatch[2], 10);
        const total = parseInt(rmkMatch[3].replace(/,/g, ''), 10);
        if (showing < total) {
          const url = new URL(window.location.href);
          const currentPage = parseInt(url.searchParams.get('pageNumber') || '0', 10);
          url.searchParams.set('pageNumber', currentPage + 1);
          return url.toString();
        }
      }
      // fallback: check paginator Next button text
      const nextBtn = document.querySelector('button[data-testid="goToNextPageBtn"], button[aria-label*="next" i]');
      if (nextBtn && !nextBtn.disabled) {
        const currentBtn = document.querySelector('button[aria-current="page"]');
        const currentPageNum = currentBtn ? parseInt(currentBtn.textContent.trim(), 10) : 1;
        const url = new URL(window.location.href);
        url.searchParams.set('pageNumber', currentPageNum); // 1-based btn → 0-based is currentPageNum-1, next = currentPageNum
        return url.toString();
      }
      return null;
    }

    const items = [...document.querySelectorAll('[class*="iCIMS_JobsTable"] tr,[class*="job-listing"],.iCIMS_JobsTable tr')];
    if (!items.length) return [...document.querySelectorAll('a[href*="iCIMS"],a[href*="icims"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return items.map(item => ({
      title: item.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
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
  let companyFromUrl = 'SuccessFactors';
  try {
    const uObj = new URL(listingUrl);
    const compParam = uObj.searchParams.get('company');
    if (compParam) companyFromUrl = compParam.toUpperCase();
  } catch (_) { }

  let pageNum = 1;
  const seenUrls = new Set();

  while (true) {
    console.log(`  📄 SuccessFactors Page ${pageNum}...`);
    await page.waitForSelector('tr.jobResultItem, .jobResultItem, tr.data-row, [class*="job-tile"], [class*="jobTitle"], li[data-id], li[data-testid="jobCard"]', { timeout: 30000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate((baseUrl) => {
      // 1. Check for legacy SuccessFactors table items (PI Industries / career_ns=job_listing_summary style)
      let sfLegacyItems = [...document.querySelectorAll('tr.jobResultItem, .jobResultItem')];
      if (sfLegacyItems.length) {
        return sfLegacyItems.map(row => {
          const titleA = row.querySelector('a.jobTitle, .jobTitle a');
          const title = titleA?.innerText?.trim() || 'Not Found';
          const relHref = titleA?.getAttribute('href') || '';
          const detailUrl = relHref ? new URL(relHref, baseUrl).href : '';

          const noteText = row.querySelector('.noteSection')?.innerText?.trim() || '';
          const spans = [...row.querySelectorAll('.noteSection .jobContentEM')].map(s => s.innerText?.trim());

          const reqMatch = noteText.match(/Requisition ID:\s*([^\s-]+)/i);
          const jobId = reqMatch ? reqMatch[1] : (spans[0] || '');

          const dateMatch = noteText.match(/Posted on\s*([^\s-]+)/i);
          const date = dateMatch ? dateMatch[1] : (spans[1] ? spans[1].replace(/^Posted on\s*/i, '') : '');

          let country = '';
          let city = '';
          let department = '';

          if (spans.length >= 5) {
            department = spans[2] || '';
            country = spans[3] || '';
            city = spans[4] || '';
          } else if (spans.length >= 4) {
            department = spans[2] || '';
            country = spans[3] || '';
          }

          let loc = [city, country].filter(Boolean).join(', ');
          if (!loc) loc = noteText || 'Not Found';
          if (loc === 'IN') loc = 'India';
          else if (loc.match(/\bIN\b/)) loc = loc.replace(/\bIN\b/g, 'India');

          return {
            title,
            location: loc,
            detailUrl,
            applyLink: detailUrl,
            date,
            jobId,
            department
          };
        }).filter(j => j.detailUrl && j.title !== 'Not Found');
      }

      // 2. Check for table rows (Hero MotoCorp style)
      let items = [...document.querySelectorAll('tr.data-row')];
      if (items.length) {
        return items.map(tr => {
          let loc = tr.querySelector('.jobLocation')?.innerText?.replace(/\s+/g, ' ')?.trim() || 'Not Found';
          loc = loc.replace(/^Location\s*/i, '').trim();
          if (loc === 'IN') loc = 'India';
          else if (loc.match(/\bIN\b/)) loc = loc.replace(/\bIN\b/g, 'India');

          let department = tr.querySelector('.jobFacility, .colFacility, .jobDepartment, .colDepartment')?.innerText?.trim();
          let experience = tr.querySelector('.jobShifttype, .colShifttype')?.innerText?.trim();
          let date = tr.querySelector('.jobDate, .colDate')?.innerText?.trim();

          let titleA = tr.querySelector('a.jobTitle-link, .jobTitle a, a');
          let detailUrl = titleA?.href || '';

          return {
            title: tr.querySelector('.jobTitle-link, .colTitle a, .jobTitle a')?.innerText?.trim() || 'Not Found',
            location: loc,
            detailUrl,
            applyLink: detailUrl,
            department,
            experience,
            date
          };
        }).filter(j => j.detailUrl);
      }

      // 3. Check for RMK/SuccessFactors data-testid="jobCard" cards (ZF, Danfoss style)
      const rmkCards = [...document.querySelectorAll('li[data-testid="jobCard"]')];
      if (rmkCards.length) {
        return rmkCards.map(card => {
          let title = card.querySelector('a[data-testid^="jobCardTitle"]')?.innerText?.trim() || 'Not Found';
          let detailUrl = card.querySelector('a[data-testid^="jobCardTitle"]')?.href || '';
          if (detailUrl && !detailUrl.startsWith('http')) {
            detailUrl = new URL(detailUrl, baseUrl).href;
          }
          let loc = card.querySelector('[data-testid="jobCardLocation"]')?.innerText?.replace(/\s+/g, ' ')?.trim() || 'Not Found';
          const footerValues = [...card.querySelectorAll('[data-help-id^="jobCardFooterValue"]')].map(el => el.innerText?.trim()).filter(Boolean);
          let department = footerValues[0] || '';
          let experience = footerValues[1] || '';
          return { title, location: loc, detailUrl, applyLink: detailUrl, department, experience };
        }).filter(j => j.detailUrl);
      }

      // 4. Check for cards (Standard SF style)
      const cards = [...document.querySelectorAll('[class*="job-tile"], [class*="jobCard"], [data-id][class*="job"]')];
      if (cards.length) {
        return cards.map(card => {
          let loc = card.querySelector('[class*="location"], [class*="city"], .section-field.location [id$="-value"]')?.innerText?.trim() || 'Not Found';
          loc = loc.replace(/^Location\s*/i, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          if (loc === 'IN') loc = 'India';
          else if (loc.match(/\bIN\b/)) loc = loc.replace(/\bIN\b/g, 'India');

          let title = card.querySelector('a, [class*="title"]')?.innerText?.trim() || 'Not Found';
          let detailUrl = card.querySelector('a')?.href || '';
          let date = card.querySelector('.section-field.date [id$="-value"]')?.innerText?.trim();
          let jobId = card.querySelector('.section-field.customfield2 [id$="-value"]')?.innerText?.trim();
          let company = card.querySelector('.section-field.customfield1 [id$="-value"]')?.innerText?.trim();
          let department = card.querySelector('.section-field.dept [id$="-value"]')?.innerText?.trim();

          return {
            title,
            location: loc,
            detailUrl,
            applyLink: detailUrl,
            date,
            jobId,
            company,
            department
          };
        }).filter(j => j.detailUrl);
      }

      // Fallback: any anchor that looks like a job link
      return [...document.querySelectorAll('a[href*="/job/"], a[href*="career_job_req_id="]')].map(a => ({
        title: a.innerText.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
        applyLink: a.href
      }));
    }, page.url());

    console.log(`     ↳ SuccessFactors: ${jobLinks.length} jobs on page ${pageNum}`);
    let newJobsOnPage = 0;
    for (const job of jobLinks) {
      if (seenUrls.has(job.detailUrl)) continue;
      seenUrls.add(job.detailUrl);
      newJobsOnPage++;

      if (results.length >= MAX_JOBS) break;
      const extra = {};
      if (listingUrl.includes('alstom')) extra.company = 'Alstom';
      else if (companyFromUrl !== 'SuccessFactors') extra.company = companyFromUrl;
      else if (job.company && job.company !== 'Not Found') extra.company = job.company;
      if (job.department && job.department !== 'Not Found') extra.department = job.department;

      await visitDetailPage(context, job, 'successfactors', results, extra);
      await delay(500);
    }

    if (results.length >= MAX_JOBS || (pageNum > 1 && newJobsOnPage === 0)) break;

    // Check for in-page pagination click (Legacy SuccessFactors pagination `.paginationArrowContainer.next` or `[id$="_next"]`)
    const legacyNextClicked = await page.evaluate(() => {
      const nextContainer = document.querySelector('.paginationArrowContainer.next, [id$="_next"]');
      if (!nextContainer) return false;
      const isDisabled = nextContainer.classList.contains('disabledArrow') ||
        nextContainer.classList.contains('next_disabled') ||
        nextContainer.classList.contains('disabled');
      if (isDisabled) return false;

      const nextLink = nextContainer.querySelector('a') || document.querySelector('a[title="Next Page"], a[aria-label="Next Page"]');
      if (nextLink) {
        nextLink.scrollIntoView();
        nextLink.click();
        return true;
      }
      return false;
    });

    if (legacyNextClicked) {
      await page.waitForTimeout(3500);
      pageNum++;
      continue;
    }

    // URL-based pagination check
    const nextUrl = await page.evaluate((pageNum) => {
      if (window.location.href.includes('schindler.com') || window.location.href.includes('alstom.com')) {
        const labelEl = document.querySelector('.paginationLabel');
        if (labelEl) {
          const bTags = labelEl.querySelectorAll('b');
          if (bTags.length >= 2) {
            const total = parseInt(bTags[bTags.length - 1].innerText.replace(/,/g, ''), 10);
            if (pageNum * 25 < total) {
              const activeLi = document.querySelector('ul.pagination li.active');
              if (activeLi && activeLi.nextElementSibling) {
                const nextA = activeLi.nextElementSibling.querySelector('a');
                if (nextA && nextA.href && !nextA.classList.contains('paginationItemLast')) {
                  return nextA.href;
                }
              }
              const url = new URL(window.location.href);
              url.searchParams.set('startrow', pageNum * 25);
              return url.toString();
            }
          }
        }
        return null;
      }

      if (document.querySelector('li[data-testid="jobCard"]')) {
        const headerEl = document.querySelector('h2[data-testid="headerTitle"], span[data-testid="searchResultAriaLive"]');
        const headerText = headerEl ? (headerEl.innerText || headerEl.textContent || '') : '';
        const rmkMatch = headerText.match(/(\d+)\s+to\s+(\d+)\s+of\s+([\d,]+)/i);
        if (rmkMatch) {
          const showing = parseInt(rmkMatch[2], 10);
          const total = parseInt(rmkMatch[3].replace(/,/g, ''), 10);
          if (showing < total) {
            const url = new URL(window.location.href);
            const currentPage = parseInt(url.searchParams.get('pageNumber') || '0', 10);
            url.searchParams.set('pageNumber', currentPage + 1);
            return url.toString();
          }
        }
        const nextBtn = document.querySelector('button[data-testid="goToNextPageBtn"]');
        if (nextBtn && !nextBtn.disabled && !nextBtn.hasAttribute('disabled')) {
          const currentBtn = document.querySelector('button[aria-current="page"]');
          const currentPageNum = currentBtn ? parseInt(currentBtn.textContent.trim(), 10) : 1;
          const url = new URL(window.location.href);
          url.searchParams.set('pageNumber', currentPageNum);
          return url.toString();
        }
        return null;
      }

      const activeLi = document.querySelector('ul.pagination li.active');
      if (activeLi && activeLi.nextElementSibling) {
        const nextA = activeLi.nextElementSibling.querySelector('a');
        if (nextA && nextA.href && !nextA.classList.contains('paginationItemLast')) {
          return nextA.href;
        }
      }
      const nextBtn = document.querySelector('.pagination .next_page a, a.next, a[title*="Next" i]');
      if (nextBtn && nextBtn.href && !nextBtn.parentElement.classList.contains('disabled')) {
        return nextBtn.href;
      }

      const text = document.body.innerText;
      const match = text.match(/of\s+(\d+)\s+Jobs/i) || text.match(/Results \d+ [–-] \d+ of (\d+)/i) || text.match(/Showing \d+ to \d+ of (\d+)/i);
      if (match) {
        const total = parseInt(match[1], 10);
        if (pageNum * 50 < total) {
          const url = new URL(window.location.href);
          url.searchParams.set('startrow', pageNum * 50);
          return url.toString();
        }
      }
      return null;
    }, pageNum);

    if (!nextUrl) {
      console.log(`  ✅ SuccessFactors done — ${pageNum} pages`);
      break;
    }

    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('li[data-testid="jobCard"], tr.data-row, [class*="job-tile"], tr.jobResultItem, .jobResultItem', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(2000);
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔩  BRASSRING / KENEXA
// ════════════════════════════════════════════════════════════════════════════
async function scrapeBrassring(page, context, listingUrl, results) {
  await page.waitForSelector('[class*="jobTitle"],[class*="job-title"],table.jobs tr', { timeout: 25000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table tr,[class*="jobRow"],[class*="job-row"]')].filter(r => r.querySelector('a'));
    if (!rows.length) return [...document.querySelectorAll('a[href*="job"]')].map(a => ({ title: a.innerText.trim() || 'Not Found', location: 'Not Found', detailUrl: a.href }));
    return rows.map(r => ({
      title: r.querySelector('a,[class*="title"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('.jv-job-item,.jv-job-list-item,[class*="jv-job"]', { timeout: 20000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.jv-job-item,.jv-job-list-item')].map(item => ({
      title: item.querySelector('a,.jv-job-title')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="ashby"],[class*="job-posting"],._content', { timeout: 20000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/jobs/"], a[href*="/posting/"]')].map(a => ({
      title: a.querySelector('[class*="title"],h3,h2')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="naukri"],[class*="jobCard"],article', { timeout: 20000 }).catch(() => { });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() =>
    [...document.querySelectorAll('[class*="jobTuple"],[class*="job-card"],article')].map(card => ({
      title: card.querySelector('a.title,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: card.querySelector('[class*="location"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="job-listing-item"], [class*="JobListItem"], article[class*="job"], .job-card, [data-testid="job-item"]', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  // Try pagination
  let pageNum = 1;
  while (true) {
    if (results.length >= MAX_JOBS) break;
    console.log(`  📄 Mercedes page ${pageNum}...`);
    const jobLinks = await page.evaluate(() => {
      // Multiple possible selectors for Mercedes CMS (MJP style)
      let items = [...document.querySelectorAll('.mjp-job-ad-card')];
      if (items.length) {
        return items.map(item => {
          let date = item.querySelector('.mjp-job-ad-card__date')?.innerText?.trim();
          if (!date) {
            const tags = [...item.querySelectorAll('.mjp-job-ad-tag')];
            for (const tag of tags) {
              const titleNode = tag.querySelector('.mjp-job-ad-tag__title');
              if (titleNode && titleNode.innerText.includes('Publication date')) {
                const contentNode = tag.querySelector('.mjp-job-ad-tag__content');
                if (contentNode) {
                  date = contentNode.innerText.trim();
                }
                break;
              }
            }
          }
          return {
            title: item.querySelector('.mjp-job-ad-card__title-text')?.innerText?.trim() || 'Not Found',
            location: item.querySelector('.mjp-job-ad-card__location')?.innerText?.trim() || 'Not Found',
            date: date || 'Not Found',
            detailUrl: item.querySelector('.mjp-job-ad-card__link')?.href || item.querySelector('a')?.href || '',
          };
        });
      }

      // Fallback selectors
      const selectors = [
        '[class*="job-listing-item"]',
        '[class*="JobListItem"]',
        'article[class*="job"]',
        '[data-testid="job-item"]',
        '.job-card',
        'li[class*="job"]',
      ];
      for (const sel of selectors) {
        items = [...document.querySelectorAll(sel)];
        if (items.length) break;
      }
      if (!items.length) {
        return [...document.querySelectorAll('a[href*="/en/job"]')].map(a => ({
          title: a.querySelector('h3,h2,strong,[class*="title"]')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
          location: 'Not Found',
          detailUrl: a.href,
        }));
      }
      return items.map(item => ({
        title: item.querySelector('h2,h3,[class*="title"],[class*="headline"]')?.innerText?.trim() || 'Not Found',
        location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
        date: item.querySelector('[class*="date"],[class*="posted"]')?.innerText?.trim() || 'Not Found',
        detailUrl: item.querySelector('a')?.href || '',
      }));
    });
    console.log(`     ↳ ${jobLinks.length} jobs`);
    for (const job of jobLinks) { await visitDetailPage(context, job, 'mercedes', results, { company: 'Mercedes-Benz' }); await delay(400); }

    if (pageNum >= 3) { console.log(`  🛑 Mercedes limit reached — stopping at ${pageNum} pages`); break; }

    // Try next page
    const nextBtn = await page.$('[aria-label="Next page"], [aria-label="next"], button[class*="next"]:not([disabled]), a[class*="next"]:not([disabled])');
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
  let pageNum = 1;
  while (true) {
    console.log(`  📄 Unilever Page ${pageNum}...`);
    await page.waitForSelector('.global-job-list li, [class*="job-list"] li', { timeout: 30000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.global-job-list li, [class*="job-list"] li')];
      return items.map(li => {
        const a = li.querySelector('a');
        return {
          title: li.querySelector('h2, .global-job-list__title')?.innerText?.trim() || a?.innerText?.trim() || 'Not Found',
          location: li.querySelector('.job-location')?.innerText?.trim() || 'Not Found',
          detailUrl: a?.href || '',
          jobId: a?.getAttribute('data-job-id') || 'Not Found'
        };
      }).filter(j => j.detailUrl);
    });

    console.log(`     ↳ Unilever: ${jobLinks.length} jobs on this page`);
    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'unilever', results, { company: 'Unilever' });
      await delay(400);
    }

    if (results.length >= MAX_JOBS) break;

    if (pageNum >= 3) { console.log(`  🛑 Unilever limit reached — stopping at ${pageNum} pages`); break; }

    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('a.next, button.next');
      if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('disabled')) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ Unilever done — ${pageNum} pages`);
      break;
    }

    await page.waitForTimeout(4000);
    pageNum++;
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

  // Try JSON API approach first
  const apiJobs = await page.evaluate(async () => {
    try {
      const urlEl = document.querySelector('[data-props\\:url]');
      if (!urlEl) return null;

      const baseUrl = urlEl.getAttribute('data-props:url');
      if (!baseUrl) return null;

      let allJobs = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore && allJobs.length < 1000) {
        const res = await fetch(`${baseUrl}?offset=${offset}`);
        if (!res.ok) break;
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          allJobs.push(...data.items.map(item => ({
            title: item.title,
            location: item.location || item.primaryLocation || 'Not Found',
            date: item.publicationDate || '',
            department: item.jobFunction || '',
            experience: item.experience || '',
            detailUrl: item.url || item.applyNowUrl
          })));
          offset += data.items.length;
        } else {
          hasMore = false;
        }
      }
      return allJobs;
    } catch (e) {
      return null;
    }
  });

  if (apiJobs && apiJobs.length > 0) {
    console.log(`  ↳ Hitachi (API): ${apiJobs.length} jobs`);
    for (const job of apiJobs) {
      if (results.length >= MAX_JOBS) break;
      const extra = { company: 'Hitachi Energy' };
      if (job.department) extra.department = job.department;
      await visitDetailPage(context, job, 'hitachi', results, extra);
      await delay(400);
    }
    return;
  }

  await page.waitForSelector('[class*="job-result"], app-job-card, .job-card, [class*="position-card"]', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*="job-result"]',
      'app-job-card',
      '[class*="position-card"]',
      '.job-card',
      '[class*="opening"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)];
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
      title: item.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="sc-job"], [class*="job-item"], article, [data-testid*="job"]', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*="sc-job-card"]',
      '[class*="job-card"]',
      '[data-testid*="job"]',
      'article',
      '[class*="job-item"]',
    ];
    let items = [];
    for (const sel of selectors) {
      items = [...document.querySelectorAll(sel)].filter(el => el.querySelector('a'));
      if (items.length) break;
    }
    if (!items.length) {
      return [...document.querySelectorAll('a[href*="/job"]')].map(a => ({
        title: a.querySelector('h2,h3,strong')?.innerText?.trim() || a.innerText?.trim() || 'Not Found',
        location: 'Not Found',
        detailUrl: a.href,
      }));
    }
    return items.map(item => ({
      title: item.querySelector('h2,h3,[class*="title"],[class*="headline"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="job-card"], [class*="JobCard"], article, [class*="position"]', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const selectors = [
      '[class*="job-card"]',
      '[class*="JobCard"]',
      '[class*="position-item"]',
      'article',
      'li[class*="job"]',
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
      title: item.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
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
  await page.waitForSelector('[class*="job-card"], [class*="card-jobs"], [class*="phenom"], article', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Phenom People ATS selectors
    const selectors = [
      '[class*="job-card"]',
      '[class*="card-jobs"]',
      '[class*="phenom-job"]',
      '[class*="opening"]',
      'article',
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
      title: item.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
      location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
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
  await page.goto(listingUrl, { waitUntil: 'networkidle' }).catch(() => { });
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
    if (results.length >= MAX_JOBS) break;
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
  await page.waitForSelector('[class*="job-card"], [class*="JobCard"], [class*="job-item"], article', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Try result-card (Aditya Birla specific)
    const resultCards = [...document.querySelectorAll('.result-card')];
    if (resultCards.length) {
      return resultCards.map(card => {
        const a = card.querySelector('.job-title a, a[href*="job-details"]');
        const rawDate = card.querySelector('.job-date p')?.innerText?.trim() || '';
        // "Posted on Sat Aug 08 2026" → "Sat Aug 08 2026"
        const date = rawDate.replace(/^Posted\s+on\s+/i, '').trim() || 'Not Found';
        return {
          title: card.querySelector('h3, h2, [class*="title"]')?.innerText?.trim() || 'Not Found',
          location: card.querySelector('.job-location, [class*="location"]')?.innerText?.trim() || 'Not Found',
          date,
          detailUrl: a?.href || '',
        };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    }

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
    return items.map(item => {
      const rawDate = item.querySelector('.job-date p, [class*="date"]')?.innerText?.trim() || '';
      return {
        title: item.querySelector('h2,h3,[class*="title"]')?.innerText?.trim() || 'Not Found',
        location: item.querySelector('[class*="location"],[class*="city"]')?.innerText?.trim() || 'Not Found',
        date: rawDate.replace(/^Posted\s+on\s+/i, '').trim() || 'Not Found',
        detailUrl: item.querySelector('a')?.href || '',
      };
    });
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
    await page.waitForSelector('mat-expansion-panel', { timeout: 20000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      return [...document.querySelectorAll('mat-expansion-panel')].map(panel => ({
        title: panel.querySelector('.job-title-link span[itemprop="title"]')?.innerText?.trim() || 'Not Found',
        location: panel.querySelector('.job-result__location .label-value.location')?.innerText?.trim()?.replace(/\n/g, ' ') || 'Not Found',
        detailUrl: panel.querySelector('.job-title-link')?.href || '',
      })).filter(j => j.detailUrl && j.title !== 'Not Found');
    });

    console.log(`  ↳ Panasonic: Found ${jobLinks.length} jobs`);
    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      console.log(`    🔎 ${job.title} [${job.location}]`);
      await visitDetailPage(context, job, 'panasonic', results, { company: 'Panasonic' });
      await delay(500);
    }
  } else {
    // Direct detail page
    const details = await page.evaluate(genericJobEvaluator);
    results.push({
      source: 'panasonic',
      url: listingUrl,
      company: details.company !== 'Not Found' ? details.company : 'Panasonic',
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
      '[class*="job-card"] a', '[class*="jobCard"] a', '[class*="job-listing"] a',
      '[class*="job-result"] a', '[class*="job-item"] a', '[class*="position"] a',
      'article a', '.vacancies a', '.career-list a',
      'table tr td a[href*="job"]', 'ul li a[href*="job"]',
      'a[href*="/job/"]', 'a[href*="/jobs/"]', 'a[href*="jobId"]',
      'a[href*="vacancy"]', 'a[href*="requisition"]',
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
            title: (parent?.querySelector('h1,h2,h3,h4,[class*="title"]')?.innerText?.trim() || a.innerText?.trim() || a.getAttribute('title') || 'Not Found').slice(0, 200),
            location: parent?.querySelector('[class*="location"],[class*="city"],address')?.innerText?.trim() || 'Not Found',
            detailUrl: href,
          });
        }
      } catch (e) { }
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
// 🟢  BP Careers (SmartDreamers/Algolia)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeBp(page, context, listingUrl, results) {
  let pageNum = 1;
  const maxJobsLimit = 200;

  while (true) {
    console.log(`  📄 BP Page ${pageNum}...`);

    let found = true;
    await page.waitForSelector('.ais-Hits-item', { timeout: 25000 }).catch(async () => {
      console.log('⚠️  BP list waiting failed. Retrying with page reload...');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => { });
      await page.waitForTimeout(5000);
      await page.waitForSelector('.ais-Hits-item', { timeout: 15000 }).catch(() => {
        console.log('⚠️  BP list still not found after reload.');
        found = false;
      });
    });

    if (!found) break;
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.ais-Hits-item')].filter(i => i.querySelector('a.job'));

      return items.map(item => {
        const linkEl = item.querySelector('a.job');
        const titleEl = item.querySelector('.job-title');
        const locEl = item.querySelector('.job-location .location-inline');
        const dateEl = item.querySelector('.job-date .date-inline');

        let href = linkEl?.getAttribute('href') || '';
        if (href && href.startsWith('/')) {
          href = 'https://careers.bp.com' + href;
        }

        return {
          title: titleEl?.innerText?.trim() || 'Not Found',
          location: locEl?.innerText?.trim() || 'Not Found',
          date: dateEl?.innerText?.trim() || 'Not Found',
          detailUrl: href
        };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    });

    console.log(`     ↳ BP Page ${pageNum}: Found ${jobLinks.length} jobs`);

    for (const job of jobLinks) {
      if (results.length >= maxJobsLimit) break;
      console.log(`    🔎 ${job.title} [${job.location}]`);
      await visitDetailPage(context, job, 'bp', results, { company: 'BP' });
      await delay(500);
    }

    if (results.length >= maxJobsLimit) {
      console.log(`  🛑 BP: Limit (${maxJobsLimit}) reached, stopping.`);
      break;
    }

    // Pagination: click the Next Page link
    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('.ais-Pagination-item--nextPage a');
      if (nextBtn && !nextBtn.closest('.ais-Pagination-item--disabled')) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ BP done — all pages scraped.`);
      break;
    }

    await page.waitForTimeout(5000); // wait for page to render
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔗  VISIT DETAIL PAGE
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// 🔴  RAMBOLL
// ════════════════════════════════════════════════════════════════════════════
async function scrapeRamboll(page, context, listingUrl, results) {
  await page.waitForSelector('.chakra-accordion__item', { timeout: 30000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.chakra-accordion__item')];
    if (!items.length) return [];
    return items.map(item => {
      const title = item.querySelector('h3.chakra-text')?.innerText?.trim() || 'Not Found';
      const metaText = item.querySelector('button p.chakra-text')?.innerText?.trim() || 'Not Found';
      const detailUrl = item.querySelector('.chakra-collapse a, .css-cqvlvt a')?.getAttribute('href') || '';

      let loc = 'Not Found';
      let exp = 'Not Found';
      let dept = 'Not Found';

      if (metaText !== 'Not Found') {
        const parts = metaText.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          exp = parts[0];
          loc = `${parts[1]}, ${parts[2]}`; // "Gurugram, India"
          if (parts[3]) dept = parts[3];
        } else {
          loc = metaText;
        }
      }

      const fullLink = detailUrl ? new URL(detailUrl, window.location.origin).href : '';

      return {
        title,
        location: loc,
        experience: exp,
        detailUrl: fullLink,
        extra: { department: dept },
      };
    }).filter(j => j.title !== 'Not Found' && j.detailUrl);
  });

  console.log(`  ↳ Ramboll: ${jobLinks.length} jobs`);
  for (const job of jobLinks) {
    await visitDetailPage(context, job, 'ramboll', results, { company: 'Ramboll' });
    await delay(400);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔴  ZOHO RECRUIT
// ════════════════════════════════════════════════════════════════════════════
async function scrapeZohoRecruit(page, context, listingUrl, results) {
  let company = 'Not Found';
  try {
    const host = new URL(listingUrl).hostname;
    const sub = host.split('.')[0];
    if (sub.length <= 4) company = sub.toUpperCase();
    else company = sub.charAt(0).toUpperCase() + sub.slice(1);
  } catch (e) { }

  await page.waitForSelector('career-website-job-listing-layout1, .cw-filter-joblist, a.cw-1-title, a.cw-3-title, a[href*="/jobs/Careers/"]', { timeout: 35000 }).catch(() => { });
  await page.waitForTimeout(2500);

  const jobMap = new Map();

  const collectFromDOM = async () => {
    const found = await page.evaluate(() => {
      const list = [];
      const links = [...document.querySelectorAll('a[href*="/jobs/Careers/"], a.cw-1-title, a.cw-3-title')];
      links.forEach(a => {
        const title = a.innerText?.trim();
        let href = a.getAttribute('href') || a.href || '';
        if (href && href.startsWith('/')) href = window.location.origin + href;
        if (!title || title === 'Not Found' || !href) return;
        if (href.endsWith('/jobs/Careers') || href.endsWith('/jobs/Careers/')) return;

        const card = a.closest('li, .cw-filter-joblist, career-website-job-listing-layout1, div') || a.parentElement;
        const locEl = card?.querySelector('lyte-text[data-zrqa*="citycnt"], lyte-text[lt-prop-value], [data-zrqa*="citycnt"], .search-work-experience, [class*="location"]');
        const location = locEl?.getAttribute('lt-prop-value') || locEl?.innerText?.trim() || 'Not Found';

        list.push({ title, location, detailUrl: href, applyLink: href });
      });
      return list;
    });

    found.forEach(j => {
      if (!jobMap.has(j.detailUrl)) {
        jobMap.set(j.detailUrl, j);
      }
    });
  };

  // Strategy 1: Initial pass & mouse wheel scroll
  await collectFromDOM();
  const container = await page.$('.job-listing-gridwrapper, career-website-job-layout1, .cw-group-view, body');
  if (container) {
    const box = await container.boundingBox();
    if (box) {
      await page.mouse.move(box.x + Math.min(box.width / 2, 500), box.y + Math.min(box.height / 2, 300));
    }
  }

  for (let scrollStep = 0; scrollStep < 10; scrollStep++) {
    await collectFromDOM();
    await page.mouse.wheel(0, 1200);
    await page.evaluate(() => {
      [window, document.documentElement, document.body, document.querySelector('.cw-group-view'), document.querySelector('.cw-jobtemplate1-right'), document.querySelector('.job-listing-gridwrapper')].forEach(el => {
        if (el) {
          if (el.scrollBy) el.scrollBy(0, 1000);
          if (el.scrollTop !== undefined) el.scrollTop += 1000;
        }
      });
    });
    await page.waitForTimeout(400);
  }

  // Strategy 1.5: Click "showMoreJobs" or "10 more" buttons repeatedly in the default view
  let showMoreClicked = true;
  let loopCount = 0;
  while (showMoreClicked && loopCount < 10) {
      showMoreClicked = await page.evaluate(() => {
          let clickedAny = false;
          const btns = document.querySelectorAll('a[data-zrqa*="showmore"], .group-add, a[click*="showMoreJobs"]');
          btns.forEach(btn => {
              if (btn && btn.offsetHeight > 0) {
                  btn.click();
                  clickedAny = true;
              }
          });
          return clickedAny;
      });
      if (showMoreClicked) {
          await page.waitForTimeout(2000);
          await collectFromDOM();
          await page.mouse.wheel(0, 1200);
          await page.evaluate(() => {
              const cwView = document.querySelector('.cw-group-view');
              if (cwView) cwView.scrollBy(0, 1000);
              window.scrollBy(0, 800);
          });
      }
      loopCount++;
  }

  // Strategy 2: Click each Category in Filter Dropdown ("Full time", "Training", etc.) to uncap initial 10-job group limit

  // Strategy 3: Lyte Component JS memory fallback
  const memoryJobs = await page.evaluate(() => {
    try {
      const layout = document.querySelector('career-website-job-layout1');
      if (layout && layout.component && layout.component.data) {
        const recList = layout.component.data.rec_list || layout.component.data.job_list || [];
        return recList.map(item => {
          const id = item.id || item.rec_id || item.job_id;
          const name = item.job_name || item.title || item.name;
          if (!id || !name) return null;
          const url = item.url || `${window.location.origin}/jobs/Careers/${id}/${encodeURIComponent(name.replace(/\s+/g, '-'))}?source=CareerSite`;
          const loc = [item.city, item.state, item.country].filter(Boolean).join(', ') || item.location || 'Not Found';
          return { title: name, location: loc, detailUrl: url, applyLink: url };
        }).filter(Boolean);
      }
    } catch (e) { }
    return null;
  });

  if (memoryJobs && memoryJobs.length > 0) {
    memoryJobs.forEach(j => {
      if (!jobMap.has(j.detailUrl)) {
        jobMap.set(j.detailUrl, j);
      }
    });
  }

  const jobLinks = Array.from(jobMap.values());
  console.log(`  ↳ Zoho Recruit (${company}): ${jobLinks.length} total jobs collected`);
  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'zohorecruit', results, { company });
    await delay(400);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🟡  TURBOHIRE (jswgroup.turbohire.co)
// SPA — all job cards share the same data_testid. Extract fields directly
// ════════════════════════════════════════════════════════════════════════════
// 🏎️  PORSCHE
// ════════════════════════════════════════════════════════════════════════════
async function scrapePorsche(page, context, listingUrl, results) {
  await page.waitForSelector('.jb-datatable tbody tr', { timeout: 25000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate((base) => {
    return [...document.querySelectorAll('.jb-dt-list-body tr')].map(tr => {
      const a = tr.querySelector('.column-jobad-title a');
      const loc = tr.querySelector('[data-column-title="Location"]');
      const div = tr.querySelector('[data-column-title="Division"]');
      return {
        title: a?.innerText?.trim() || 'Not Found',
        location: loc?.innerText?.trim() || 'Not Found',
        detailUrl: a ? new URL(a.getAttribute('href'), base).href : '',
        extra: { division: div?.innerText?.trim() }
      };
    }).filter(j => j.detailUrl && j.title !== 'Not Found');
  }, listingUrl);

  console.log(`  ↳ Porsche: Found ${jobLinks.length} jobs`);

  for (const job of jobLinks) {
    if (typeof MAX_JOBS !== 'undefined' && results.length >= MAX_JOBS) break;
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'porsche', results, { company: job.extra?.division || 'Porsche', sourceUrl: listingUrl });
    if (typeof delay === 'function') await delay(400);
    else await new Promise(r => setTimeout(r, 400));
  }
}

// from DOM selectors per card, click by index, extract from detail panel.
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTurbohire(page, context, listingUrl, results) {
  // Wait for first card to load
  await page.waitForSelector('span[data_testid*="89181-80685"]', { timeout: 30000 }).catch(() => { });
  await page.waitForTimeout(3000);

  // ── PHASE 1: Progressive scroll to collect ALL card data ──────────────────
  // Turbohire uses virtual scrolling — only ~4-5 cards exist in DOM at once.
  // We must scroll step-by-step and harvest cards before they are unrendered.
  const allCardData = new Map(); // keyed by jobId or title for deduplication

  const extractCurrentCards = () => page.evaluate(() => {
    const extractCard = (card) => {
      const titleEl = card.querySelector('span[data_testid*="89181-80685"]') ||
        card.querySelector('span[style*="font-weight: bold"]');
      const title = titleEl?.innerText?.trim() || '';
      if (!title) return null;

      const jobIdEl = card.querySelector('span[data_testid*="70044-30473"]');
      const jobId = jobIdEl?.innerText?.trim() || title;

      const locationEl = card.querySelector('span[data_testid*="71158-30473"]');
      const location = locationEl?.innerText?.trim() || 'Not Found';

      const companyEl = card.querySelector('span[data_testid*="42872-30473"]');
      const company = companyEl?.innerText?.trim() || '';

      const dateEl = card.querySelector('span[data_testid*="18533"]') ||
        card.querySelector('[data_testid*="84806-30473"]');
      let date = dateEl?.innerText?.trim() || 'Not Found';
      if (date.toLowerCase().includes('posted on')) date = date.replace(/posted on/i, '').trim();
      return { title, jobId, location, company, date };
    };

    // Find the scrollable container
    const scrollable = [...document.querySelectorAll('div')].find(el =>
      el.scrollHeight > el.clientHeight + 200 && el.clientHeight > 300
    );

    // Find all visible title spans and walk up to their card container
    const seen = new Set();
    const cards = [];
    const titleSpans = [...document.querySelectorAll('span[data_testid*="89181-80685"]')];
    for (const span of titleSpans) {
      let p = span.parentElement;
      while (p && p.tagName !== 'BODY') {
        if (p.querySelector('span[data_testid*="18533"]') || p.innerText.includes('Posted on')) {
          const data = extractCard(p);
          if (data && !seen.has(data.jobId)) {
            seen.add(data.jobId);
            cards.push(data);
          }
          break;
        }
        p = p.parentElement;
      }
    }

    return { cards, scrollableFound: !!scrollable };
  });

  // Find and scroll the inner container progressively
  let noNewCount = 0;
  let scrollTop = 0;
  const SCROLL_STEP = 400;
  const MAX_NO_NEW = 8;

  while (noNewCount < MAX_NO_NEW) {
    const { cards } = await extractCurrentCards();
    let newFound = 0;
    for (const c of cards) {
      if (!allCardData.has(c.jobId)) {
        allCardData.set(c.jobId, c);
        newFound++;
      }
    }

    if (newFound === 0) {
      noNewCount++;
    } else {
      noNewCount = 0;
    }

    scrollTop += SCROLL_STEP;
    await page.evaluate((top) => {
      const scrollable = [...document.querySelectorAll('div')].find(el =>
        el.scrollHeight > el.clientHeight + 200 && el.clientHeight > 300
      );
      if (scrollable) scrollable.scrollTop = top;
    }, scrollTop);
    await page.waitForTimeout(400);
  }

  const cardData = [...allCardData.values()];
  console.log(`  ↳ Turbohire: ${cardData.length} jobs found on listing`);

  // ── PHASE 2: Scroll to each card, click, extract details ──────────────────
  let defaultCompany = 'Turbohire';
  const m = listingUrl.match(/https:\/\/([^\.]+)\./);
  if (m && m[1]) defaultCompany = m[1].charAt(0).toUpperCase() + m[1].slice(1);

  let consecutiveNoDetail = 0;
  const MAX_CONSECUTIVE_NO_DETAIL = 3;

  for (const card of cardData) {
    if (results.length >= MAX_JOBS) break;
    if (consecutiveNoDetail >= MAX_CONSECUTIVE_NO_DETAIL) {
      console.log(`  🛑 Stopping: ${MAX_CONSECUTIVE_NO_DETAIL} consecutive "No detail panel" — session likely expired.`);
      break;
    }
    try {
      // Scroll listing back to top and search for this card's title
      let scrollPos = 0;
      let titleSpan = null;
      let found = false;

      // First scroll back to top
      await page.evaluate(() => {
        const scrollable = [...document.querySelectorAll('div')].find(el =>
          el.scrollHeight > el.clientHeight + 200 && el.clientHeight > 300
        );
        if (scrollable) scrollable.scrollTop = 0;
      });
      await page.waitForTimeout(600);

      // Now scan downward to find the card
      for (let attempt = 0; attempt < 100; attempt++) {
        const titleHandles = await page.$$('span[data_testid*="89181-80685"]');
        for (const t of titleHandles) {
          const text = await t.innerText().catch(() => '');
          if (text.trim() === card.title) {
            titleSpan = t;
            found = true;
            break;
          }
        }
        if (found) break;

        scrollPos += SCROLL_STEP;
        await page.evaluate((top) => {
          const scrollable = [...document.querySelectorAll('div')].find(el =>
            el.scrollHeight > el.clientHeight + 200 && el.clientHeight > 300
          );
          if (scrollable) scrollable.scrollTop = top;
        }, scrollPos);
        await page.waitForTimeout(400);
      }

      if (!titleSpan) {
        console.log(`    ⚠ Not found in DOM: ${card.title}`);
        continue;
      }

      await titleSpan.click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle').catch(() => { });

      const currentUrl = page.url();

      const hasDetail = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Job Description') || text.includes('Required Experience') || text.includes('Company Name');
      });

      if (!hasDetail) {
        consecutiveNoDetail++;
        console.log(`    ⚠ No detail panel for: ${card.title} [${consecutiveNoDetail}/${MAX_CONSECUTIVE_NO_DETAIL}]`);
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(1500);
        continue;
      }
      consecutiveNoDetail = 0; // reset on success

      const details = await page.evaluate(() => {
        const fullText = document.body?.innerText || '';

        let company = 'Not Found';
        [...document.querySelectorAll('p, span, div')].some(el => {
          if (el.innerText.trim() === 'Company Name' && el.children.length === 0) {
            let next = el.nextElementSibling;
            if (next && next.innerText) { company = next.innerText.trim(); return true; }
            next = el.parentElement?.nextElementSibling;
            if (next && next.innerText) { company = next.innerText.trim(); return true; }
          }
          return false;
        });

        let experience = 'Not Found';
        [...document.querySelectorAll('p, span, div')].some(el => {
          if (el.innerText.trim() === 'Required Experience' && el.children.length === 0) {
            let next = el.nextElementSibling;
            if (next && next.innerText) { experience = next.innerText.trim(); return true; }
            next = el.parentElement?.nextElementSibling;
            if (next && next.innerText) { experience = next.innerText.trim(); return true; }
          }
          return false;
        });
        if (experience === 'Not Found') {
          const expMatch = fullText.match(/Required Experience\s*[\n:]?\s*([^\n]+)/i);
          if (expMatch) experience = expMatch[1].trim();
        }

        let description = '';
        const descHeader = [...document.querySelectorAll('p, h1, h2, h3, span, div')].find(el => el.innerText.trim() === 'Job Description' && el.children.length === 0);
        if (descHeader && descHeader.nextElementSibling) {
          description = descHeader.nextElementSibling.innerText.trim();
        }
        if (!description) {
          const descEl = document.querySelector('[data_testid*="51365"], [data_testid*="20709"] [style*="overflow"], .public-DraftEditor-content');
          description = descEl?.innerText?.trim() || fullText.slice(0, 3000);
        }

        return { company, experience, description };
      });

      const finalCompany = details.company !== 'Not Found' ? details.company : (card.company || defaultCompany);

      results.push({
        source: 'turbohire',
        url: currentUrl,
        title: card.title,
        location: card.location,
        company: finalCompany,
        date: card.date,
        experience: details.experience,
        description: details.description,
        applyLink: currentUrl,
        salary: 'Not Available',
        jobId: card.jobId,
      });
      console.log(`    ✅ ${card.title} [${card.jobId}]`);

      // Navigate back to listing
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
      await page.waitForSelector('span[data_testid*="89181-80685"]', { timeout: 20000 }).catch(() => { });
      await page.waitForTimeout(1500);
    } catch (e) {
      console.log(`    ⚠ Error on ${card.title}: ${e.message?.slice(0, 80)}`);
      await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
      await page.waitForTimeout(2000);
    }
    await delay(500);
  }
}


async function scrapeParamAi(page, context, listingUrl, results) {
  console.log(`  📄 Loading ${listingUrl}...`);
  await page.goto(listingUrl, { waitUntil: 'networkidle' }).catch(() => { });
  await page.waitForSelector('a[href*="/jobs/"]', { timeout: 15000 }).catch(async () => {
    const content = await page.content();
    console.log(`    ⚠️ No job links found. HTML length: ${content.length}`);
  });
  await autoScroll(page);
  const jobLinks = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="/jobs/"]')];
    return links.map(a => {
      const h3 = a.querySelector('h3');
      const title = h3 ? h3.innerText.trim() : a.innerText.split('\n').find(l => l.length > 5) || 'Not Found';
      let location = 'Not Found';
      const text = a.innerText;
      const cities = ['Gurugram', 'Manesar', 'Rohtak', 'Kharkhoda', 'Gurgaon', 'Delhi', 'Noida', 'Haryana'];
      for (const city of cities) { if (text.includes(city)) { location = city; break; } }
      if (location !== 'Not Found') location += ', India';
      return { title, location, detailUrl: a.href };
    }).filter(j => j.detailUrl && !j.detailUrl.endsWith('/jobs') && j.title !== 'Not Found');
  });
  console.log(`  ↳ ParamAi: Found ${jobLinks.length} candidates`);
  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'maruti', results, { company: 'Maruti Suzuki' });
    await delay(500);
  }
}

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
    await page.waitForLoadState('networkidle').catch(() => { });

    // Wait for critical containers
    if (source === 'darwinbox') {
      await page.waitForSelector('.job-main-details, .job-summary, .box', { timeout: 15000 }).catch(() => { });
    } else if (source === 'paramai') {
      await page.waitForSelector('.ql-editor, [class*=\"job-description\"]', { timeout: 15000 }).catch(() => { });
    } else if (source === 'jabil') {
      await page.waitForSelector('.job-description-container', { timeout: 15000 }).catch(() => { });
    }

    const details = await page.evaluate(genericJobEvaluator);

    // Cleanup: If title is generic or matches company name, use the listing title
    const genericTitles = ['job details page', 'job details', 'careers', 'career', 'job description', 'job opportunities', 'tesla', 'blue star', 'careers at mphasis', 'araymond', 'a. raymond', 'a.raymond'];
    let finalTitle = details.title;
    let finalCompanyTemp = (extra.company && extra.company !== 'Not Found') ? extra.company : (details.company !== 'Not Found' ? details.company : extractFallbackCompany(job.detailUrl));
    const titleLower = (finalTitle || '').toLowerCase();
    const isGeneric = !finalTitle || finalTitle === 'Not Found'
      || genericTitles.includes(titleLower)
      || (finalCompanyTemp && titleLower === finalCompanyTemp.toLowerCase())
      || titleLower.startsWith('careers at ')
      || titleLower.startsWith('jobs at ')
      || titleLower.startsWith('career at ');
    if (isGeneric) {
      finalTitle = job.title;
    }

    // Location priority: If listing has a specific location, keep it. 
    // Otherwise use detail page location.
    let finalLocation = details.location || 'Not Found';
    if (job.location && job.location !== 'Not Found') {
      if (finalLocation !== 'Not Found' && !job.location.toLowerCase().includes(finalLocation.toLowerCase()) && !finalLocation.toLowerCase().includes(job.location.toLowerCase())) {
        finalLocation = `${job.location}, ${finalLocation}`;
      } else {
        finalLocation = job.location;
      }
    } else if (!finalLocation || finalLocation === 'Not Found') {
      finalLocation = 'Not Found';
    }

    // Title cleanup
    if (finalTitle) {
      finalTitle = finalTitle.replace(/[\n\r\s]+Apply now.*/gi, '').trim();
    }

    let finalApplyLink = (!details.applyLink || details.applyLink === 'Not Found' || details.applyLink === 'Apply button (JS trigger)' || (details.applyLink && String(details.applyLink).startsWith('mailto:'))) ? job.detailUrl : details.applyLink;

    if (job.detailUrl.includes('csod.com') || job.detailUrl.includes('successfactors.com') || job.detailUrl.includes('hitachienergy.com') || job.detailUrl.includes('jobs.tuvsud.com') || job.detailUrl.includes('join.cnh.com') || job.detailUrl.includes('jobs.mahindracareers.com') || job.detailUrl.includes('jobs.halliburton.com') || job.detailUrl.includes('heromotocorp.com') || job.detailUrl.includes('darwinbox.in') || job.detailUrl.includes('unilever.com') || job.detailUrl.includes('caterpillar.com') || job.detailUrl.includes('tenneco.com') || job.detailUrl.includes('bajajelectricals.com') || job.detailUrl.includes('technipfmc.com') || job.detailUrl.includes('royalenfield.com') || job.detailUrl.includes('panasonic.com') || job.detailUrl.includes('careers.jabil.com') || job.detailUrl.includes('hillenbrand.wd3.myworkdayjobs.com') || job.detailUrl.includes('rockwellautomation.wd1.myworkdayjobs.com') || job.detailUrl.includes('weir.wd3.myworkdayjobs.com') || job.detailUrl.includes('careers.bp.com') || job.detailUrl.includes('careers.regalrexnord.com') || job.detailUrl.includes('careers.se.com') || job.detailUrl.includes('ramboll.com') || job.detailUrl.includes('zohorecruit.com') || job.detailUrl.includes('myworkdayjobs.com') || job.detailUrl.includes('careers.adityabirla.com') || job.detailUrl.includes('jobs.siemens.com') || job.detailUrl.includes('bajajauto.com') || job.detailUrl.includes('tataprojects.com') || job.detailUrl.includes('tatainternational.com') || job.detailUrl.includes('tataconsumer.com') || job.detailUrl.includes('tataelectronics.com') || job.detailUrl.includes('jobs.zf.com') || job.detailUrl.includes('jobs.danfoss.com') || job.detailUrl.includes('workline.hr') || job.detailUrl.includes('ripplehire.com') || job.detailUrl.includes('schindler.com') || job.detailUrl.includes('alstom.com') || job.detailUrl.includes('peoplestrong.com') || job.detailUrl.includes('workable.com') || job.detailUrl.includes('teamtailor.com') || job.detailUrl.includes('talentrecruit.com')) {
      finalApplyLink = job.detailUrl;
    }

    if (job.detailUrl.includes('heromotocorp.com')) {
      const match = job.detailUrl.match(/\/(\d+)\/?(?:[?#].*)?$/);
      if (match && (!job.jobId || job.jobId === 'Not Found')) {
        job.jobId = match[1];
      }
    }

    let finalCompany = (extra.company && extra.company !== 'Not Found') ? extra.company : (details.company !== 'Not Found' ? details.company : extractFallbackCompany(job.detailUrl));
    if (job.detailUrl.includes('join.cnh.com')) {
      finalCompany = 'CNH';
    } else if (job.detailUrl.includes('jobs.tuvsud.com')) {
      finalCompany = 'TÜV SÜD';
    } else if (job.detailUrl.includes('tataelectronics.com')) {
      finalCompany = 'Tata Electronics';
    } else if (job.detailUrl.includes('jobs.zf.com')) {
      finalCompany = 'ZF Group';
    } else if (job.detailUrl.includes('jobs.danfoss.com')) {
      finalCompany = 'Danfoss';
    } else if (job.detailUrl.includes('careers.araymond.com')) {
      finalCompany = 'ARaymond';
    } else if (job.detailUrl.includes('tesla') || job.detailUrl.includes('mokahr.com')) {
      finalCompany = 'Tesla';
    } else if (job.detailUrl.includes('workline.hr')) {
      finalCompany = 'Blue Star';
    } else if (job.detailUrl.includes('schindler.com')) {
      finalCompany = 'Schindler';
    } else if (job.detailUrl.includes('alstom.com')) {
      finalCompany = 'Alstom';
    } else if (job.detailUrl.includes('larsentoubro')) {
      finalCompany = 'Larsen & Toubro';
    } else if (job.detailUrl.includes('peoplestrong.com')) {
      finalCompany = (extra.company && extra.company !== 'Not Found') ? extra.company : 'PeopleStrong';
    } else if (job.detailUrl.includes('workable.com')) {
      finalCompany = (extra.company && extra.company !== 'Not Found') ? extra.company : 'Workable';
    } else if (job.detailUrl.includes('teamtailor.com')) {
      finalCompany = (extra.company && extra.company !== 'Not Found') ? extra.company : 'Teamtailor';
    } else if (job.detailUrl.includes('talentrecruit.com')) {
      finalCompany = (extra.company && extra.company !== 'Not Found') ? extra.company : 'TalentRecruit';
    } else if (job.detailUrl.includes('ripplehire.com') && extra.company === 'Mphasis') {
      finalCompany = 'Mphasis';
    } else if (finalCompany === 'Office' || finalCompany === 'Not Found') {
      if (job.detailUrl.includes('heromotocorp.com')) finalCompany = 'Hero Motocorp';
      else if (job.detailUrl.includes('technipfmc.com')) finalCompany = 'TechnipFMC';
      else if (job.detailUrl.includes('tataconsumer.com')) finalCompany = 'Tata Consumer';
      else finalCompany = extractFallbackCompany(job.detailUrl);
    }

    const isSwapped = source === 'kbr' || source === 'worley' || source === 'se' || source === 'smartrecruiters' || source === 'turbohire' || job.detailUrl.includes('careers.kbr.com') || job.detailUrl.includes('jobs.worley.com') || job.detailUrl.includes('careers.se.com') || job.detailUrl.includes('smartrecruiters.com') || job.detailUrl.includes('turbohire.co');
    // Listing se date prefer karo agar detail page me nahi mili
    const finalDate = (job.date && job.date !== 'Not Found') ? job.date : details.date;

    // Salary extraction from description if not found by evaluator
    let finalSalary = details.salary;
    const isInvalidSalary = (s) => {
      if (!s || s === 'Not Available' || s === 'Not Found') return true;
      const lower = s.toLowerCase();
      if (lower.includes('billion') || lower.includes('million') || lower.includes('bn') || lower.includes('sales') || lower.includes('revenue') || lower.includes('fiscal')) return true;
      if (/^[€$£\u20b9\u20ac\u00a3]\s*\d+(?:\.\d+)?$/i.test(s.trim())) return true;
      return false;
    };

    if (isInvalidSalary(finalSalary)) {
      finalSalary = 'Not Available';
      const descText = (details.description || '')
        .replace(/(?:sales|revenue|turnover|generated|market cap|funding|raised)\s+(?:of\s+)?(?:[\$\u20ac\u00a3\u20b9]|INR|USD|EUR|GBP|Rs\.?)?\s*[\d,.]+\s*(?:billion|million|bn|m)?\b/gi, '')
        .replace(/(?:[\$\u20ac\u00a3\u20b9]|INR|USD|EUR|GBP|Rs\.?)\s*[\d,.]+\s*(?:billion|million|bn|m)\b/gi, '')
        .replace(/match up to \$[0-9,]+[^.]*for money raised/gi, '')
        .replace(/match up to \$[0-9,]+[^.]*charitable/gi, '')
        .replace(/\$[0-9,]+\s*for\s*charitable/gi, '')
        .replace(/[\$\u20ac\u00a3\u20b9][\d.]+\s*billion/gi, '')
        .replace(/revenue of [\$\u20ac\u00a3\u20b9][\d.]+[^.]*/gi, '');

      const salaryPatterns = [
        /(?:AED|aed)\s*[\d,]+(?:\s*[-–to]+\s*(?:AED|aed)?\s*[\d,]+)?(?:\s*(?:per\s+(?:month|annum|year|yr)|\/(?:month|yr|year|annum)))?/i,
        /(?:₹|INR)\s*[\d,]{4,}(?:\s*[-–to]+\s*(?:₹|INR)?\s*[\d,]+)?(?:\s*(?:per\s+(?:month|annum|year|yr)|\/(?:month|yr|year|annum|pa)))?(?:\s*(?:lakh|lakhs|l|LPA))?/i,
        /Rs\.?\s*[\d,]{4,}(?:\s*[-–to]+\s*Rs\.?\s*[\d,]+)?(?:\s*(?:per\s+(?:month|annum|year|yr)|\/(?:month|yr|year|annum|pa)))?(?:\s*(?:lakh|lakhs|LPA))?/i,
        /\$[\d,]+(?:\.\d+)?(?:\s*[-–to]+\s*\$[\d,]+(?:\.\d+)?)?(?:\s*(?:per\s+(?:hour|hr|month|annum|year)|\/(?:hour|hr|yr|year|annum|annually)))?/i,
        /[£€]\s*[\d,]+(?:\.\d+)?(?:\s*[-–to]+\s*[£€]?\s*[\d,]+(?:\.\d+)?)?(?:\s*(?:per\s+(?:annum|year|month)|\/(?:yr|year|annum|pa)))?/i,
        /[\d,]+(?:\.\d+)?\s*(?:LPA|lpa|lakhs?\s*per\s*annum|lakhs?\s*p\.?a\.?)/i,
      ];
      for (const pat of salaryPatterns) {
        const m = descText.match(pat);
        if (m && m[0].trim().length > 2) {
          finalSalary = m[0].trim();
          break;
        }
      }
      if (!finalSalary || isInvalidSalary(finalSalary)) finalSalary = 'Not Available';
    }

    results.push({
      source,
      url: isSwapped ? job.detailUrl : job.detailUrl,
      title: finalTitle,
      location: finalLocation,
      company: finalCompany,
      date: finalDate,
      experience: details.experience !== 'Not Found' ? details.experience : (job.experience || 'Not Found'),
      description: details.description,
      applyLink: isSwapped ? job.detailUrl : finalApplyLink,
      salary: finalSalary,
      jobId: details.jobId !== 'Not Found' ? details.jobId : (job.jobId || 'Not Found'),
      sourceUrl: extra.sourceUrl
    });
    // 💾 Turant save — jobs.json immediately updated after each job
    try { fs.writeFileSync(require('path').join(__dirname, 'jobs.json'), JSON.stringify(results, null, 2)); } catch (_) { }
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
  } catch (e) {
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
  const getText = (sels) => { for (const s of sels) { try { const el = document.querySelector(s); if (el?.innerText?.trim()) return el.innerText.trim(); if (el?.content?.trim()) return el.content.trim(); } catch (e) { } } return ''; };
  const getByLabel = (label) => {
    try {
      const dts = [...document.querySelectorAll('dt, .text-sm.font-medium, label, .title-category-job, .label')];
      const target = dts.find(dt => dt.innerText.toLowerCase().includes(label.toLowerCase()));
      if (target) {
        // Direct sibling (SuccessFactors style)
        const dd = target.nextElementSibling;
        if (dd && (dd.tagName.toLowerCase() === 'dd' || dd.classList.contains('value') || dd.classList.contains('title-content-job'))) return dd.innerText.trim();
        // Child of parent (Maruti & Jabil style)
        const val = target.parentElement?.querySelector('.value, .title-content-job');
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
    } catch (e) { }
    return '';
  };
  const getAllText = (sel) => { try { return [...document.querySelectorAll(sel)].map(el => el.innerText?.trim()).filter(Boolean).join('\n'); } catch (e) { return ''; } };
  const getJsonLd = () => { try { for (const b of document.querySelectorAll('script[type=\"application/ld+json\"]')) { const json = JSON.parse(b.textContent); const items = json['@graph'] ? json['@graph'] : [json]; const job = items.find(i => i['@type'] === 'JobPosting' || i['@type'] === 'Job'); if (job) return job; } } catch (e) { } return null; };
  const fullText = document.body?.innerText || '';
  const ld = getJsonLd();

  // SuccessFactors detail
  try {
    if (window.location.href.toLowerCase().includes('successfactors.com') || document.querySelector('#jobAppPageTitle') || document.querySelector('#candidateProfileTitle')) {
      const container = document.querySelector('#jobAppPageTitle, #page_content, .joqContent, .jobLayout, .jobPostingContent');
      let desc = '';
      if (container) {
        const clone = container.cloneNode(true);
        clone.querySelectorAll('script, style, a, button, select, input, [role="button"], .SFContextualMenuLabel, [id*="EmailThisJob"], [class*="EmailThisJob"]').forEach(el => el.remove());
        desc = clone.innerText.replace(/\n\s*\n/g, '\n').trim();
        const popIdx = desc.indexOf('Email this job to a friend');
        if (popIdx !== -1) {
          desc = desc.slice(0, popIdx).trim();
        }
      }
      if (!desc) desc = fullText;

      const title = document.querySelector('#candidateProfileTitle, h1')?.innerText?.replace(/^Career Opportunities:\s*/i, '')?.trim() || 'Not Found';
      const expMatch = desc.match(/(\d+\+?\s*(?:-\s*\d+)?\s*(?:years|yrs|year))/i);

      return {
        title,
        location: 'Not Found',
        company: 'Not Found',
        date: 'Not Found',
        description: desc,
        applyLink: window.location.href,
        experience: expMatch ? expMatch[0] : 'Not Found',
        salary: 'Not Available',
        jobId: window.location.href.match(/career_job_req_id=(\d+)/i)?.[1] || 'Not Found'
      };
    }
  } catch (e) { }

  // DeJobs detail (Colgate-Palmolive etc.)
  try {
    if (window.location.href.toLowerCase().includes('dejobs.org')) {
      const title = document.querySelector('main h2 span.font-bold, main h2')?.innerText?.split('\n')?.[0]?.trim() || 'Not Found';
      const applyLink = document.querySelector('a[href*="jobsyn.org"]')?.href || window.location.href;
      const descEl = document.querySelector('.prose');
      const desc = descEl ? descEl.innerText.trim() : fullText;
      return {
        title,
        location: document.querySelector('main h2 span.font-semibold')?.innerText?.trim() || 'Not Found',
        company: 'Colgate-Palmolive',
        date: document.querySelector('main h2 span.text-gray-600')?.innerText?.replace('Posted', '')?.trim() || 'Not Found',
        description: desc,
        applyLink,
        experience: desc.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || 'Not Found',
        salary: 'Not Available',
        jobId: window.location.href.split('/').filter(Boolean).slice(-2)[0] || 'Not Found'
      };
    }
  } catch (e) { }

  // AECOM detail (aecom.jobs)
  try {
    if (window.location.href.toLowerCase().includes('aecom.jobs')) {
      const title = document.querySelector('h1.h2, h1')?.innerText?.trim() || 'Not Found';
      const location = document.querySelector('.jd-location, .job-location')?.innerText?.trim()
        || document.querySelector('.job-description .location')?.innerText?.trim() || 'Not Found';
      const applyLink = window.location.href;
      const descEl = document.querySelector('.jd-text, .job-description, main#main .prose, main#main .content');
      const desc = descEl ? descEl.innerText.trim() : fullText;
      const jobId = window.location.href.split('/').filter(Boolean).slice(-2, -1)[0] || 'Not Found';
      return {
        title,
        location,
        company: 'AECOM',
        date: document.querySelector('.jd-date, .posted-date, time')?.innerText?.trim() || 'Not Found',
        description: desc,
        applyLink,
        experience: desc.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || 'Not Found',
        salary: 'Not Available',
        jobId
      };
    }
  } catch (e) { }

  // PeopleStrong detail (e.g. leindiacareers.peoplestrong.com)
  try {
    if (window.location.href.toLowerCase().includes('peoplestrong.com')) {
      const title = document.querySelector('h1.job-title, h2.job-title, .job-detail-header h1, .job-detail-header h2, .detail-head h1, h1, h2.title')?.innerText?.trim() || 'Not Found';
      const location = document.querySelector('.job-location, .location, .city, .detail-location, [class*="location"]')?.innerText?.trim() || 'Not Found';
      const descEl = document.querySelector('.detail-description, .jd-desc, .job-description, .job-detail-desc, [class*="detail-desc"], .content-block, main');
      const desc = descEl ? descEl.innerText.trim() : fullText;
      const jobId = window.location.pathname.split('/').filter(Boolean).pop() || 'Not Found';
      return {
        title,
        location,
        company: 'Not Found', // overridden by visitDetailPage extra.company
        date: document.querySelector('.posted-date, .date-posted, .posting-date, time')?.innerText?.trim() || 'Not Found',
        description: desc,
        applyLink: window.location.href,
        experience: desc.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || 'Not Found',
        salary: 'Not Available',
        jobId
      };
    }
  } catch (e) { }

  // Workable detail (e.g. apply.workable.com/pxgeo/j/184A7CAB14/)
  try {
    if (window.location.href.toLowerCase().includes('workable.com')) {
      const title = document.querySelector('h1[data-ui="job-title"], [data-ui="job-title"], h1')?.innerText?.trim() || 'Not Found';
      const location = document.querySelector('[data-ui="job-location"]')?.innerText?.replace(/\s+/g, ' ')?.trim() || 'Not Found';
      const company = document.querySelector('[data-ui="company-logo"] img, [data-ui="header-logo"] img, .styles--32vFk img')?.getAttribute('alt')?.trim() || 'Not Found';
      const descEl = document.querySelector('section[data-ui="job-description"], [data-ui="job-description"], main');
      const desc = descEl ? descEl.innerText.trim() : fullText;
      const jobId = window.location.pathname.match(/\/j\/([A-Za-z0-9]+)/)?.[1] || window.location.pathname.split('/').filter(Boolean).pop() || 'Not Found';
      return {
        title,
        location,
        company,
        date: 'Not Found',
        description: desc,
        applyLink: window.location.href,
        experience: desc.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || 'Not Found',
        salary: 'Not Available',
        jobId
      };
    }
  } catch (e) { }

  // TTC Portals detail (e.g. parkercareers.ttcportals.com)
  try {
    if (window.location.href.toLowerCase().includes('ttcportals.com')) {
      let title = document.querySelector('h1.title, h1.job-title, .job-header h1, h1, h5.job-title')?.innerText?.trim();
      let location = '';
      let date = '';
      let desc = '';

      // Try JSON-LD first
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const s of scripts) {
        try {
          const data = JSON.parse(s.innerText);
          if (data['@type'] === 'JobPosting') {
            if (data.title && !title) title = data.title;
            if (data.description) desc = data.description.replace(/<[^>]+>/g, '').trim();
            if (data.datePosted) date = data.datePosted;
            if (data.jobLocation && data.jobLocation.address) {
              const a = data.jobLocation.address;
              location = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(', ');
            }
            break;
          }
        } catch (err) { }
      }

      // DOM fallbacks
      if (!title) title = 'Not Found';
      if (!location) {
        location = document.querySelector('.location, .job-location, .job-details .city, [class*="location"], .ats-location')?.innerText?.trim() || 'Not Found';
        if (location.includes('Location')) { // e.g. "Location: GBR Barnstaple"
          const locText = document.querySelector('.job-info.location')?.parentElement?.innerText || '';
          const match = locText.match(/Location\s*\]?\s*:\s*(.*)/i) || locText.match(/Location\s*:\s*(.*)/i);
          if (match) location = match[1].split('\n')[0].trim();
        }
      }
      if (!date) {
        const postedSpan = document.querySelector('.job-info.posted');
        if (postedSpan && postedSpan.parentElement) {
          const match = postedSpan.parentElement.innerText.match(/Posted\s*:\s*(.*)/i);
          if (match) date = match[1].split('\n')[0].trim();
        }
        if (!date) date = document.querySelector('.date, .posted-date, .job-posted, time')?.innerText?.trim() || 'Not Found';
      }
      if (!desc) {
        const descEl = document.querySelector('.ats-description, .job-description, .description, .job-details__description, [class*="description"]')?.closest('.page-section-medium') || document.querySelector('.ats-description, .job-description, .description, .job-details__description, [class*="description"]');
        desc = descEl ? descEl.innerText.trim() : fullText;
      }

      const jobId = window.location.pathname.split('/').filter(Boolean).pop() || 'Not Found';

      return {
        title,
        location,
        company: 'Not Found', // overridden by visitDetailPage extra.company
        date,
        description: desc,
        applyLink: window.location.href,
        experience: desc.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || 'Not Found',
        salary: 'Not Available',
        jobId
      };
    }
  } catch (e) { }

  // Oracle KO.js
  try { const root = document.querySelector('job-details-page'); if (window.ko && root) { const koData = window.ko.dataFor(root); if (koData?.pageData) { const jd = koData.pageData().job; return { title: jd.title || '', location: jd.primaryLocation || '', company: document.querySelector('meta[property=\"og:site_name\"]')?.content || 'Not Found', date: jd.postedDate || 'Not Found', description: jd.description?.replace(/<[^>]+>/g, '') || 'Not Found', applyLink: window.location.href, experience: jd.description?.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || 'Not Found', salary: 'Not Available', jobId: String(jd.id || 'Not Found') }; } } } catch (e) { }

  // Porsche detail
  try {
    if (window.location.href.toLowerCase().includes('jobs.porsche.com')) {
      const title = document.querySelector('h1')?.innerText?.trim() || 'Not Found';
      let org = 'Dr. Ing. h.c. F. Porsche AG';
      let loc = 'Not Found';
      let code = 'Not Found';
      document.querySelectorAll('.jobad-base-info-item').forEach(item => {
        const t = item.querySelector('.jobad-base-info-title')?.innerText?.toLowerCase() || '';
        const v = item.querySelector('.jobad-base-info-content')?.innerText?.trim();
        if (t.includes('organization')) org = v;
        if (t.includes('location')) loc = v;
        if (t.includes('code number')) code = v;
      });
      const descEl = document.querySelector('.jobad-extern-full-width');
      const desc = descEl ? descEl.innerText.trim() : fullText;
      const applyLink = document.querySelector('.js-button-apply')?.href || window.location.href;

      let expMatch = desc.match(/(\d+\+?\s*(years|yrs))/i);
      let salMatch = desc.match(/\$[\d,]+\s*-\s*\$[\d,]+/);

      return {
        title,
        location: loc,
        company: org,
        date: 'Not Found',
        description: desc,
        applyLink,
        experience: expMatch ? expMatch[0] : 'Not Found',
        salary: salMatch ? salMatch[0] : 'Not Available',
        jobId: applyLink.match(/jobId=([^&]+)/i)?.[1] || code || 'Not Found'
      };
    }
  } catch (e) { }

  // Workday detail
  try {
    const wdT = document.querySelector('[data-automation-id="jobPostingHeader"]')?.innerText?.trim();
    if (wdT) {
      let wdSalary = 'Not Available';
      const payRangeMatch = fullText.match(/pay range.*?\$[\d,]+\s*to\s*\$[\d,]+/i);
      if (payRangeMatch) {
        wdSalary = payRangeMatch[0];
      } else {
        const sl = [...document.querySelectorAll('p, span')].map(el => el.innerText).find(t => t && t.toLowerCase().includes('pay range') && /\$/.test(t));
        if (sl) wdSalary = sl;
      }
      return {
        title: wdT,
        location: (document.querySelector('[data-automation-id="location"]') || document.querySelector('[data-automation-id="locations"]'))?.innerText?.trim() || 'Not Found',
        company: document.querySelector('[data-automation-id="company"]')?.innerText?.trim() || document.querySelector('meta[property="og:site_name"]')?.content || 'Not Found',
        date: document.querySelector('[data-automation-id="postedOn"]')?.innerText?.trim() || 'Not Found',
        description: document.querySelector('[data-automation-id="jobPostingDescription"]')?.innerText?.trim() || fullText.slice(0, 3000),
        applyLink: document.querySelector('a[href*="apply"]')?.href || window.location.href,
        experience: fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[0] || 'Not Found',
        salary: wdSalary,
        jobId: window.location.pathname.match(/\/(\d{5,}|[A-Z0-9_-]{6,})(?:[\/?#]|$)/)?.[1] || 'Not Found'
      };
    }
  } catch (e) { }

  // Siemens detail
  try {
    const siemensFields = [...document.querySelectorAll('.article__content__view__field')];
    if (siemensFields.length > 0 && window.location.href.toLowerCase().includes('siemens.com')) {
      const getField = (labelText) => {
        const field = siemensFields.find(f =>
          f.querySelector('.article__content__view__field__label')?.innerText?.trim().toLowerCase() === labelText.toLowerCase()
        );
        return field?.querySelector('.article__content__view__field__value')?.innerText?.trim() || '';
      };
      const dateVal = getField('Posted since');
      const descEl = document.querySelector('#section1__content .article__content__view__field__value');
      const desc = descEl?.innerText?.trim() || descEl?.textContent?.trim() || '';
      const jobIdVal = getField('Job ID');
      if (dateVal || jobIdVal) {
        // Extract salary from full page text
        let siemensSalary = 'Not Available';
        const salPatterns = [
          /\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+(?:\.\d+)?(?:\s*(?:per\s+(?:hour|hr|year|annum)|\/?(?:hour|hr|year|annum|annually)))?/i,
          /AED\s*[\d,]+(?:\s*[-–]\s*(?:AED)?\s*[\d,]+)?/i,
          /(?:₹|INR)\s*[\d,]{4,}(?:\s*[-–]\s*(?:₹|INR)?\s*[\d,]+)?(?:\s*(?:LPA|lakh))?/i,
          /[£€]\s*[\d,]+(?:\s*[-–]\s*[£€]?\s*[\d,]+)?/i,
        ];
        for (const pat of salPatterns) {
          const sm = fullText.match(pat);
          if (sm) { siemensSalary = sm[0].trim(); break; }
        }
        return {
          title: document.querySelector('.section__header__text__title, h1')?.innerText?.trim() || 'Not Found',
          location: document.querySelector('.list--locations .list__item')?.innerText?.trim() || getField('Location(s)') || 'Not Found',
          company: getField('Company') || 'Siemens',
          date: dateVal || 'Not Found',
          description: desc || 'Not Found',
          applyLink: window.location.href,
          experience: getField('Experience level') || 'Not Found',
          salary: siemensSalary,
          jobId: jobIdVal || '',
        };
      }
    }
  } catch (e) { }

  // Bajaj Auto detail
  try {
    if (window.location.href.toLowerCase().includes('bajajauto.com')) {
      // Date: "- Posted\n18/02/2025" or "Posted\n18/02/2025" pattern
      const dateMatch = fullText.match(/[-–]?\s*Posted\s*[\n\r]+\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i)
        || fullText.match(/Posted\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
      const dateVal = dateMatch ? dateMatch[1].trim() : '';

      // Job ID from URL e.g. /careers/job/title/12647
      const jobIdMatch = window.location.pathname.match(/\/(\d{4,})\/?$/);
      const jobIdVal = jobIdMatch ? jobIdMatch[1] : '';

      // Description: everything from "Job Description" heading onward, excluding nav noise
      let descVal = '';
      const allPs = [...document.querySelectorAll('p')];
      const jobDescP = allPs.find(p => /Job Description/i.test(p.innerText));
      if (jobDescP) {
        let node = jobDescP;
        const parts = [];
        while (node) {
          const t = node.innerText?.trim();
          if (t && !/Copyright.*Bajaj/i.test(t)) parts.push(t);
          node = node.nextElementSibling;
        }
        descVal = parts.join('\n').trim();
      }
      if (!descVal) {
        const mainP = allPs.find(p => p.innerText?.includes('Requisition ID') || p.innerText?.includes('Job Title:'));
        if (mainP) descVal = mainP.innerText.trim();
      }

      const titleEl = document.querySelector('h1, h2, .job-title, [class*="title"]');
      const titleVal = titleEl?.innerText?.trim() || '';

      if (dateVal || jobIdVal) {
        return {
          title: titleVal || 'Not Found',
          location: fullText.match(/[-–,]\s*((?:[A-Za-z]+\s*)+(?:,\s*India|India))/i)?.[1]?.trim() || 'India',
          company: 'Bajaj Auto',
          date: dateVal || 'Not Found',
          description: descVal || 'Not Found',
          applyLink: window.location.href,
          experience: fullText.match(/Min:\s*(\d+)\s*Max:\s*(\d+)/i)
            ? `${fullText.match(/Min:\s*(\d+)/i)[1]}-${fullText.match(/Max:\s*(\d+)/i)[1]} Years`
            : (fullText.match(/(\d+\s*[-–]\s*\d+\s*Years?)/i)?.[0] || 'Not Found'),
          salary: 'Not Available',
          jobId: jobIdVal || 'Not Found',
        };
      }
    }
  } catch (e) { }

  // Title
  let title = getText(['h1.job-title', 'h1[itemprop=\"title\"]', '.job-details__title', 'h4.display-2', '.text-3xl.font-bold', 'span[itemprop=\"title\"][data-careersite-propertyid=\"title\"]', '[data-careersite-propertyid=\"title\"]', '.job__title h1', '.app-title', '.posting-headline h2', '.jobTitle', 'h1 span[itemprop=\"title\"]', 'h1', '[data-test=\"job-title\"]', '[class*=\"job-title\"]', '[id*=\"job-title\"]', '[itemprop=\"title\"]', '.careers-title', '.role-title', '.jd-title', '.job-header__title', '.header-title', '[data-automation=\"job-title\"]', '[data-ph-at-id=\"job-title\"]', '.job-title--h1', '[aria-label=\"Job title\"]', 'meta[property=\"og:title\"]', 'meta[name=\"twitter:title\"]']);

  if (title && (title.includes('Internet Explorer') || title.includes('no longer supported'))) {
    title = '';
  }

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

  if (!title) {
    const ldTitle = ld?.title || ld?.name || '';
    if (ldTitle && !(ldTitle.includes('Internet Explorer') || ldTitle.includes('no longer supported'))) {
      title = ldTitle;
    }
  }
  if (!title) {
    const ogTitle = document.querySelector('meta[property=\"og:title\"]')?.content?.trim() || '';
    if (ogTitle && !(ogTitle.includes('Internet Explorer') || ogTitle.includes('no longer supported'))) {
      title = ogTitle;
    }
  }
  if (!title) {
    const docTitle = document.title?.split(/[|\-]/)[0]?.trim() || '';
    if (docTitle && !(docTitle.includes('Internet Explorer') || docTitle.includes('no longer supported'))) {
      title = docTitle;
    }
  }

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

  if (!title) [...document.querySelectorAll('p,li,span,td,h2,h3')].some(el => { const t = el.innerText?.trim(); if (t?.startsWith('Position:')) { title = t.replace(/^Position:/i, '').trim(); return true; } });

  // Location + Company
  let location = '', company = '';
  const cityText = getText(['.jobCity']);
  if (cityText) { const p = cityText.split(','); location = p[0]?.trim(); company = p[1]?.trim(); }
  if (!location) location = getByLabel('Job Location') || getText(['posting-locations', '.job-details__subtitle', '.user_info p', '[data-careersite-propertyid=\"city\"]', '[data-careersite-propertyid=\"location\"]', '.job__location div', '.location', '.job-location', '.jobGeoLocation', '.posting-categories .location', '[data-test=\"location\"]', '[itemprop=\"jobLocation\"]', '[class*=\"location\"]', 'address', '[data-automation=\"job-location\"]', '[data-ph-at-id=\"location\"]', '.job-location__city', '.location-name', '.city-state', '[aria-label=\"Job location\"]', '.work-location', '.office-location', '.position-location', '[class*=\"job-city\"]', '[class*=\"job-region\"]']);
  if (!location && ld) location = ld.jobLocation?.address?.addressLocality || ld.jobLocation?.address?.addressRegion || ld.jobLocation?.name || '';
  if (!location) [...document.querySelectorAll('p,li,span,td')].some(el => { const t = el.innerText?.trim(); if (t?.match(/^Location:/i)) { location = t.replace(/^Location:/i, '').trim(); return true; } });

  if (!company) company = getText(['[data-careersite-propertyid=\"businessunit\"]', '[data-careersite-propertyid=\"customfield3\"]', '[data-careersite-propertyid=\"customfield1\"]', '.company', '.posting-company', '[itemprop=\"hiringOrganization\"]', '[class*=\"company-name\"]', '.employer-name', '.org-name', '[data-test=\"company-name\"]', '[data-automation=\"company-name\"]', '.company__name', '.employer', '.organization-name', '[class*=\"employer\"]', '[aria-label=\"Company name\"]', '.brand-name', '.recruiter-name', '.client-name', '[class*=\"company\"]', 'meta[property=\"og:site_name\"]', '[name=\"author\"]']);
  if (!company && ld) company = ld.hiringOrganization?.name || ld.organizer?.name || '';
  if (!company) company = document.querySelector('meta[property=\"og:site_name\"]')?.content?.trim() || '';
  if (!company) company = getByLabel('Company') || getByLabel('Hiring Organization');
  if (!company) [...document.querySelectorAll('p,li,span,td')].some(el => { const t = el.innerText?.trim(); if (t?.match(/^Company:/i)) { company = t.replace(/^Company:/i, '').trim(); return true; } });

  if (!company && window.location.href.includes('darwinbox.')) {
    const hostname = window.location.hostname;
    company = hostname.split('.')[0];
    if (company) {
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }
  }

  // Date
  let date = getText(['[data-careersite-propertyid=\"date\"]', '[itemprop=\"datePosted\"]', '[class*=\"posted-date\"]', '[class*=\"post-date\"]', '[class*=\"date-posted\"]', '.posting-date', '[data-test=\"posted-date\"]', '[data-automation=\"date-posted\"]', 'time', '[datetime]', '.date', '[class*=\"publish\"]', '.updated-date', '.created-date', '[class*=\"listing-date\"]', '[class*=\"job-posted\"]', '.closingDate', '[class*=\"closing-date\"]', '[class*=\"expiry\"]']);
  if (!date) {
    const metaItems = [...document.querySelectorAll('.job-meta__item')];
    const dateItem = metaItems.find(item => item.querySelector('.job-meta__title')?.innerText?.trim().toLowerCase() === 'posting date');
    if (dateItem) date = dateItem.querySelector('.job-meta__subitem')?.innerText?.trim() || '';
  }
  if (!date || date.toLowerCase().includes('date')) date = getByLabel('Posted') || getByLabel('Date posted') || getByLabel('Date') || getByLabel('Posting Date');
  if (!date) date = document.querySelector('meta[itemprop=\"datePosted\"]')?.content || document.querySelector('[itemprop=\"datePosted\"]')?.getAttribute('datetime') || document.querySelector('time')?.getAttribute('datetime') || '';
  if (!date && ld) date = ld.datePosted || ld.validThrough || '';
  if (!date) date = fullText.match(/Posted\s*(?:on|date)?\s*[:\-]?\s*([A-Za-z]+\s+[A-Za-z]+\s+\d{1,2},?\s*\d{4}|[A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i)?.[1] || '';

  // Description
  let category = getByLabel('Job Category') || getByLabel('Department');
  let jobType = getByLabel('Job Type') || getByLabel('Employee Type');
  let description = getText(['.p-htmlviewer', '#cw-rich-description', '.cw-jobdescription', '.job-description-container', '.job-summary', '.box.p-24', '.ql-editor', '.mjp-job-ad__content', '.ats-description', '.main-jd-body', '.job__description', '#content .content', '.jobdescription', '.fr-view', '[itemprop=\"description\"]', '.job-description', '.description', '#job-description', '[data-test=\"job-description\"]', '[data-automation=\"jobAdDetails\"]', '.job-details__description', '.posting-description', '.jd-desc', '.job-body', '.content-description', 'article']);
  if (!description) description = getAllText('.mjp-show-more__content');
  if (!description) description = getAllText('.text5');

  let finalDesc = '';
  if (category) finalDesc += `Category: ${category}\n`;
  if (jobType) finalDesc += `Type: ${jobType}\n`;
  if (finalDesc) finalDesc += `\n`;
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

  if (!applyLink) {
    const btn = document.querySelector('[data-tag=\"applyNowBtn\"]') ||
      document.querySelector('button[aria-label=\"Apply\"]') ||
      document.querySelector('button[class*=\"apply\"]') ||
      [...document.querySelectorAll('button')].find(b => b.innerText.toLowerCase().includes('apply'));
    applyLink = btn ? 'Apply button (JS trigger)' : 'Not Found';
  }

  // Experience
  let experience = getByLabel('Experience range (Years)') || '';
  if (!experience) {
    const m = fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?)(\s+of(\s+relevant)?\s+experience)?)/i);
    if (m) {
      const yrs = parseInt(m[1], 10);
      if (yrs < 35) experience = m[0];
    }
  }
  if (!experience) experience = getText(['.experience-range p', '[data-careersite-propertyid=\"experience\"]', '[class*=\"experience\"]', '[data-test=\"experience\"]', '.job-experience', '.experience-level', '[itemprop=\"experienceRequirements\"]', '.years-experience', '[class*=\"exp-level\"]', '[class*=\"exp-years\"]']);
  if (!experience && ld) experience = ld.experienceRequirements?.monthsOfExperience ? `${Math.round(ld.experienceRequirements.monthsOfExperience / 12)} years` : String(ld.experienceRequirements || '');
  if (!experience) [...document.querySelectorAll('p,li,span,td,dt,dd')].some(el => { const t = el.innerText?.trim(); if (t?.match(/^Experience\s*:/i)) { experience = t.replace(/^Experience\s*:/i, '').trim(); return true; } });
  if (!experience) {
    const m = fullText.match(/(\d+\+?)\s+years?\s+of\s+(work\s+)?(experience|exp\.?)/i);
    if (m && parseInt(m[1], 10) < 35) experience = m[0];
  }
  if (!experience) {
    const m = fullText.match(/minimum\s+(\d+\+?)\s+years?/i);
    if (m && parseInt(m[1], 10) < 35) experience = m[0];
  }
  if (!experience) {
    const m = fullText.match(/at\s+least\s+(\d+\+?)\s+years?/i);
    if (m && parseInt(m[1], 10) < 35) experience = m[0];
  }
  if (!experience) {
    const m = fullText.match(/(\d+\+)\s*years?/i);
    if (m && parseInt(m[1], 10) < 35) experience = m[0];
  }
  if (!experience && /fresher|entry[\s-]level|0[\s-]?\d?\s*years?/i.test(fullText)) experience = 'Fresher / Entry Level';
  if (!experience) experience = fullText.match(/\b(junior|mid[\s-]?level|senior|lead|principal|staff)\b/i)?.[0] || '';
  if (!experience) {
    const m = (document.querySelector('meta[name=\"description\"]')?.content || '').match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i);
    if (m && parseInt(m[1], 10) < 35) experience = m[0];
  }
  if (!experience) {
    const m = fullText.match(/\bExp[:\s]+(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i);
    if (m && parseInt(m[1], 10) < 35) experience = m[1];
  }

  // Salary
  let salary = '';
  const cleanSalaryText = fullText
    .replace(/(?:sales|revenue|turnover|generated|market cap|funding|raised)\s+(?:of\s+)?(?:[\$\u20ac\u00a3\u20b9]|INR|USD|EUR|GBP|Rs\.?)?\s*[\d,.]+\s*(?:billion|million|bn|m)?\b/gi, '')
    .replace(/(?:[\$\u20ac\u00a3\u20b9]|INR|USD|EUR|GBP|Rs\.?)\s*[\d,.]+\s*(?:billion|million|bn|m)\b/gi, '')
    .replace(/match up to \$[0-9,]+[^.]*for money raised/gi, '');

  const sl = [...document.querySelectorAll('p, li, div')].map(p => p.innerText?.trim()).find(t => t && t.toLowerCase().includes('pay range') && /[\$\u20ac\u00a3\u20b9\d]/.test(t));
  if (sl) salary = sl;

  if (!salary) salary = getText(['[data-careersite-propertyid=\"salary\"]', '[class*=\"salary\"]', '[itemprop=\"baseSalary\"]', '.compensation', '[class*=\"compensation\"]', '.pay-range', '[data-test=\"salary\"]', '[class*=\"pay-\"]', '.stipend', '[class*=\"stipend\"]', '.ctc', '[class*=\"ctc\"]']);
  if (!salary && ld?.baseSalary) {
    const bs = ld.baseSalary;
    if (bs.value?.minValue && bs.value?.maxValue) {
      const minV = Number(bs.value.minValue);
      const maxV = Number(bs.value.maxValue);
      if (!(minV === 1 && maxV === 1000000)) {
        salary = `${bs.currency || ''} ${bs.value.minValue} - ${bs.value.maxValue} (${bs.value.unitText || ''})`;
      }
    } else if (bs.value?.value) {
      salary = `${bs.currency || ''} ${bs.value.value} (${bs.value.unitText || ''})`;
    }
  }
  if (!salary) [...document.querySelectorAll('p,li,span,td,dt,dd')].some(el => { const t = el.innerText?.trim(); if (t?.match(/^Salary\s*:/i)) { salary = t.replace(/^Salary\s*:/i, '').trim(); return true; } });
  if (!salary) salary = cleanSalaryText.match(/[\d.]+\s*(to|-)?\s*[\d.]*\s*(LPA|Lakh|Lac|CTC)/gi)?.[0] || '';
  if (!salary) salary = cleanSalaryText.match(/[Uu]p\s*to\s+(?:(?:\$|\u20b9|\bRs\.?|\bINR)\s*\d[\d,]*|\d[\d,]*\s*(?:K|L|LPA|Lakh|lakhs))/i)?.[0] || '';
  if (!salary) [...document.querySelectorAll('p,li,td,span')].some(el => { const t = el.innerText?.trim().toLowerCase(); if (t?.includes('salary range') || t?.includes('total compensation')) { salary = el.innerText.trim(); return true; } });
  if (!salary) salary = 'Not Available';

  // Job ID
  let jobId = getByLabel('Job ID') || getByLabel('Job number') || fullText.match(/Job\s+requisition\s+ID\s*::?\s*(\S+)/i)?.[1] || fullText.match(/Job\s*I[Dd][:\s#]*(\S+)/i)?.[1] || fullText.match(/Req(?:uisition)?\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1] || '';
  if (!jobId) { const m = window.location.pathname.match(/\/(\d{5,})/); jobId = m?.[1] || ''; }
  if (!jobId) { const p = new URLSearchParams(window.location.search); jobId = p.get('jobId') || p.get('id') || p.get('job_id') || p.get('jid') || ''; }
  if (!jobId) jobId = getText(['[data-careersite-propertyid=\"adcode\"]', '[data-careersite-propertyid=\"jobid\"]', '[class*=\"job-id\"]', '[class*=\"jobid\"]', '[data-test=\"job-id\"]', '[data-job-id]', '[id*=\"job-id\"]', '.req-id', '[class*=\"req-id\"]', '.reference-id', '[class*=\"reference\"]']);
  if (!jobId) jobId = document.querySelector('[data-job-id]')?.getAttribute('data-job-id') || '';
  if (!jobId && ld) jobId = ld.identifier?.value || String(ld.identifier || '') || '';
  if (!jobId) jobId = fullText.match(/Ref(?:erence)?\s*(?:No|#|ID)[:\s]*(\S+)/i)?.[1] || '';
  if (!jobId) jobId = fullText.match(/Position\s*ID[:\s]*(\S+)/i)?.[1] || '';
  if (!jobId) jobId = fullText.match(/Opening\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1] || '';
  if (!jobId) jobId = fullText.match(/Vacancy\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1] || '';

  return {
    title: title || 'Not Found',
    location: location || 'Not Found',
    company: company || 'Not Found',
    date: date || 'Not Found',
    description: description || 'Not Found',
    applyLink: applyLink || 'Not Found',
    experience: experience || 'Not Found',
    salary: salary || 'Not Available',
    jobId: jobId || 'Not Found',
  };
}


// ════════════════════════════════════════════════════════════════════════════
// 🏗️  WORLEY
// Site: jobs.worley.com
// Selector: [data-test-id="job-listing"]
// ════════════════════════════════════════════════════════════════════════════
async function scrapeWorley(page, context, listingUrl, results) {
  let pageNum = 1;
  while (true) {
    console.log(`  📄 Worley Page ${pageNum}...`);
    await page.waitForSelector('[data-test-id="job-listing"]', { timeout: 35000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-test-id="job-listing"]')];
      return cards.map(card => {
        const a = card.querySelector('a[href*="/careers/job/"]');
        const titleEl = card.querySelector('.title-1aNJK');
        const locEl = card.querySelector('.fieldValue-3kEar');

        return {
          title: titleEl?.innerText?.trim() || a?.innerText?.trim() || 'Not Found',
          location: locEl?.innerText?.trim() || 'Not Found',
          detailUrl: a ? new URL(a.getAttribute('href'), window.location.origin).href : '',
        };
      }).filter(j => j.detailUrl);
    });

    console.log(`     ↳ Worley: ${jobLinks.length} jobs`);
    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'worley', results, { company: 'Worley' });
      await delay(500);
    }

    if (results.length >= MAX_JOBS) break;

    if (pageNum >= 3) { console.log(`  🛑 Worley limit reached — stopping at ${pageNum} pages`); break; }

    // Handle pagination
    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('button[aria-label="Next jobs"]');
      if (nextBtn && !nextBtn.disabled && nextBtn.getAttribute('aria-disabled') !== 'true') {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ Worley done — ${pageNum} pages`);
      break;
    }

    await page.waitForTimeout(4000);
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏢  KBR — PeopleHub (ph-search-results-v2) platform
// Site: careers.kbr.com
// Selector: li.jobs-list-item
// ════════════════════════════════════════════════════════════════════════════
async function scrapeKbr(page, context, listingUrl, results) {
  // Dynamic company name based on URL
  let companyName = 'KBR';
  if (listingUrl.includes('careers.philips.com')) companyName = 'Philips';
  if (listingUrl.includes('pgcareers.com')) companyName = 'Procter & Gamble';

  let pageNum = 1;
  const seenUrls = new Set();

  while (true) {
    console.log(`  📄 ${companyName} Page ${pageNum}...`);

    // Wait for at least one job card to appear
    await page.waitForSelector('li.jobs-list-item', { timeout: 40000 }).catch(() => { });
    await page.waitForTimeout(2000);

    // ── Extract all job cards on current page ──
    const jobLinks = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('li.jobs-list-item')];
      return cards.map(card => {
        // Title + detail URL
        const anchor = card.querySelector('a[data-ph-at-id="job-link"]') || card.querySelector('a[href*="/job/"]');
        const title = anchor?.getAttribute('data-ph-at-job-title-text')
          || anchor?.querySelector('.job-title span')?.innerText?.trim()
          || anchor?.innerText?.trim()
          || 'Not Found';
        const detailUrl = anchor?.href || '';

        // Location
        const location = anchor?.getAttribute('data-ph-at-job-location-area-text')
          || card.querySelector('.job-location')?.innerText?.replace('Location', '').trim()
          || '';

        // Category
        const category = anchor?.getAttribute('data-ph-at-job-category-text')
          || card.querySelector('.job-category')?.innerText?.replace('Category', '').trim()
          || '';

        // Job ID
        const jobId = anchor?.getAttribute('data-ph-at-job-id-text')
          || card.querySelector('.jobId span:last-child')?.innerText?.trim()
          || '';

        // Posted Date (ISO from attr → readable)
        const rawDate = anchor?.getAttribute('data-ph-at-job-post-date-text') || '';
        const date = rawDate
          ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : card.querySelector('.job-postdate')?.innerText?.replace('Posted Date', '').trim() || '';

        // Job type
        const jobType = anchor?.getAttribute('data-ph-at-job-type-text')
          || card.querySelector('.type span:last-child')?.innerText?.trim()
          || '';

        // Teaser description (listing page snippet)
        const teaser = card.querySelector('.job-description')?.innerText?.trim() || '';

        // Apply URL
        const applyAnchor = card.querySelector('a[data-ph-at-id="apply-link"]');
        const applyLink = applyAnchor?.href || detailUrl;

        return { title, detailUrl, location, category, jobId, date, jobType, teaser, applyLink };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    });

    console.log(`     ↳ ${companyName}: ${jobLinks.length} jobs on page ${pageNum}`);

    let newOnPage = 0;
    for (const job of jobLinks) {
      const linkKey = job.applyLink || job.detailUrl;
      if (seenUrls.has(linkKey)) continue;
      seenUrls.add(linkKey);
      newOnPage++;

      if (results.length >= MAX_JOBS) break;

      console.log(`    🔎 ${job.title} | ${job.location} | ${job.jobId}`);

      // Visit detail page to get full description
      let description = job.teaser;
      let salary = 'Not disclosed';
      let experience = '';

      if (job.detailUrl) {
        const detailPage = await context.newPage();
        try {
          await detailPage.goto(job.detailUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await detailPage.waitForTimeout(3000);
          await detailPage.waitForLoadState('networkidle').catch(() => { });

          const detail = await detailPage.evaluate(() => {
            // Full description section
            const descEl = document.querySelector(
              '[data-ph-at-id="job-description"], .job-description-main, .ats-description, ' +
              '[class*="job-description"], .phj-jobad-description, section.ph-description'
            );
            let desc = descEl?.innerText?.trim() || document.body?.innerText?.slice(0, 2000) || '';

            // Try JSON-LD
            try {
              const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}');
              if (ld.description) desc = ld.description.replace(/<[^>]+>/g, ' ').trim();
            } catch (_) { }

            // Experience from description text
            const expMatch = desc.match(/(\d+\+?\s*(years|yrs|year))/i);
            const experience = expMatch ? expMatch[0] : '';

            // Salary hints
            const salaryMatch = desc.match(/(?:salary|ctc|compensation|pay)[^\n]{0,80}/i);
            const salary = salaryMatch ? salaryMatch[0].trim() : 'Not disclosed';

            return { description: desc.slice(0, 3000), experience, salary };
          });

          description = detail.description || job.teaser;
          experience = detail.experience || '';
          salary = detail.salary || 'Not disclosed';
        } catch (err) {
          console.log(`      ⚠️  Detail page failed: ${err.message}`);
        } finally {
          await detailPage.close();
        }
      }

      results.push({
        title: job.title,
        company: companyName,
        location: job.location,
        category: job.category,
        jobType: job.jobType,
        date: job.date,
        jobId: job.jobId,
        description: description.slice(0, 3000),
        experience,
        salary,
        url: job.applyLink || job.detailUrl,
        applyLink: job.applyLink || job.detailUrl,
        source: `${companyName} Careers`,
      });
      // 💾 Turant filtered save
      saveJobsNow(results);

      await delay(600);
    }

    if (newOnPage === 0) {
      console.log(`  ✅ ${companyName} done — no new jobs on page ${pageNum}.`);
      break;
    }

    if (results.length >= MAX_JOBS) {
      console.log(`  🛑 ${companyName}: MAX_JOBS (${MAX_JOBS}) reached, stopping.`);
      break;
    }

    if (pageNum >= 20) { console.log(`  🛑 ${companyName} limit reached — stopping at ${pageNum} pages`); break; }

    // ── Pagination — click the Next button ──
    const hasNext = await page.evaluate(() => {
      const nextBtn = (
        document.querySelector('[data-ph-at-id="pagination-next-link"]') ||
        document.querySelector('button[ph-tevent="next_page"]') ||
        document.querySelector('a[ph-tevent="next_page"]') ||
        document.querySelector('button[aria-label*="Next page" i]') ||
        document.querySelector('button[aria-label*="next" i]') ||
        document.querySelector('a[aria-label*="Next page" i]') ||
        document.querySelector('a[aria-label*="next" i]') ||
        document.querySelector('[class*="pager"] button:last-child') ||
        document.querySelector('.phs-pagination button:last-child') ||
        document.querySelector('.phs-pagination a:last-child') ||
        document.querySelector('[data-ph-at-id="next-page-link"]') ||
        document.querySelector('li.next:not(.disabled) a') ||
        document.querySelector('li.next:not(.disabled) button') ||
        [...document.querySelectorAll('button, a[role="button"]')].find(b =>
          /^next$/i.test(b.innerText?.trim()) || /next\s*page/i.test(b.innerText?.trim())
        )
      );
      if (nextBtn) {
        const isDisabled = nextBtn.disabled ||
          nextBtn.getAttribute('aria-disabled') === 'true' ||
          nextBtn.classList.contains('disabled') ||
          nextBtn.closest('li')?.classList.contains('disabled');
        if (!isDisabled) {
          nextBtn.scrollIntoView();
          nextBtn.click();
          return true;
        }
      }
      return false;
    });
    if (hasNext) console.log(`  ➡️ Next page clicked — waiting for page ${pageNum + 1}...`);

    if (!hasNext) {
      console.log(`  ✅ ${companyName} done — ${pageNum} page(s) scraped.`);
      break;
    }

    await page.waitForTimeout(5000); // wait for next page to render
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🟣  Titan Careers (Phenom People ATS)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTitan(page, context, listingUrl, results) {
  let pageNum = 1;

  while (true) {
    console.log(`  📄 Titan Page ${pageNum}...`);

    // Wait for job cards
    await page.waitForSelector('li.jobs-list-item', { timeout: 40000 }).catch(() => { });
    await page.waitForTimeout(2000);

    // ── Extract all job cards on current page ──
    const jobLinks = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('li.jobs-list-item')];
      return cards.map(card => {
        const anchor = card.querySelector('a[data-ph-at-id="job-link"]');
        const title = anchor?.getAttribute('data-ph-at-job-title-text')
          || anchor?.querySelector('.job-title span')?.innerText?.trim()
          || 'Not Found';
        const detailUrl = anchor?.href || '';
        const location = anchor?.getAttribute('data-ph-at-job-location-area-text')
          || card.querySelector('.job-location')?.innerText?.replace('Location', '').trim()
          || '';
        const category = anchor?.getAttribute('data-ph-at-job-category-text')
          || card.querySelector('.job-category')?.innerText?.replace('Category', '').trim()
          || '';
        const jobId = anchor?.getAttribute('data-ph-at-job-id-text') || '';
        const rawDate = anchor?.getAttribute('data-ph-at-job-post-date-text') || '';
        const date = rawDate
          ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';
        const jobType = anchor?.getAttribute('data-ph-at-job-type-text') || '';
        const teaser = card.querySelector('.job-description')?.innerText?.trim() || '';
        const applyAnchor = card.querySelector('a[data-ph-at-id="apply-link"]');
        const applyLink = applyAnchor?.href || detailUrl;
        return { title, detailUrl, location, category, jobId, date, jobType, teaser, applyLink };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    });

    console.log(`     ↳ Titan Page ${pageNum}: ${jobLinks.length} jobs`);

    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      console.log(`    🔎 ${job.title} | ${job.location} | ${job.jobId}`);

      let description = job.teaser;
      let salary = 'Not disclosed';
      let experience = '';

      if (job.detailUrl) {
        const detailPage = await context.newPage();
        try {
          await detailPage.goto(job.detailUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await detailPage.waitForTimeout(3000);
          await detailPage.waitForLoadState('networkidle').catch(() => { });

          const detail = await detailPage.evaluate(() => {
            const descEl = document.querySelector(
              '[data-ph-at-id="job-description"], .job-description-main, .ats-description, ' +
              '[class*="job-description"], .phj-jobad-description, section.ph-description'
            );
            let desc = descEl?.innerText?.trim() || document.body?.innerText?.slice(0, 2000) || '';
            try {
              const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}');
              if (ld.description) desc = ld.description.replace(/<[^>]+>/g, ' ').trim();
            } catch (_) { }
            const expMatch = desc.match(/(\d+\+?\s*(years|yrs|year))/i);
            const experience = expMatch ? expMatch[0] : '';
            const salaryMatch = desc.match(/(?:salary|ctc|compensation|pay)[^\n]{0,80}/i);
            const salary = salaryMatch ? salaryMatch[0].trim() : 'Not disclosed';
            return { description: desc.slice(0, 3000), experience, salary };
          });

          description = detail.description || job.teaser;
          experience = detail.experience || '';
          salary = detail.salary || 'Not disclosed';
        } catch (err) {
          console.log(`      ⚠️  Detail page failed: ${err.message}`);
        } finally {
          await detailPage.close();
        }
      }

      results.push({
        title: job.title,
        company: 'Titan Company',
        location: job.location,
        category: job.category,
        jobType: job.jobType,
        date: job.date,
        jobId: job.jobId,
        description: description.slice(0, 3000),
        experience,
        salary,
        url: job.detailUrl,
        applyLink: job.detailUrl,
        source: 'Titan Careers',
      });

      await delay(600);
    }

    if (results.length >= MAX_JOBS) {
      console.log(`  🛑 Titan: MAX_JOBS (${MAX_JOBS}) reached, stopping.`);
      break;
    }

    // ── Pagination — click the Next <a> link ──
    const hasNext = await page.evaluate(() => {
      const nextLink = (
        document.querySelector('a[data-ph-at-id="pagination-next-link"]') ||
        document.querySelector('[data-ph-at-id="pagination-block"] a[aria-label*="next" i]') ||
        document.querySelector('.pagination-block a[aria-label*="next" i]') ||
        [...document.querySelectorAll('.pagination a')].find(a => /next/i.test(a.innerText || a.getAttribute('aria-label') || ''))
      );
      if (nextLink && !nextLink.classList.contains('disabled') && getComputedStyle(nextLink).display !== 'none') {
        nextLink.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ Titan done — all ${pageNum} page(s) scraped.`);
      break;
    }

    await page.waitForTimeout(5000);
    pageNum++;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// ⚙️  JABIL CAREERS
// Site: careers.jabil.com
// Selector: .job-card
// ════════════════════════════════════════════════════════════════════════════
async function scrapeJabil(page, context, listingUrl, results) {
  await page.waitForSelector('.job-card, .job-list', { timeout: 30000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.job-card')];
    return cards.map(card => {
      const titleEl = card.querySelector('.container-position h4, h4');
      const title = titleEl?.innerText?.trim() || 'Not Found';
      const a = card.querySelector('a.call-to-action, a');
      const detailUrl = a?.href || '';
      const reqIdEl = card.querySelector('p.position-id');
      const reqIdText = reqIdEl?.innerText?.trim() || '';
      const jobId = reqIdText.replace(/Req ID:\s*/i, '').trim();

      // Find Location, Category, Posted, Time Type from .wrapper-items
      let location = 'India';
      let category = 'Not Found';
      let postedDate = '';
      let timeType = 'Full time';

      const items = [...card.querySelectorAll('.wrapper-items')];
      for (const item of items) {
        const titleItem = item.querySelector('.job-title-item')?.innerText?.trim() || '';
        const contentItem = item.querySelector('.job-content-item')?.innerText?.trim() || '';

        if (/location/i.test(titleItem)) {
          location = contentItem;
          if (location && !location.toLowerCase().includes('india')) {
            location += ', India';
          }
        } else if (/category/i.test(titleItem)) {
          category = contentItem;
        } else if (/posted/i.test(titleItem)) {
          postedDate = contentItem;
        } else if (/time/i.test(titleItem)) {
          timeType = contentItem;
        }
      }

      return {
        title,
        location,
        category,
        date: postedDate,
        jobId,
        detailUrl,
      };
    }).filter(j => j.detailUrl && j.title !== 'Not Found');
  });

  console.log(`  ↳ Jabil: Found ${jobLinks.length} jobs`);
  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    console.log(`    🔎 ${job.title} [${job.location}]`);
    await visitDetailPage(context, job, 'jabil', results, { company: 'Jabil' });
    await delay(400);
  }
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

// ════════════════════════════════════════════════════════════════════════════
// 🏗️  ARAYMOND
// ════════════════════════════════════════════════════════════════════════════
async function scrapeARaymond(page, context, listingUrl, results) {
  let pageNum = 0;
  while (true) {
    console.log(`  📄 ARaymond Page ${pageNum + 1}...`);
    await page.waitForSelector('.node-offer.teaser', { timeout: 35000 }).catch(() => { });
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const articles = [...document.querySelectorAll('article.node-offer.teaser')];
      return articles.map(art => {
        const titleA = art.querySelector('.title h3 a');
        const title = titleA ? titleA.textContent.trim() : 'Not Found';
        let detailUrl = titleA ? titleA.getAttribute('href') : '';
        if (detailUrl && !detailUrl.startsWith('http')) {
          detailUrl = window.location.origin + detailUrl;
        }

        let loc = 'Not Found';
        let dept = 'Not Found';
        const details = [...art.querySelectorAll('.card-details div')];
        details.forEach(div => {
          const overline = div.querySelector('.overline')?.textContent?.trim().toLowerCase();
          const span = div.querySelector('span:not(.overline)')?.textContent?.trim();
          if (overline && span) {
            if (overline.includes('where')) {
              loc = span;
            } else if (overline.includes('job function')) {
              dept = span;
            }
          }
        });

        return {
          title,
          location: loc,
          detailUrl,
          department: dept
        };
      }).filter(j => j.detailUrl);
    });

    console.log(`     ↳ ARaymond: ${jobLinks.length} jobs`);
    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'araymond', results, { company: 'ARaymond' });
      await delay(500);
    }

    if (results.length >= MAX_JOBS) break;

    const nextUrl = await page.evaluate(() => {
      const nextBtn = document.querySelector('.pager-nav .pager__item--next a');
      if (nextBtn && nextBtn.href) {
        return nextBtn.href;
      }
      return null;
    });

    if (!nextUrl) {
      console.log(`  ✅ ARaymond done — ${pageNum + 1} pages`);
      break;
    }

    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    pageNum++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🏗️  MOKAHR
// ════════════════════════════════════════════════════════════════════════════
async function scrapeMokaHr(page, context, listingUrl, results) {
  let pageNum = 1;
  while (true) {
    console.log(`  📄 MokaHR Page ${pageNum}...`);
    await page.waitForSelector('[class*="container-aOp138AX_X"], [class*="card-BtpcjTxIfE"]', { timeout: 35000 }).catch(() => { });
    await page.waitForTimeout(3000);
    await autoScroll(page);

    const jobLinks = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[class*="container-aOp138AX_X"], [class*="card-BtpcjTxIfE"]')];
      return cards.map(card => {
        const a = card.querySelector('a');
        const titleEl = card.querySelector('[class*="title-u2qk9xX9Ie"]');
        const title = titleEl ? titleEl.textContent.trim() : (a ? a.textContent.trim() : 'Not Found');
        let detailUrl = a ? a.getAttribute('href') : '';
        if (detailUrl && detailUrl.startsWith('#')) {
          detailUrl = window.location.origin + window.location.pathname + detailUrl;
        } else if (detailUrl && !detailUrl.startsWith('http')) {
          detailUrl = window.location.origin + detailUrl;
        }

        const infoEl = card.querySelector('[class*="info-tPG_"]');
        let dept = 'Not Found';
        if (infoEl) {
          dept = infoEl.textContent.trim().replace(/\s*\|\s*/g, ' | ');
        }

        const locEl = card.querySelector('[class*="sd-foundation-body-primary-b0MG4"], [class*="mgt8-"]');
        const loc = locEl ? locEl.textContent.trim() : 'Not Found';

        return {
          title,
          location: loc,
          detailUrl,
          department: dept
        };
      }).filter(j => j.detailUrl);
    });

    console.log(`     ↳ MokaHR: ${jobLinks.length} jobs`);
    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'mokahr', results, { company: 'Tesla' });
      await delay(500);
    }

    if (results.length >= MAX_JOBS) break;

    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('button[class*="sd-Pagination-forward-"]');
      if (nextBtn && !nextBtn.disabled && nextBtn.getAttribute('aria-disabled') !== 'true') {
        nextBtn.click();
        return true;
      }
      return false;
    });

    if (!hasNext) {
      console.log(`  ✅ MokaHR done — ${pageNum} pages`);
      break;
    }

    await page.waitForTimeout(4000);
    pageNum++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🏗️  WORKLINE (BLUE STAR)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeWorkline(page, context, listingUrl, results) {
  console.log(`  📄 Workline listing...`);
  await page.waitForSelector('.jobs-wrapper', { timeout: 35000 }).catch(() => { });

  // Get target count from #jobcount (e.g., "Showing 358 Job(s)")
  const targetCount = await page.evaluate(() => {
    const el = document.getElementById('jobcount');
    if (el) {
      const match = el.textContent.match(/Showing\s+(\d+)\s+Job/i);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  });
  console.log(`     ↳ Target jobs to load: ${targetCount}`);

  // Scroll repeatedly until we load all target jobs or no more jobs load
  let lastCount = 0;
  let noChangeCount = 0;
  const maxLimit = Math.min(targetCount || 1000, MAX_JOBS);

  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500); // Wait for new items to load

    const currentCount = await page.locator('.jobs-wrapper').count();
    console.log(`     ↳ Loaded ${currentCount} / ${targetCount} jobs`);

    if (currentCount >= maxLimit) {
      break;
    }

    if (currentCount === lastCount) {
      noChangeCount++;
      if (noChangeCount >= 4) {
        break; // Stop if height/count doesn't change after multiple scroll attempts
      }
    } else {
      noChangeCount = 0;
    }
    lastCount = currentCount;
  }


  const jobLinks = await page.evaluate(() => {
    const wrappers = [...document.querySelectorAll('.jobs-wrapper')];
    return wrappers.map(w => {
      const a = w.querySelector('h6 a');
      const title = a ? a.textContent.trim() : 'Not Found';
      let detailUrl = a ? a.getAttribute('href') : '';
      if (detailUrl && !detailUrl.startsWith('http')) {
        detailUrl = window.location.origin + detailUrl;
      }

      let dept = 'Not Found';
      let loc = 'Not Found';
      let date = 'Not Found';

      const lis = [...w.querySelectorAll('.jobs-meta ul li')];
      lis.forEach(li => {
        const text = li.textContent.trim();
        if (li.querySelector('.fa-sitemap')) {
          dept = text;
        } else if (li.querySelector('.fa-map-marker')) {
          loc = text;
          if (loc && !loc.toLowerCase().includes('india') && loc !== 'Not Found') {
            loc += ', India';
          }
        } else if (li.querySelector('.fa-clock-o')) {
          date = text;
        }
      });

      return {
        title,
        location: loc,
        detailUrl,
        department: dept,
        date
      };
    }).filter(j => j.detailUrl);
  });

  console.log(`     ↳ Workline: ${jobLinks.length} jobs`);
  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'workline', results, { company: 'Blue Star' });
    await delay(500);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🏢  MPHASIS HOT JOBS
// Site: www2.mphasis.com/hot-jobs.html
// Structure: Static HTML page — .lpContentsItem.rawHtmlSpan contains all jobs
//            Each entry: colored <p> title (with optional job ID), PRIMARY SKILLS,
//            KEY SKILLS, EXPERIENCE, LOCATION, and an "APPLY NOW" ripplehire link
// ════════════════════════════════════════════════════════════════════════════
async function scrapeMphasis(page, context, listingUrl, results) {
  console.log(`  📄 Mphasis Hot Jobs listing...`);
  await page.waitForSelector('.lpContentsItem.rawHtmlSpan', { timeout: 35000 }).catch(() => { });
  await autoScroll(page);

  const jobLinks = await page.evaluate(() => {
    // Find the container that has the actual job listings (contains PRIMARY SKILLS: and LOCATION:)
    const container = Array.from(document.querySelectorAll('.lpContentsItem.rawHtmlSpan'))
      .find(el => el.innerText && el.innerText.includes('PRIMARY SKILLS:') && el.innerText.includes('LOCATION:'));
    if (!container) return [];

    // Each job has an "APPLY NOW" anchor linking to ripplehire
    const anchors = Array.from(container.querySelectorAll('a')).filter(a =>
      a.innerText.toLowerCase().includes('apply now') && a.href
    );

    return anchors.map(a => {
      const detailUrl = a.href;

      // Walk up to the enclosing <div> that wraps EXPERIENCE, LOCATION, and APPLY NOW
      let parent = a.parentElement;
      while (parent && parent !== container && parent.tagName.toLowerCase() !== 'div') {
        parent = parent.parentElement;
      }

      let experience = 'Not Found';
      let location = 'Not Found';
      if (parent) {
        const ps = Array.from(parent.querySelectorAll('p'));
        ps.forEach(p => {
          const text = p.innerText.trim();
          if (text.includes('EXPERIENCE:')) {
            experience = text.replace('EXPERIENCE:', '').trim();
          } else if (text.includes('LOCATION:')) {
            location = text.replace('LOCATION:', '').trim().split('\n')[0].trim();
          }
        });
      }

      // The title is in the colored <p> BEFORE the parent <div>
      // Walk backwards through siblings to find the blue title <p>
      let title = 'Not Found';
      let jobId = 'Not Found';
      let prev = parent ? parent.previousElementSibling : null;
      while (prev) {
        const text = prev.innerText || '';
        const hasDashes = text.includes('---') || text.includes('———');
        const hasColor = prev.getAttribute('style')?.includes('color') || !!prev.style.color;

        if (prev.tagName.toLowerCase() === 'p' && (hasDashes || hasColor)) {
          // Clean up the text and extract optional jobId from parentheses: e.g. ( 813282 )
          const cleanText = text.replace(/[-—_\s]+/g, ' ').trim();
          const match = cleanText.match(/(.*?)\(\s*(\d{5,})\s*\)/);
          if (match) {
            title = match[1].trim();
            jobId = match[2].trim();
          } else {
            title = cleanText;
          }
          break;
        }
        prev = prev.previousElementSibling;
      }

      // Append ', India' to location if not already there
      if (location && location !== 'Not Found' && !location.toLowerCase().includes('india')) {
        location += ', India';
      }

      return { title, location, detailUrl, experience, jobId };
    }).filter(j => j.detailUrl && j.title !== 'Not Found');
  });

  console.log(`     ↳ Mphasis: ${jobLinks.length} jobs found`);

  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    // Pass experience and jobId from listing so they are preserved
    await visitDetailPage(context, job, 'mphasis', results, {
      company: 'Mphasis',
      experience: job.experience,
      jobId: job.jobId
    });
    await delay(500);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🏢  DEJOBS (Colgate-Palmolive & other companies using dejobs.org)
// Site: *.dejobs.org/jobs/
// Structure: <li> with <a id="job-link-{ID}"> → detail page
//            Pagination via "More" button click
//            Detail page: .prose for description, rr.jobsyn.org apply link
// ════════════════════════════════════════════════════════════════════════════
async function scrapeDeJobs(page, context, listingUrl, results) {
  console.log(`  📄 DeJobs listing...`);

  // Click 'More' button repeatedly until all jobs are loaded
  let prevCount = 0;
  let noChangeRounds = 0;
  while (true) {
    await page.waitForSelector('a[id^="job-link-"]', { timeout: 30000 }).catch(() => { });
    const currentCount = await page.locator('a[id^="job-link-"]').count();
    console.log(`     ↳ Loaded ${currentCount} job links so far...`);

    if (currentCount >= MAX_JOBS) break;

    // Try to click 'More' button
    const moreBtn = page.locator('button:has-text("More")').first();
    const moreBtnVisible = await moreBtn.isVisible().catch(() => false);
    if (!moreBtnVisible) break;

    await moreBtn.click();
    await page.waitForTimeout(2000);

    const newCount = await page.locator('a[id^="job-link-"]').count();
    if (newCount === currentCount) {
      noChangeRounds++;
      if (noChangeRounds >= 3) break;
    } else {
      noChangeRounds = 0;
    }
    prevCount = newCount;
  }

  // Extract all job links from the listing page
  const jobLinks = await page.evaluate(() => {
    const origin = window.location.origin;
    return Array.from(document.querySelectorAll('a[id^="job-link-"]')).map(a => {
      // Title: first <span> with font-bold class
      const titleEl = a.querySelector('span.font-bold, span[class*="font-bold"]');
      const title = titleEl ? titleEl.innerText.trim() : a.innerText.trim().split('\n')[0];

      // Location: second span (block display)
      const locEl = a.querySelector('span.block, span[class*="block"]');
      const location = locEl ? locEl.innerText.trim() : 'Not Found';

      // Date: last span (text-gray-600)
      const dateEl = a.querySelector('span[class*="text-gray"]');
      const date = dateEl ? dateEl.innerText.trim() : 'Not Found';

      // Job ID from the anchor id attribute: job-link-{ID}
      const jobId = (a.id || '').replace('job-link-', '');

      // Detail URL — relative href → absolute
      let href = a.getAttribute('href') || '';
      if (href && !href.startsWith('http')) {
        href = origin + href;
      }

      return { title, location, date, detailUrl: href, jobId };
    }).filter(j => j.detailUrl && j.title);
  });

  console.log(`     ↳ DeJobs: ${jobLinks.length} jobs found`);

  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'dejobs', results, { company: 'Colgate-Palmolive' });
    await delay(400);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏢  ATLAS COPCO GROUP
// Site: atlascopcogroup.com
// Structure: Algolia-powered listings using .ds_ais-Hits-item
//            Pagination via dynamic scrolling or Load More if present.
// ════════════════════════════════════════════════════════════════════════════
async function scrapeAtlasCopco(page, context, listingUrl, results) {
  console.log(`  📄 Atlas Copco listing...`);
  await page.waitForSelector('.ds_ais-Hits-item', { timeout: 35000 }).catch(() => { });

  const jobLinks = [];
  let pageNum = 1;

  while (true) {
    console.log(`     ↳ Scraping Page ${pageNum}...`);
    await autoScroll(page);
    await page.waitForTimeout(2000);

    const pageJobs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ds_ais-Hits-item')).map(item => {
        const a = item.querySelector('a.ds_ais-Hit-link');
        if (!a) return null;

        const titleEl = item.querySelector('.ds_ais-Hit-title');
        const title = titleEl ? titleEl.innerText.trim() : 'Not Found';

        // Parse tags (brand, region, category, country/location)
        const tags = Array.from(item.querySelectorAll('.ds_ais-Hit-tag')).map(t => t.innerText.trim());
        const location = tags.join(', ') || 'India';

        const detailUrl = a.href;
        return { title, location, detailUrl };
      }).filter(j => j && j.detailUrl && j.title !== 'Not Found');
    });

    jobLinks.push(...pageJobs);

    // Look for next page button
    const nextBtn = page.locator('li.ais-Pagination-item--nextPage a, button.ais-Pagination-item--nextPage').first();
    const isVisible = await nextBtn.isVisible().catch(() => false);
    if (!isVisible) {
      console.log(`     ↳ No next page button found or reached the end.`);
      break;
    }

    const isDisabled = await nextBtn.evaluate(el =>
      el.classList.contains('ais-Pagination-item--disabled') ||
      el.closest('li')?.classList.contains('ais-Pagination-item--disabled') ||
      el.hasAttribute('disabled')
    ).catch(() => false);
    if (isDisabled) {
      console.log(`     ↳ Next page button is disabled.`);
      break;
    }

    console.log(`     ↳ Clicking Next Page...`);
    await nextBtn.evaluate(el => el.click()).catch(async () => {
      await nextBtn.click({ force: true }).catch(() => { });
    });
    await page.waitForTimeout(4000);
    pageNum++;
  }

  // Deduplicate jobs by detailUrl
  const uniqueJobs = Array.from(new Map(jobLinks.map(item => [item.detailUrl, item])).values());
  console.log(`     ↳ Atlas Copco: Total ${uniqueJobs.length} unique jobs found across all pages`);

  for (const job of uniqueJobs) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'atlascopco', results, { company: 'Atlas Copco Group' });
    await delay(500);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏗️  AECOM
// Site: aecom.jobs
// Structure: DirectEmployers custom domain — ul#jobs > li > a[id^="job-link-"]
//            Pagination via "More" button (aria-label="Load more jobs")
// ════════════════════════════════════════════════════════════════════════════
async function scrapeAecom(page, context, listingUrl, results) {
  console.log(`  📄 AECOM listing...`);

  // Click 'More' button repeatedly until all jobs are loaded
  let noChangeRounds = 0;
  while (true) {
    await page.waitForSelector('ul#jobs a[href*="/job/"], a[id^="job-link-"]', { timeout: 30000 }).catch(() => { });
    const currentCount = await page.locator('ul#jobs li').count();
    console.log(`     ↳ Loaded ${currentCount} job listings so far...`);

    if (currentCount >= MAX_JOBS) break;

    // Try to click 'More' button
    const moreBtn = page.locator('button[aria-label="Load more jobs"], button.btn:has-text("More")').first();
    const moreBtnVisible = await moreBtn.isVisible().catch(() => false);
    if (!moreBtnVisible) break;

    await moreBtn.click();
    await page.waitForTimeout(2500);

    const newCount = await page.locator('ul#jobs li').count();
    if (newCount === currentCount) {
      noChangeRounds++;
      if (noChangeRounds >= 3) break;
    } else {
      noChangeRounds = 0;
    }
  }

  // Extract all job links from the listing page
  const jobLinks = await page.evaluate(() => {
    const origin = window.location.origin;
    return Array.from(document.querySelectorAll('ul#jobs li')).map(li => {
      const a = li.querySelector('a[id^="job-link-"], a[href*="/job/"]');
      if (!a) return null;

      const titleEl = a.querySelector('span.font-bold, h2, h3, span[class*="font-bold"], span[class*="title"]');
      const title = titleEl ? titleEl.innerText.trim() : a.innerText.trim().split('\n')[0];

      const locEl = a.querySelector('span.block, span[class*="block"], span[class*="location"], .location');
      const location = locEl ? locEl.innerText.trim() : 'Not Found';

      const dateEl = a.querySelector('span[class*="text-gray"], .date, time');
      const date = dateEl ? dateEl.innerText.trim() : 'Not Found';

      const jobId = (a.id || '').replace('job-link-', '');

      let href = a.getAttribute('href') || '';
      if (href && !href.startsWith('http')) {
        href = origin + href;
      }

      return { title, location, date, detailUrl: href, jobId };
    }).filter(j => j && j.detailUrl && j.title);
  });

  console.log(`     ↳ AECOM: ${jobLinks.length} jobs found`);

  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'aecom', results, { company: 'AECOM' });
    await delay(400);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🏭  PEOPLESTRONG
// Site: *.peoplestrong.com  (e.g. leindiacareers.peoplestrong.com)
// Structure: Angular SPA — .section-card .card-block-inner
//            Pagination: Infinite scroll (scroll to bottom to load more)
// ════════════════════════════════════════════════════════════════════════════
async function scrapePeopleStrong(page, context, listingUrl, results) {
  const hostname = new URL(listingUrl).hostname;
  const subdomain = hostname.split('.')[0];
  let companyName = subdomain.replace(/careers?$/i, '');
  companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

  if (subdomain.includes('amararaja') || listingUrl.includes('amararaja')) {
    companyName = 'Amara Raja';
  } else if (subdomain.includes('larsentoubro') || listingUrl.includes('larsentoubro')) {
    companyName = 'Larsen & Toubro';
  } else if (subdomain.includes('leindia') || listingUrl.includes('leindia')) {
    companyName = 'LE India';
  }

  console.log(`  📄 PeopleStrong listing (${companyName})...`);

  // Wait for job cards to appear
  await page.waitForSelector('.section-card .card-block-inner, .card-block', { timeout: 35000 }).catch(() => { });

  let pageNum = 1;
  const allCollectedJobs = [];
  const seenUrls = new Set();

  while (true) {
    await page.waitForTimeout(2000);

    // Infinite scroll loop on current view to trigger lazy-loaded items
    let scrollRounds = 0;
    let lastCount = 0;
    while (scrollRounds < 4) {
      const count = await page.locator('.section-card .card-block:not(.search-block-section)').count();
      if (count > lastCount) {
        lastCount = count;
        scrollRounds = 0;
      } else {
        scrollRounds++;
      }

      if (count >= MAX_JOBS) break;

      await page.evaluate(() => {
        const cards = document.querySelectorAll('.section-card .card-block:not(.search-block-section)');
        if (cards.length > 0) {
          cards[cards.length - 1].scrollIntoView({ behavior: 'auto', block: 'end' });
        }
        window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
        const containers = document.querySelectorAll('.jobs-listing, .section-card, div[class*="scroll"]');
        containers.forEach(c => { c.scrollTop = c.scrollHeight; });
        window.dispatchEvent(new Event('scroll'));
        document.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(2000);
    }

    // Collect all cards visible in DOM
    const origin = new URL(listingUrl).origin;
    const currentBatch = await page.evaluate((origin) => {
      return Array.from(document.querySelectorAll('.section-card .card-block-inner, .card-block:not(.search-block-section)')).map(card => {
        const a = card.querySelector('h2 a.link, h2.title a, a[href*="/job/detail/"], a.link');
        if (!a) return null;

        const title = a.innerText.trim();
        if (!title) return null;

        const jobCode = card.querySelector('span.job-code')?.innerText?.trim() || '';

        const locLis = card.querySelectorAll('.orgunit-row ul:first-child li, ul.listing-inline li');
        const orgUnit = card.querySelector('.orgunit-row li[data-testid*="organizationunit"]')?.innerText?.trim() || '';
        const locHierarchy = card.querySelector('.orgunit-row li[data-testid*="locationhierarchy"]')?.innerText?.trim() || '';
        let location = locHierarchy || (locLis[1] || locLis[0])?.innerText?.trim() || 'Not Found';

        const dateSpan = card.querySelector('[data-testid="joblist-li-page-7"] span.link2, .link2, li[data-testid*="li-page"] span');
        const date = dateSpan ? dateSpan.innerText.trim() : 'Not Found';

        const expEl = card.querySelector('.text-cell.font-bold, [class*="experience"]');
        const experience = expEl ? expEl.innerText.trim() : 'Not Found';

        let href = a.getAttribute('href') || '';
        if (href && !href.startsWith('http')) href = origin + href;

        return { title, location, date, experience, detailUrl: href, jobId: jobCode };
      }).filter(j => j && j.detailUrl && j.title);
    }, origin);

    let newJobsFound = 0;
    for (const job of currentBatch) {
      if (!seenUrls.has(job.detailUrl)) {
        seenUrls.add(job.detailUrl);
        allCollectedJobs.push(job);
        newJobsFound++;
      }
    }

    console.log(`     ↳ Page ${pageNum}: ${currentBatch.length} cards visible, ${allCollectedJobs.length} total collected...`);

    if (allCollectedJobs.length >= MAX_JOBS) break;

    // Try clicking Pagination next button / page numbers (e.g. 1, 2, 3, 4, 5... or Next) if pagination controls exist
    const hasNextPage = await page.evaluate(() => {
      const nextLi = document.querySelector('ul.pagination li.next:not(.disabled), ul.pagination li.next-page:not(.disabled), [data-testid*="paginator"] li.next:not(.disabled), [data-testid*="paginator"] li.nextview:not(.disabled)');
      if (nextLi) {
        const a = nextLi.querySelector('a, button') || nextLi;
        a.click();
        return true;
      }

      const nextBtn = document.querySelector('alt-pagination .next a, alt-pagination .next button, .pagination .next a, button.next-page, a.next-page, [data-testid*="next"], .pagination li.active + li a, ul.pagination li.active + li button, [class*="pagination"] button:not([disabled])');
      if (nextBtn && !nextBtn.classList.contains('disabled') && !nextBtn.hasAttribute('disabled')) {
        nextBtn.click();
        return true;
      }

      const activePage = document.querySelector('.pagination li.active, alt-pagination .active, [class*="pagination"] .active');
      if (activePage && activePage.nextElementSibling) {
        const pageBtn = activePage.nextElementSibling.querySelector('a, button');
        if (pageBtn && !pageBtn.classList.contains('disabled') && !pageBtn.hasAttribute('disabled')) {
          pageBtn.click();
          return true;
        }
      }

      const arrowNext = document.querySelector('alt-pagination .keyboard_arrow_right, alt-pagination .chevron_right, .icon-next, [class*="arrow-right"]');
      if (arrowNext) {
        const clickable = arrowNext.closest('a, button, li');
        if (clickable && !clickable.classList.contains('disabled') && !clickable.hasAttribute('disabled')) {
          clickable.click();
          return true;
        }
      }

      return false;
    });

    if (newJobsFound === 0) {
      console.log(`  ✅ PeopleStrong listing completed — total ${allCollectedJobs.length} jobs collected`);
      break;
    }

    if (!hasNextPage) {
      console.log(`  ✅ PeopleStrong listing completed — total ${allCollectedJobs.length} jobs collected`);
      break;
    }

    await page.waitForTimeout(3000);
    pageNum++;
  }

  console.log(`     ↳ PeopleStrong: ${allCollectedJobs.length} total jobs found`);

  for (const job of allCollectedJobs) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'peoplestrong', results, { company: companyName });
    await delay(400);
  }
}


// ════════════════════════════════════════════════════════════════════════════
// 🔧  TTC PORTALS  (Parker Hannifin etc.)
// Site: *.ttcportals.com  (e.g. parkercareers.ttcportals.com)
// Structure: Static HTML — .job-result cards, 25/page
//            Pagination via a[rel="next"] / numbered pages
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTtcPortals(page, context, listingUrl, results) {
  const subdomain = new URL(listingUrl).hostname.split('.')[0]; // e.g. 'parkercareers'
  const companyName = subdomain;
  const origin = new URL(listingUrl).origin;

  console.log(`  📄 TTC Portals listing (${companyName})...`);

  let currentUrl = listingUrl;
  let pageNum = 1;

  while (true) {
    if (pageNum > 1) {
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => { });
    }
    await page.waitForSelector('.job-result, .job-link-wrapper, [class*="job-result"], .jobs-section__item', { timeout: 30000 }).catch(() => { });
    await page.waitForTimeout(1500);

    const jobLinks = await page.evaluate((origin) => {
      // TTC portals: job result cards
      const cards = [...document.querySelectorAll('.job-result, li.job-result, [class*="job-result"], .jobs-section__item, .jobs-list-item')];
      return cards.map(card => {
        const a = card.querySelector('h2 a, .title a, a[href*="/job/"], a[href*="/jobs/"], a.job-result-title, h3 a, p a');
        if (!a) return null;

        const title = a.innerText.trim();
        if (!title) return null;

        let href = a.getAttribute('href') || '';
        if (href && !href.startsWith('http')) href = origin + href;

        let location = card.querySelector('.location, .job-location, .city, [class*="location"]')?.innerText?.trim();
        if (!location) {
          const locCol = Array.from(card.querySelectorAll('div')).find(div => div.innerText.includes('Location:'));
          if (locCol) location = locCol.innerText.replace('Location:', '').replace(/\s+/g, ' ').trim();
        }
        location = location || 'Not Found';

        let date = card.querySelector('.date, .posted-date, time, [class*="date"]')?.innerText?.trim();
        if (!date) {
          const dateCol = Array.from(card.querySelectorAll('div')).find(div => div.innerText.includes('Date Posted:'));
          if (dateCol) date = dateCol.innerText.replace('Date Posted:', '').trim();
        }
        date = date || 'Not Found';

        const jobId = href.split('/').filter(Boolean).pop() || '';

        return { title, location, date, detailUrl: href, jobId };
      }).filter(j => j && j.detailUrl && j.title);
    }, origin);

    console.log(`     ↳ Page ${pageNum}: ${jobLinks.length} jobs found`);

    for (const job of jobLinks) {
      if (results.length >= MAX_JOBS) break;
      await visitDetailPage(context, job, 'ttcportals', results, { company: companyName });
      await delay(400);
    }

    if (results.length >= MAX_JOBS) break;

    // Pagination: find rel="next" or numbered next page link
    const nextUrl = await page.evaluate((origin) => {
      const nextLink = document.querySelector('a[rel="next"], .pagination a.next, li.next a, a.next-page, [aria-label="Next"]');
      if (!nextLink) return null;
      let href = nextLink.getAttribute('href') || '';
      if (href && !href.startsWith('http')) href = origin + href;
      return href || null;
    }, origin);

    if (!nextUrl) {
      console.log(`     ↳ No more pages found. Done.`);
      break;
    }

    console.log(`     ↳ Moving to page ${pageNum + 1}...`);
    currentUrl = nextUrl;
    pageNum++;
    await page.waitForTimeout(2000);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 💼  WORKABLE (apply.workable.com)
// Site: *.workable.com  (e.g. apply.workable.com/pxgeo)
// Structure: React SPA — li[data-ui="job"], [data-ui="job"]
//            Pagination: "Show more" button / Load more scroll
// ════════════════════════════════════════════════════════════════════════════
async function scrapeWorkable(page, context, listingUrl, results) {
  const pathParts = new URL(listingUrl).pathname.split('/').filter(Boolean);
  const companySlug = pathParts[0] || '';
  let companyName = companySlug ? companySlug.charAt(0).toUpperCase() + companySlug.slice(1) : 'Workable';
  if (companySlug.toLowerCase() === 'pxgeo') companyName = 'PxGeo';

  console.log(`  📄 Workable listing (${companyName})...`);

  // Wait for job cards to appear
  await page.waitForSelector('li[data-ui="job"], [data-ui="job"], [data-ui="job-title"], .styles--1vo9F', { timeout: 35000 }).catch(() => { });

  // Handle "Show more" button or scroll pagination for ALL pages
  let noChangeRounds = 0;
  while (true) {
    const currentCount = await page.locator('li[data-ui="job"], [data-ui="job"], .styles--1vo9F').count();
    console.log(`     ↳ Loaded ${currentCount} job cards so far...`);

    if (currentCount >= MAX_JOBS) break;

    // Scroll to bottom first to bring load-more button into viewport
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Click "Show more" / "Load more" button if visible
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[data-ui*="load"], button[data-ui*="more"], button'));
      const showMoreBtn = btns.find(b => {
        const txt = b.innerText?.trim()?.toLowerCase() || '';
        return txt.includes('show more') || txt.includes('load more') || b.getAttribute('data-ui')?.includes('load-more');
      });
      if (showMoreBtn && showMoreBtn.offsetParent !== null) {
        showMoreBtn.scrollIntoView();
        showMoreBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      await page.waitForTimeout(2500);
      noChangeRounds = 0;
    } else {
      const loadMoreBtn = page.locator('button[data-ui="load-more"], button[data-ui="load-more-button"], button:has-text("Show more"), button:has-text("Load more"), button:has-text("Show More")').first();
      const isVisible = await loadMoreBtn.isVisible().catch(() => false);

      if (isVisible) {
        await loadMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
        await loadMoreBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(2500);
        noChangeRounds = 0;
      } else {
        await page.waitForTimeout(2000);
        const newCount = await page.locator('li[data-ui="job"], [data-ui="job"], .styles--1vo9F').count();
        if (newCount === currentCount) {
          noChangeRounds++;
          if (noChangeRounds >= 3) break;
        } else {
          noChangeRounds = 0;
        }
      }
    }
  }

  // Try extracting company logo name from page if available
  const pageCompany = await page.evaluate(() => {
    const img = document.querySelector('[data-ui="company-logo"] img, [data-ui="header-logo"] img, .styles--32vFk img');
    return img?.getAttribute('alt')?.trim() || '';
  });
  if (pageCompany && pageCompany !== 'Workable') companyName = pageCompany;

  const origin = new URL(listingUrl).origin;
  const jobLinks = await page.evaluate((origin) => {
    const cards = [...document.querySelectorAll('li[data-ui="job"], [data-ui="job"], .styles--1vo9F')];
    return cards.map(card => {
      const a = card.querySelector('a[href*="/j/"], a.styles--1OnOt') || card.querySelector('a');
      const titleEl = card.querySelector('[data-ui="job-title"], h3');
      const title = titleEl?.innerText?.trim() || a?.innerText?.trim() || 'Not Found';

      if (!a || !title || title === 'Not Found') return null;

      let href = a.getAttribute('href') || '';
      if (href && !href.startsWith('http')) href = origin + href;

      const locEl = card.querySelector('[data-ui="job-location"]');
      let location = locEl?.innerText?.replace(/\s+/g, ' ')?.trim() || 'Not Found';

      const deptEl = card.querySelector('[data-ui="job-department"]');
      const department = deptEl?.innerText?.trim() || '';

      const typeEl = card.querySelector('[data-ui="job-type"]');
      const jobType = typeEl?.innerText?.trim() || '';

      const workplaceEl = card.querySelector('[data-ui="job-workplace"]');
      const workplace = workplaceEl?.innerText?.trim() || '';

      const jobId = card.getAttribute('data-id') || href.match(/\/j\/([A-Za-z0-9]+)/)?.[1] || '';

      return { title, location, detailUrl: href, jobId, department, jobType, workplace };
    }).filter(j => j && j.detailUrl && j.title);
  }, origin);

  console.log(`     ↳ Workable: ${jobLinks.length} jobs found`);

  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'workable', results, { company: companyName, department: job.department });
    await delay(400);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 👔  TEAMTAILOR (*.teamtailor.com)
// Site: *.teamtailor.com (e.g. naffco.teamtailor.com)
// Structure: HTML list with #jobs_list_container, li.block-grid-item
//            Pagination: "Show more" button / Load more scroll / pagination
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTeamtailor(page, context, listingUrl, results) {
  const origin = new URL(listingUrl).origin;
  const hostname = new URL(listingUrl).hostname;
  const companySlug = hostname.split('.')[0] || 'Teamtailor';
  const companyName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1);

  console.log(`  📄 Teamtailor listing (${companyName})...`);

  // Wait for job cards or list container
  await page.waitForSelector('#jobs_list_container, [data-blocks--jobs-target="jobsListContainer"], li.block-grid-item, a[href*="/jobs/"]', { timeout: 35000 }).catch(() => { });

  let noChangeRounds = 0;
  while (true) {
    const currentCount = await page.locator('li.block-grid-item, #jobs_list_container li, [data-blocks--jobs-target="jobsListContainer"] li').count();
    console.log(`     ↳ Loaded ${currentCount} job cards so far...`);

    if (currentCount >= MAX_JOBS) break;

    // Scroll down to load content or bring show-more button into viewport
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Try clicking "Show more jobs" or similar button
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [data-action*="load-more"], [data-pagination-target]'));
      const showMoreBtn = btns.find(b => {
        const txt = b.innerText?.trim()?.toLowerCase() || '';
        return txt.includes('show more') || txt.includes('load more') || txt.includes('more jobs');
      });
      if (showMoreBtn && showMoreBtn.offsetParent !== null) {
        showMoreBtn.scrollIntoView();
        showMoreBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      await page.waitForTimeout(2500);
      noChangeRounds = 0;
    } else {
      const loadMoreBtn = page.locator('button:has-text("Show more"), button:has-text("Load more"), button:has-text("More jobs"), a:has-text("Show more"), a:has-text("Load more")').first();
      const isVisible = await loadMoreBtn.isVisible().catch(() => false);

      if (isVisible) {
        await loadMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
        await loadMoreBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(2500);
        noChangeRounds = 0;
      } else {
        await page.waitForTimeout(2000);
        const newCount = await page.locator('li.block-grid-item, #jobs_list_container li, [data-blocks--jobs-target="jobsListContainer"] li').count();
        if (newCount === currentCount) {
          noChangeRounds++;
          if (noChangeRounds >= 3) break;
        } else {
          noChangeRounds = 0;
        }
      }
    }
  }

  const jobLinks = await page.evaluate((origin) => {
    const cards = [...document.querySelectorAll('#jobs_list_container li, li.block-grid-item, [data-blocks--jobs-target="jobsListContainer"] li')];
    return cards.map(card => {
      const a = card.querySelector('a[href*="/jobs/"]') || card.querySelector('a');
      if (!a) return null;

      const titleSpan = card.querySelector('span[title]') || card.querySelector('span.text-block-base-link, span.company-link-style');
      let title = titleSpan?.getAttribute('title')?.trim() || titleSpan?.innerText?.trim() || a.innerText?.trim() || 'Not Found';

      if (!a || !title || title === 'Not Found') return null;

      let href = a.getAttribute('href') || '';
      if (href && !href.startsWith('http')) href = origin + href;

      let department = '';
      let location = 'Not Found';

      const metaDiv = card.querySelector('div.text-md, .mt-1.text-md');
      if (metaDiv) {
        const spans = [...metaDiv.querySelectorAll('span')].map(s => s.innerText.trim()).filter(t => t && t !== '·');
        if (spans.length >= 2) {
          department = spans[0];
          location = spans[1];
        } else if (spans.length === 1) {
          location = spans[0];
        }
      }

      const jobId = href.match(/\/jobs\/(\d+)/)?.[1] || href.split('/').filter(Boolean).pop() || '';

      return { title, location, detailUrl: href, jobId, department };
    }).filter(j => j && j.detailUrl && j.title);
  }, origin);

  console.log(`     ↳ Teamtailor: ${jobLinks.length} jobs found`);

  for (const job of jobLinks) {
    if (results.length >= MAX_JOBS) break;
    await visitDetailPage(context, job, 'teamtailor', results, { company: companyName, department: job.department });
    await delay(400);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 🎯 TALENTRECRUIT (*.talentrecruit.com)
// Site: *.talentrecruit.com (e.g. voltas.talentrecruit.com)
// Structure: Angular SPA — .card-wrap cards inside .right-listing
//            Data: span.job-title (innerText), p>.bold-text for meta, .skills-block divs
//            No <a> links on cards — detailUrl = listingUrl
//            Pagination: mat-paginator OR Load More inside .right-listing
// ════════════════════════════════════════════════════════════════════════════
async function scrapeTalentRecruit(page, context, listingUrl, results) {
  const origin = new URL(listingUrl).origin;
  const hostname = new URL(listingUrl).hostname;
  const companySlug = hostname.split('.')[0] || 'TalentRecruit';
  const companyName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1);

  console.log(`  📄 TalentRecruit listing (${companyName})...`);

  // Check if content is wrapped in an iframe (e.g. Voltas)
  try {
    const iframeSrc = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="talentrecruit.com"], iframe[src*="sortName="]');
      return iframe ? iframe.src : null;
    });
    if (iframeSrc && iframeSrc !== listingUrl) {
      console.log(`  🔄 Redirecting to iframe source: ${iframeSrc}`);

      // Inject script to intercept the Apply URL token sent via postMessage
      await page.addInitScript(() => {
        window.interceptedPayloads = [];
        const originalPostMessage = window.parent.postMessage;
        window.parent.postMessage = function(message, targetOrigin, transfer) {
          if (typeof message === 'string' && message.startsWith('U2FsdGVkX1')) {
            window.interceptedPayloads.push(message);
          }
        };
      });

      await page.goto(iframeSrc, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3000);
    }
  } catch (e) { }

  // Wait specifically for .card-wrap (not broad OR — Angular renders cards after container)
  try {
    await page.waitForSelector('.card-wrap', { timeout: 45000 });
    await page.waitForTimeout(2500); // let remaining cards render
  } catch {
    console.log(`     ↳ [WARN] .card-wrap not found after 45s, attempting to extract anyway`);
  }

  const allCollectedJobs = [];
  const seenJobKeys = new Set();
  let pageNum = 1;
  let stuckCount = 0;

  while (true) {
    await page.waitForTimeout(800);

    const cardCount = await page.locator('.card-wrap').count();
    console.log(`     ↳ Page ${pageNum}: ${cardCount} .card-wrap elements visible`);

    const pageJobs = await page.evaluate((listingUrl) => {
      // Real DOM: div.card-wrap > div.row-one > div.left-col > span.job-title
      const cards = [...document.querySelectorAll('div.card-wrap')];
      return cards.map(card => {
        // Title: span with class job-title (also has left-col)
        const titleEl = card.querySelector('span.job-title, span.left-col');
        let title = titleEl?.innerText?.trim() || 'Not Found';
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || title === 'Not Found' || title.toLowerCase() === 'back to search') return null;

        // Job ID & posted date from p.posted-text elements
        const postedTexts = [...card.querySelectorAll('p.posted-text')];
        let jobId = '';
        let date = 'Not Found';
        for (const p of postedTexts) {
          const txt = p.innerText.trim();
          if (/^ID\s*\d/i.test(txt)) {
            jobId = txt.replace(/^ID\s*/i, '').trim();
          } else if (txt.toLowerCase().startsWith('posted')) {
            date = txt;
          }
        }

        // No <a> links on cards — use listing URL as apply link
        const detailUrl = listingUrl;

        // Meta from .job-type p > .bold-text
        let location = 'Not Found';
        let department = '';
        let jobType = '';
        let experience = 'Not Found';

        const metaPs = [...card.querySelectorAll('.job-type p')];
        for (const p of metaPs) {
          const fullText = p.innerText.trim();
          const boldEl = p.querySelector('.bold-text');
          const boldText = boldEl?.innerText?.trim() || '';
          const extraSpans = [...p.querySelectorAll('span:not(.bold-text):not(.mat-tooltip-trigger)')]
            .map(s => s.innerText.trim()).filter(Boolean).join(' ');

          if (fullText.includes('Job Location')) {
            location = boldText ? (extraSpans ? `${boldText} ${extraSpans}` : boldText) : fullText.replace('Job Location', '').trim();
          } else if (fullText.includes('Business Group') || fullText.includes('Department')) {
            department = boldText || fullText.replace(/Business Group|Department/g, '').trim();
          } else if (fullText.includes('Job Type')) {
            jobType = boldText || fullText.replace('Job Type', '').trim();
          } else if (fullText.includes('Experience')) {
            experience = boldText || fullText.replace('Experience', '').trim();
          }
        }

        // Skills from .skills-block > div
        const skills = [...card.querySelectorAll('.skills-block div')]
          .map(d => d.innerText.replace(/•/g, '').trim()).filter(Boolean).join(', ');

        return { title, location, detailUrl, jobId, department, jobType, experience, date, skills, description: 'Not Found' };
      }).filter(j => j && j.title && j.title !== 'Not Found');
    }, listingUrl);

    // Click into each job to extract full description
    for (let i = 0; i < pageJobs.length; i++) {
        if (allCollectedJobs.length + i >= MAX_JOBS) break;
        try {
            const card = page.locator('.card-wrap').nth(i);
            const viewBtn = card.locator('button:has-text("View Details"), .cancel-job-btn').first();
            await viewBtn.scrollIntoViewIfNeeded();
            await viewBtn.click({ force: true });
            
            await page.waitForSelector('.apply-sec, .data-text', { timeout: 12000 });
            await page.waitForTimeout(500);
            
            const description = await page.evaluate(() => {
                const descEl = document.querySelector('.data-text, .job-description, .second-job-card');
                return descEl ? descEl.innerText.trim() : 'Not Found';
            });
            
            pageJobs[i].description = description;
            
            // Go back
            const backBtn = page.locator('button:has-text("Back to search"), .view-job-btn, img[src*="back-arrow"]').first();
            await backBtn.click({ force: true });
            
            await page.waitForSelector('.card-wrap', { timeout: 12000 });
            await page.waitForTimeout(500);
        } catch (err) {
            console.log(`       ❌ Failed description for ${pageJobs[i].title}: ${err.message}`);
            try {
                const backBtn = page.locator('button:has-text("Back to search"), .view-job-btn, img[src*="back-arrow"]').first();
                if (await backBtn.isVisible()) {
                    await backBtn.click({ force: true });
                    await page.waitForSelector('.card-wrap', { timeout: 5000 });
                }
            } catch (e) {}
        }
    }

    let newJobsOnPage = 0;
    for (const j of pageJobs) {
      const key = j.jobId ? `id_${j.jobId}` : `${j.title}_${j.location}`;
      if (!seenJobKeys.has(key)) {
        seenJobKeys.add(key);
        allCollectedJobs.push(j);
        newJobsOnPage++;
      }
    }

    console.log(`     ↳ Page ${pageNum}: ${pageJobs.length} parsed, ${newJobsOnPage} new (${allCollectedJobs.length} total)`);

    if (allCollectedJobs.length >= MAX_JOBS) break;
    if (newJobsOnPage === 0) { stuckCount++; if (stuckCount >= 2) break; } else stuckCount = 0;

    // Pagination: mat-paginator next OR Load More INSIDE .right-listing (not filter sidebar)
    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector(
        'mat-paginator button.mat-paginator-navigation-next, button[aria-label="Next page"], button[aria-label="Next Page"]'
      );
      if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('mat-button-disabled')
        && nextBtn.getAttribute('aria-disabled') !== 'true') {
        nextBtn.scrollIntoView();
        nextBtn.click();
        return true;
      }
      const rightListing = document.querySelector('.right-listing');
      if (rightListing) {
        const loadMore = [...rightListing.querySelectorAll('button')].find(b => {
          const t = b.innerText?.trim()?.toLowerCase() || '';
          return (t.includes('load more') || t.includes('show more') || t.includes('load jobs'))
            && b.offsetParent !== null && !b.disabled;
        });
        if (loadMore) { loadMore.scrollIntoView(); loadMore.click(); return true; }
      }
      window.scrollTo(0, document.body.scrollHeight);
      return false;
    });

    if (!hasNext) {
      await page.waitForTimeout(2500);
      const afterCount = await page.locator('.card-wrap').count();
      if (afterCount <= cardCount) {
        console.log(`     ↳ No more pages. Done.`);
        break;
      }
    } else {
      await page.waitForSelector('.card-wrap', { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }

    pageNum++;
  }

  console.log(`     ↳ TalentRecruit: ${allCollectedJobs.length} total jobs found`);

  for (const job of allCollectedJobs) {
    if (results.length >= MAX_JOBS) break;
    
    results.push({
      source: 'talentrecruit',
      url: job.applyLink || job.detailUrl,
      title: job.title,
      location: job.location,
      company: companyName,
      date: job.date || 'Not Found',
      experience: job.experience || 'Not Found',
      description: job.description || 'Not Found',
      applyLink: job.applyLink || job.detailUrl,
      salary: 'Not Available',
      jobId: job.jobId || 'Not Found',
      department: job.department || ''
    });
  }

  // Save results immediately
  saveJobsNow(results);
}

// ════════════════════════════════════════════════════════════════════════════
// 🚜 KONECRANES (Attrax ATS)
// ════════════════════════════════════════════════════════════════════════════
async function scrapeKonecranes(page, context, listingUrl, results) {
  const origin = new URL(listingUrl).origin;
  const hostname = new URL(listingUrl).hostname;
  const companySlug = hostname.split('.')[0] || 'Konecranes';
  const companyName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1);

  console.log(`  📄 ${companyName} listing (${listingUrl})...`);

  try {
    await page.waitForSelector('.attrax-vacancy-tile', { timeout: 40000 });
    await page.waitForTimeout(2000);
  } catch {
    console.log(`     ↳ [WARN] .attrax-vacancy-tile not found after 40s`);
  }

  const seenUrls = new Set();
  let pageNum = 1;

  while (true) {
    await page.waitForTimeout(800);

    const pageJobs = await page.evaluate((baseUrl) => {
      const tiles = [...document.querySelectorAll('.attrax-vacancy-tile')];
      return tiles.map(tile => {
        const titleAnchor = tile.querySelector('a.attrax-vacancy-tile__title, a.attrax-vacancy-tile__learn-more');
        const title = titleAnchor?.innerText?.trim() || 'Not Found';
        const relHref = titleAnchor?.getAttribute('href') || '';
        const detailUrl = relHref ? new URL(relHref, baseUrl).href : '';

        const location = tile.querySelector('.attrax-vacancy-tile__location-freetext .attrax-vacancy-tile__item-value')?.innerText?.trim()
          || tile.querySelector('.attrax-vacancy-tile__option-location-valueset .attrax-vacancy-tile__item-value')?.innerText?.trim()
          || 'Not Found';

        const department = tile.querySelector('.attrax-vacancy-tile__option-department-valueset .attrax-vacancy-tile__item-value')?.innerText?.trim() || '';
        const jobType = tile.querySelector('.attrax-vacancy-tile__option-full-time-part-time-valueset .attrax-vacancy-tile__item-value')?.innerText?.trim()
          || tile.querySelector('.attrax-vacancy-tile__option-job-type-valueset .attrax-vacancy-tile__item-value')?.innerText?.trim() || '';

        const salary = tile.querySelector('.attrax-vacancy-tile__salary-value')?.innerText?.replace(/\s+/g, ' ')?.trim() || 'Not Available';
        const teaser = tile.querySelector('.attrax-vacancy-tile__description-value')?.innerText?.trim() || '';
        const jobId = tile.getAttribute('data-jobid') || tile.querySelector('.attrax-vacancy-tile__reference-value')?.innerText?.trim() || '';

        const applyAnchor = tile.querySelector('a.attrax-vacancy-tile__learn-more, a[href*="/job/"]');
        const applyLink = applyAnchor?.getAttribute('href') ? new URL(applyAnchor.getAttribute('href'), baseUrl).href : detailUrl;

        return { title, detailUrl, location, department, jobType, salary, teaser, jobId, applyLink };
      }).filter(j => j.detailUrl && j.title !== 'Not Found');
    }, page.url());

    let newOnPage = 0;
    for (const job of pageJobs) {
      const linkKey = job.applyLink || job.detailUrl;
      if (seenUrls.has(linkKey)) continue;
      seenUrls.add(linkKey);
      newOnPage++;

      if (results.length >= MAX_JOBS) break;

      console.log(`    🔎 ${job.title} | ${job.location} | ${job.jobId}`);

      let description = job.teaser;
      let experience = 'Not Found';

      if (job.detailUrl) {
        const detailPage = await context.newPage();
        try {
          await detailPage.goto(job.detailUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
          await detailPage.waitForTimeout(2000);

          const detail = await detailPage.evaluate(() => {
            let desc = '';
            try {
              const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}');
              if (ld.description) desc = ld.description.replace(/<[^>]+>/g, ' ').trim();
            } catch (_) { }

            if (!desc) {
              const descEl = document.querySelector('.attrax-vacancy-details__description, [data-type="JobDescriptionWidget"], .attrax-vacancy-description');
              desc = descEl?.innerText?.trim() || '';
            }

            const expMatch = desc.match(/(\d+\+?\s*(years|yrs|year))/i);
            const experience = expMatch ? expMatch[0] : 'Not Found';

            return { description: desc.slice(0, 3000), experience };
          });

          if (detail.description) description = detail.description;
          if (detail.experience) experience = detail.experience;
        } catch (err) {
          console.log(`      ⚠️ Detail page failed: ${err.message}`);
        } finally {
          await detailPage.close();
        }
      }

      results.push({
        source: 'konecranes',
        url: job.applyLink || job.detailUrl,
        title: job.title,
        location: job.location,
        company: companyName,
        date: 'Not Found',
        experience,
        description: description || 'Not Found',
        applyLink: job.applyLink || job.detailUrl,
        salary: job.salary || 'Not Available',
        jobId: job.jobId || 'Not Found',
        department: job.department || ''
      });

      saveJobsNow(results);
      await delay(400);
    }

    console.log(`     ↳ Page ${pageNum}: ${pageJobs.length} parsed, ${newOnPage} new (${results.length} total)`);

    if (newOnPage === 0) {
      console.log(`     ↳ No new jobs on page ${pageNum}. Done.`);
      break;
    }
    if (results.length >= MAX_JOBS) break;

    const hasNext = await page.evaluate(() => {
      const nextBtn = document.querySelector('.attrax-pagination__next a, a[aria-label*="Next pagination page" i]');
      if (nextBtn) {
        const isDisabled = nextBtn.disabled ||
          nextBtn.getAttribute('aria-disabled') === 'true' ||
          nextBtn.classList.contains('disabled') ||
          nextBtn.closest('li')?.classList.contains('disabled');
        if (!isDisabled) {
          nextBtn.scrollIntoView();
          nextBtn.click();
          return true;
        }
      }
      return false;
    });

    if (!hasNext) {
      console.log(`     ↳ No more pages. Done.`);
      break;
    } else {
      await page.waitForTimeout(3000);
    }

    pageNum++;
  }

  console.log(`     ↳ Konecranes: ${results.length} total jobs found`);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));


