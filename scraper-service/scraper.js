console.log("⚡ Scraper Script Loaded");
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration (Use environment variables for security)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
// Parse filters from command line arguments
let scraperFilters = {
  jobType: 'All',
  jobAge: 'Any',
  experienceLevel: 'All',
  duplicateJob: 'Skip',
  country: 'All',
  maxDescLength: 300
};

if (process.argv[2]) {
  try {
    const decoded = Buffer.from(process.argv[2], 'base64').toString('utf8');
    scraperFilters = { ...scraperFilters, ...JSON.parse(decoded) };
    console.log("🛠️ Applied Scraper Filters:", scraperFilters);
  } catch (err) {
    console.error("⚠️ Failed to parse filters:", err.message);
  }
}

async function getOrCreateCompany(name) {
  if (!name) return null;
  const cleanName = name.split('|')[0].split('-')[0].split('–')[0].trim();

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
  console.log("🚀 Starting Playwright Multi-Site Scraper...");
  
  try {
    const { data: targetUrls, error: urlsError } = await supabase
      .from('scraper_urls')
      .select('url')
      .eq('is_active', true);

    if (urlsError) {
      console.error("⚠️ URL Fetch Error:", urlsError.message);
    } else {
      console.log(`📊 Found ${targetUrls?.length || 0} active target URLs in database.`);
    }
    
    const jobUrls = targetUrls ? targetUrls.map(t => t.url) : [];
    console.log("🔗 URLs to scrape:", jobUrls);

    if (jobUrls.length === 0) {
      console.log("⚠️ No active target URLs found. Please check 'scraper_urls' table in Supabase.");
      process.exit(0);
    }

    const browser = await chromium.launch({ headless: true });
    console.log("🌏 Browser launched (headless: true)");
    const context = await browser.newContext();

    let allScrapedJobs = [];
    let totalJobsSaved = 0;

    for (const url of jobUrls) {
      let runLogId = null;
      const page = await context.newPage();
      try {
        console.log(`\n🔎 Scraping: ${url}`);
        // Find existing log for this exact URL to update it, or create new
        const { data: existingLogs } = await supabase
          .from('scraper_logs')
          .select('id')
          .eq('error_message', url)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingLogs && existingLogs.length > 0) {
          runLogId = existingLogs[0].id;
          await supabase
            .from('scraper_logs')
            .update({ 
              status: 'running', 
              jobs_found: 0, 
              error_message: url, 
              created_at: new Date().toISOString() 
            })
            .eq('id', runLogId);
        } else {
          const { data: newLog } = await supabase
            .from('scraper_logs')
            .insert([{ status: 'running', jobs_found: 0, error_message: url }])
            .select('id')
            .single();
          runLogId = newLog?.id;
        }

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        await page.waitForLoadState('networkidle').catch(() => {});
 
        const job = await page.evaluate(() => {

          // ─────────────────────────────────────────────
          // 🛠️  HELPERS
          // ─────────────────────────────────────────────
          const getText = (selectors) => {
            for (let sel of selectors) {
              try {
                const el = document.querySelector(sel);
                if (el?.innerText?.trim()) return el.innerText.trim();
                // meta tags return .content, not .innerText
                if (el?.content?.trim()) return el.content.trim();
              } catch (e) {}
            }
            return '';
          };

          const getAllText = (selector) => {
            try {
              return [...document.querySelectorAll(selector)]
                .map(el => el.innerText?.trim())
                .filter(Boolean)
                .join('\n');
            } catch (e) { return ''; }
          };

          // Parse ALL JSON-LD blocks on the page (some sites have multiple)
          const getJsonLd = () => {
            try {
              const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')];
              for (const b of blocks) {
                const json = JSON.parse(b.textContent);
                // Handle both single object and @graph array
                const items = json['@graph'] ? json['@graph'] : [json];
                const job = items.find(i =>
                  i['@type'] === 'JobPosting' || i['@type'] === 'Job'
                );
                if (job) return job;
              }
            } catch (e) {}
            return null;
          };

          const fullText = document.body?.innerText || '';
          const ld = getJsonLd(); // reused across all fields below

          // ─────────────────────────────────────────────
          // ⚡ ORACLE CLOUD (JPMC) — KO.js binding
          // ─────────────────────────────────────────────
          try {
            const root = document.querySelector('job-details-page');
            if (window.ko && root) {
              const koData = window.ko.dataFor(root);
              if (koData?.pageData) {
                const jobData = koData.pageData().job;
                return {
                  title:       jobData.title || '',
                  location:    jobData.primaryLocation || '',
                  company:     'JPMorgan',
                  date:        jobData.postedDate || '',
                  description: jobData.description?.replace(/<[^>]+>/g, '') || '',
                  applyLink:   window.location.href,
                  experience:  jobData.description?.match(/(\d+\+?\s*(years|yrs))/i)?.[0] || '',
                  salary:      'Not Available',
                  jobId:       String(jobData.id || '')
                };
              }
            }
          } catch (e) {}

          // ─────────────────────────────────────────────
          // 📌 TITLE  (20 conditions)
          // ─────────────────────────────────────────────
          let title = getText([
            /* 1 */ 'span[itemprop="title"][data-careersite-propertyid="title"]', // Zoho (Mahindra, Deloitte)
            /* 2 */ '[data-careersite-propertyid="title"]',                       // Zoho any tag fallback
            /* 3 */ '.job__title h1',
            /* 4 */ '.app-title',
            /* 5 */ '.posting-headline h2',
            /* 6 */ '.jobTitle',
            /* 7 */ 'h1 span[itemprop="title"]',
            /* 8 */ 'h1',
            /* 9 */ '[data-test="job-title"]',
            /* 10*/ '[class*="job-title"]',
            /* 11*/ '[id*="job-title"]',
            /* 12*/ '[itemprop="title"]',
            /* 13*/ '.careers-title',
            /* 14*/ '.role-title',
            /* 15*/ '.jd-title',
            /* 16*/ '.job-header__title',
            /* 17*/ '.header-title',
            /* 18*/ '[data-automation="job-title"]',
            /* 19*/ '[data-ph-at-id="job-title"]',
            /* 20*/ '.job-title--h1',
            /* 21*/ 'meta[property="og:title"]',
            /* 22*/ '[aria-label="Job title"]',
          ]);

          // JSON-LD fallback
          if (!title) title = ld?.title || ld?.name || '';

          // OG meta content fallback
          if (!title) {
            title = document.querySelector('meta[property="og:title"]')?.content?.trim() || '';
          }

          // Page <title> last resort (split on | or -)
          if (!title) {
            title = document.title?.split(/[|\-]/)[0]?.trim() || '';
          }

          // Elementor / plain-text "Position:" label
          if (!title) {
            [...document.querySelectorAll('p, li, span, td, h2, h3')].some(el => {
              const t = el.innerText?.trim();
              if (t?.startsWith('Position:')) {
                title = t.replace(/^Position:/i, '').trim();
                return true;
              }
            });
          }

          // ─────────────────────────────────────────────
          // 📍 LOCATION  (20 conditions)
          // ─────────────────────────────────────────────
          let location = '';
          let company  = '';

          // Zoho-style: "city, company" in one element
          const cityText = getText(['.jobCity']);
          if (cityText) {
            const parts = cityText.split(',');
            location = parts[0]?.trim();
            company  = parts[1]?.trim();
          }

          if (!location) location = getText([
            /* 1 */ '[data-careersite-propertyid="city"]',    // Zoho (Deloitte, Mahindra)
            /* 2 */ '[data-careersite-propertyid="location"]',// Zoho alternate
            /* 3 */ '.job__location div',
            /* 4 */ '.location',
            /* 5 */ '.job-location',
            /* 6 */ '.jobGeoLocation',
            /* 7 */ '.posting-categories .location',
            /* 8 */ '[data-test="location"]',
            /* 9 */ '[itemprop="jobLocation"]',
            /* 10*/ '[class*="location"]',
            /* 11*/ 'address',
            /* 12*/ '[data-automation="job-location"]',
            /* 13*/ '[data-ph-at-id="location"]',
            /* 14*/ '.job-location__city',
            /* 15*/ '.location-name',
            /* 16*/ '.city-state',
            /* 17*/ '[aria-label="Job location"]',
            /* 18*/ '.work-location',
            /* 19*/ '.office-location',
            /* 20*/ '.position-location',
            /* 21*/ '[class*="job-city"]',
            /* 22*/ '[class*="job-region"]',
          ]);

          // JSON-LD fallback for location
          if (!location && ld) {
            location =
              ld.jobLocation?.address?.addressLocality ||
              ld.jobLocation?.address?.addressRegion   ||
              ld.jobLocation?.name                     || '';
          }

          // Elementor "Location:" label
          if (!location) {
            [...document.querySelectorAll('p, li, span, td')].some(el => {
              const t = el.innerText?.trim();
              if (t?.match(/^Location:/i)) {
                location = t.replace(/^Location:/i, '').trim();
                return true;
              }
            });
          }

          // ─────────────────────────────────────────────
          // 🏢 COMPANY  (20 conditions)
          // ─────────────────────────────────────────────
          if (!company) company = getText([
            /* 1 */ '[data-careersite-propertyid="businessunit"]', // Zoho (Deloitte = "Deloitte LLP")
            /* 2 */ '[data-careersite-propertyid="customfield3"]', // Zoho alternate company field
            /* 3 */ '[data-careersite-propertyid="customfield1"]', // Zoho designation fallback
            /* 4 */ '.company',
            /* 5 */ '.posting-company',
            /* 6 */ '[itemprop="hiringOrganization"]',
            /* 7 */ '[class*="company-name"]',
            /* 8 */ '.employer-name',
            /* 9 */ '.org-name',
            /* 10*/ '[data-test="company-name"]',
            /* 11*/ '[data-automation="company-name"]',
            /* 12*/ '.company__name',
            /* 13*/ '.employer',
            /* 14*/ '.organization-name',
            /* 15*/ '[class*="employer"]',
            /* 16*/ '[aria-label="Company name"]',
            /* 17*/ '.brand-name',
            /* 18*/ '.recruiter-name',
            /* 19*/ '.client-name',
            /* 20*/ '[class*="company"]',
            /* 21*/ 'meta[property="og:site_name"]',
            /* 22*/ '[name="author"]',
          ]);

          // JSON-LD fallback for company
          if (!company && ld) {
            company =
              ld.hiringOrganization?.name ||
              ld.organizer?.name          || '';
          }

          // OG site_name fallback
          if (!company) {
            company = document.querySelector('meta[property="og:site_name"]')?.content?.trim() || '';
          }

          // Elementor "Company:" label
          if (!company) {
            [...document.querySelectorAll('p, li, span, td')].some(el => {
              const t = el.innerText?.trim();
              if (t?.match(/^Company:/i)) {
                company = t.replace(/^Company:/i, '').trim();
                return true;
              }
            });
          }

          // ─────────────────────────────────────────────
          // 📅 DATE  (20 conditions)
          // ─────────────────────────────────────────────
          let date = getText([
            /* 1 */ '[data-careersite-propertyid="date"]',
            /* 2 */ '[itemprop="datePosted"]',
            /* 3 */ '[class*="posted-date"]',
            /* 4 */ '[class*="post-date"]',
            /* 5 */ '[class*="date-posted"]',
            /* 6 */ '.job-date',
            /* 7 */ '.posting-date',
            /* 8 */ '[data-test="posted-date"]',
            /* 9 */ '[data-automation="date-posted"]',
            /* 10*/ 'time',
            /* 11*/ '[datetime]',
            /* 12*/ '.date',
            /* 13*/ '[class*="publish"]',
            /* 14*/ '.updated-date',
            /* 15*/ '.created-date',
            /* 16*/ '[class*="listing-date"]',
            /* 17*/ '[class*="job-posted"]',
            /* 18*/ '.closingDate',
            /* 19*/ '[class*="closing-date"]',
            /* 20*/ '[class*="expiry"]',
          ]);

          // Attribute-based fallbacks
          if (!date) {
            date =
              document.querySelector('meta[itemprop="datePosted"]')?.content ||
              document.querySelector('[itemprop="datePosted"]')?.getAttribute('datetime') ||
              document.querySelector('time')?.getAttribute('datetime') || '';
          }

          // JSON-LD fallback
          if (!date && ld) {
            date = ld.datePosted || ld.validThrough || '';
          }

          // Regex from body text
          if (!date) {
            const m = fullText.match(/Posted\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
            date = m?.[1] || '';
          }

          // ─────────────────────────────────────────────
          // 📝 DESCRIPTION  (20 conditions)
          // ─────────────────────────────────────────────
          let description = getText([
            /* 1 */ '.job__description',
            /* 2 */ '#content .content',
            /* 3 */ '.jobdescription',
            /* 4 */ '.fr-view',
            /* 5 */ '[itemprop="description"]',
            /* 6 */ '.job-description',
            /* 7 */ '.description',
            /* 8 */ '#job-description',
            /* 9 */ '[data-test="job-description"]',
            /* 10*/ '[data-automation="jobAdDetails"]',
            /* 11*/ '.job-details__description',
            /* 12*/ '.posting-description',
            /* 13*/ '.jd-desc',
            /* 14*/ '.job-body',
            /* 15*/ '.content-description',
            /* 16*/ '[class*="job-detail"]',
            /* 17*/ '[class*="job-desc"]',
            /* 18*/ '.role-description',
            /* 19*/ '.opportunity-description',
            /* 20*/ 'article',
          ]) || getAllText('.text5');

          // JSON-LD fallback
          if (!description && ld) {
            description = ld.description?.replace(/<[^>]+>/g, '') || '';
          }

          // OG description fallback
          if (!description) {
            description = document.querySelector('meta[property="og:description"]')?.content?.trim() || '';
          }

          // All <p> tags as last resort
          if (!description) description = getAllText('p');

          // ─────────────────────────────────────────────
          // 🔗 APPLY LINK  (20 conditions)
          // ─────────────────────────────────────────────
          let applyLink =
            /* 1 */ document.querySelector('a[href*="apply"]')?.href ||
            /* 2 */ document.querySelector('#apply_button')?.href ||
            /* 3 */ document.querySelector('[class*="apply"] a')?.href ||
            /* 4 */ document.querySelector('a[class*="apply"]')?.href ||
            /* 5 */ document.querySelector('[data-test="apply-button"]')?.href ||
            /* 6 */ document.querySelector('[data-automation="apply-button"]')?.href ||
            /* 7 */ document.querySelector('a[id*="apply"]')?.href ||
            /* 8 */ document.querySelector('.btn-apply')?.href ||
            /* 9 */ document.querySelector('[class*="btn-apply"]')?.href ||
            /* 10*/ document.querySelector('[class*="apply-btn"]')?.href ||
            /* 11*/ document.querySelector('a[title*="Apply"]')?.href ||
            /* 12*/ document.querySelector('a[aria-label*="Apply"]')?.href ||
            /* 13*/ document.querySelector('button[class*="apply"]')?.dataset?.href ||
            /* 14*/ document.querySelector('[data-apply-url]')?.dataset?.applyUrl ||
            /* 15*/ document.querySelector('[action*="apply"]')?.action ||    // <form action>
            /* 16*/ document.querySelector('a[href*="application"]')?.href ||
            /* 17*/ document.querySelector('a[href*="submit"]')?.href ||
            /* 18*/ document.querySelector('[class*="cta"] a')?.href ||
            /* 19*/ ld?.applicationContact?.url || ld?.url ||
            /* 20*/ '';

          // Button JS trigger
          if (!applyLink) {
            const btn =
              document.querySelector('button[aria-label="Apply"]') ||
              document.querySelector('button[class*="apply"]');
            applyLink = btn ? 'Apply button (JS trigger)' : 'Not Found';
          }

          // ─────────────────────────────────────────────
          // 💼 EXPERIENCE  (20 conditions)
          // ─────────────────────────────────────────────
          let experience = '';

          // 1. Regex: "3-5 years", "5+ years", "2 to 4 yrs"
          experience = fullText.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?)(\s+of(\s+relevant)?\s+experience)?)/i)?.[0] || '';

          // 2. CSS selectors
          if (!experience) experience = getText([
            /* 2 */ '[data-careersite-propertyid="experience"]',
            /* 3 */ '[class*="experience"]',
            /* 4 */ '[data-test="experience"]',
            /* 5 */ '.job-experience',
            /* 6 */ '.experience-level',
            /* 7 */ '[itemprop="experienceRequirements"]',
            /* 8 */ '.years-experience',
            /* 9 */ '[class*="exp-level"]',
            /* 10*/ '[class*="exp-years"]',
          ]);

          // 11. JSON-LD
          if (!experience && ld) {
            experience = ld.experienceRequirements?.monthsOfExperience
              ? `${Math.round(ld.experienceRequirements.monthsOfExperience / 12)} years`
              : ld.experienceRequirements || '';
            experience = String(experience);
          }

          // 12. "Experience: 5 years" label pattern in any element
          if (!experience) {
            [...document.querySelectorAll('p, li, span, td, dt, dd')].some(el => {
              const t = el.innerText?.trim();
              if (t?.match(/^Experience\s*:/i)) {
                experience = t.replace(/^Experience\s*:/i, '').trim();
                return true;
              }
            });
          }

          // 13. "X years of experience" anywhere in text
          if (!experience) {
            experience = fullText.match(/(\d+\+?)\s+years?\s+of\s+(work\s+)?(experience|exp\.?)/i)?.[0] || '';
          }

          // 14. "Minimum X years"
          if (!experience) {
            experience = fullText.match(/minimum\s+(\d+\+?)\s+years?/i)?.[0] || '';
          }

          // 15. "At least X years"
          if (!experience) {
            experience = fullText.match(/at\s+least\s+(\d+\+?)\s+years?/i)?.[0] || '';
          }

          // 16. "X+ years"
          if (!experience) {
            experience = fullText.match(/(\d+\+)\s*years?/i)?.[0] || '';
          }

          // 17. Fresher / Entry level
          if (!experience) {
            if (/fresher|entry[\s-]level|0[\s-]?\d?\s*years?/i.test(fullText)) {
              experience = 'Fresher / Entry Level';
            }
          }

          // 18. Mid / Senior / Lead levels
          if (!experience) {
            const lvl = fullText.match(/\b(junior|mid[\s-]?level|senior|lead|principal|staff)\b/i)?.[0];
            if (lvl) experience = lvl;
          }

          // 19. "Experience Range: X-Y" in meta description
          if (!experience) {
            const meta = document.querySelector('meta[name="description"]')?.content || '';
            experience = meta.match(/(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[0] || '';
          }

          // 20. "Exp: X years" shorthand
          if (!experience) {
            experience = fullText.match(/\bExp[:\s]+(\d+\+?\s*(to|-)?\s*\d*\+?\s*(years?|yrs?))/i)?.[1] || '';
          }

          // ─────────────────────────────────────────────
          // 💰 SALARY  (20 conditions)
          // ─────────────────────────────────────────────
          let salary = '';

          // 1. Currency symbol regex (₹, $, Rs, INR)
          const currencyMatches = fullText.match(/(\$|₹|Rs\.?|INR|USD|GBP|EUR)\s?[\d,]+(\.\d+)?(\s*(K|L|Lac|Lakh|LPA|CTC|PA|per\s+annum|per\s+month|pm|annually)?)/gi);
          if (currencyMatches) salary = currencyMatches.join(' - ');

          // 2. "Pay range" paragraph
          if (!salary) {
            const salaryLine = [...document.querySelectorAll('p')]
              .map(p => p.innerText)
              .find(t => t.toLowerCase().includes('pay range'));
            if (salaryLine) salary = salaryLine;
          }

          // 3. CSS selectors
          if (!salary) salary = getText([
            /* 3 */ '[data-careersite-propertyid="salary"]',
            /* 4 */ '[class*="salary"]',
            /* 5 */ '[itemprop="baseSalary"]',
            /* 6 */ '.compensation',
            /* 7 */ '[class*="compensation"]',
            /* 8 */ '.pay-range',
            /* 9 */ '[data-test="salary"]',
            /* 10*/ '[class*="pay-"]',
            /* 11*/ '.stipend',
            /* 12*/ '[class*="stipend"]',
            /* 13*/ '.ctc',
            /* 14*/ '[class*="ctc"]',
          ]);

          // 15. JSON-LD baseSalary
          if (!salary && ld?.baseSalary) {
            const bs = ld.baseSalary;
            if (bs.value?.minValue && bs.value?.maxValue) {
              salary = `${bs.currency || ''} ${bs.value.minValue} - ${bs.value.maxValue} (${bs.value.unitText || ''})`;
            } else if (bs.value?.value) {
              salary = `${bs.currency || ''} ${bs.value.value} (${bs.value.unitText || ''})`;
            }
          }

          // 16. "Salary: X LPA" label pattern
          if (!salary) {
            [...document.querySelectorAll('p, li, span, td, dt, dd')].some(el => {
              const t = el.innerText?.trim();
              if (t?.match(/^Salary\s*:/i)) {
                salary = t.replace(/^Salary\s*:/i, '').trim();
                return true;
              }
            });
          }

          // 17. "X LPA / X Lakh" pattern
          if (!salary) {
            salary = fullText.match(/[\d.]+\s*(to|-)?\s*[\d.]*\s*(LPA|Lakh|Lac|CTC)/gi)?.[0] || '';
          }

          // 18. "Upto X" pattern
          if (!salary) {
            salary = fullText.match(/[Uu]p\s*to\s+(\$|₹|Rs\.?|INR)?\s*[\d,]+\s*(K|L|LPA|Lakh)?/i)?.[0] || '';
          }

          // 19. "Salary range" or "Compensation" in any element
          if (!salary) {
            [...document.querySelectorAll('p, li, td, span')].some(el => {
              const t = el.innerText?.trim().toLowerCase();
              if (t?.includes('salary range') || t?.includes('total compensation')) {
                salary = el.innerText.trim();
                return true;
              }
            });
          }

          // 20. Final fallback
          if (!salary) salary = 'Not Available';

          // ─────────────────────────────────────────────
          // 🆔 JOB ID  (20 conditions)
          // ─────────────────────────────────────────────
          let jobId = '';

          // 1. Zoho "Job requisition ID :: 97241"
          jobId = fullText.match(/Job\s+requisition\s+ID\s*::?\s*(\S+)/i)?.[1] || '';

          // 2. Generic "Job Id: XXX"
          if (!jobId) jobId = fullText.match(/Job\s*I[Dd][:\s#]*(\S+)/i)?.[1] || '';

          // 3. "Req ID / Requisition"
          if (!jobId) jobId = fullText.match(/Req(?:uisition)?\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1] || '';

          // 3. URL path last segment (e.g. /jobs/12345 or /job/12345-title)
          if (!jobId) {
            const pathMatch = window.location.pathname.match(/\/(\d{5,})/);
            jobId = pathMatch?.[1] || '';
          }

          // 4. URL query param ?jobId= or ?id=
          if (!jobId) {
            const params = new URLSearchParams(window.location.search);
            jobId = params.get('jobId') || params.get('id') || params.get('job_id') || params.get('jid') || '';
          }

          // 5. CSS selectors
          if (!jobId) jobId = getText([
            /* 5 */ '[data-careersite-propertyid="adcode"]',  // Zoho "Job requisition ID" (Deloitte, Mahindra)
            /* 6 */ '[data-careersite-propertyid="jobid"]',
            /* 7 */ '[class*="job-id"]',
            /* 8 */ '[class*="jobid"]',
            /* 9 */ '[data-test="job-id"]',
            /* 10*/ '[data-job-id]',
            /* 11*/ '[id*="job-id"]',
            /* 12*/ '.req-id',
            /* 13*/ '[class*="req-id"]',
            /* 14*/ '.reference-id',
            /* 15*/ '[class*="reference"]',
          ]);

          // 15. data-job-id attribute
          if (!jobId) {
            jobId = document.querySelector('[data-job-id]')?.getAttribute('data-job-id') || '';
          }

          // 16. JSON-LD identifier
          if (!jobId && ld) {
            jobId = ld.identifier?.value || String(ld.identifier || '') || '';
          }

          // 17. "Reference #" / "Ref No"
          if (!jobId) jobId = fullText.match(/Ref(?:erence)?\s*(?:No|#|ID)[:\s]*(\S+)/i)?.[1] || '';

          // 18. "Position ID"
          if (!jobId) jobId = fullText.match(/Position\s*ID[:\s]*(\S+)/i)?.[1] || '';

          // 19. "Opening ID"
          if (!jobId) jobId = fullText.match(/Opening\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1] || '';

          // 20. "Vacancy ID"
          if (!jobId) jobId = fullText.match(/Vacancy\s*(?:ID|No|#)[:\s]*(\S+)/i)?.[1] || '';

          // ─────────────────────────────────────────────
          // ✅ RETURN
          // ─────────────────────────────────────────────
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
        });

        console.log(`✅ Done: ${url}`);
        console.log(job);

        const jobs = job && job.title !== 'Not Found' ? [job] : [];

        let urlJobsSaved = 0;
        
        // Fetch existing jobs for this URL to preserve their IDs and is_approved status
        const { data: existingJobsForUrl } = await supabase.from('jobs').select('id, apply_link, is_approved').eq('source_url', url);
        const existingLinks = new Map(existingJobsForUrl?.map(j => [j.apply_link, j]) || []);

        if (jobs.length > 0) {
          const cid = await getOrCreateCompany(jobs[0].company);
          if (cid && runLogId) {
            await supabase.from('scraper_logs').update({ company_id: cid }).eq('id', runLogId);
          }
        }

        // Delete jobs that are no longer on the page (to match original behavior of cleaning up stale jobs)
        const scrapedLinks = new Set(jobs.map(j => j.applyLink));
        const jobsToDelete = (existingJobsForUrl || []).filter(j => !scrapedLinks.has(j.apply_link));
        for (const jobToDelete of jobsToDelete) {
           await supabase.from('jobs').delete().eq('id', jobToDelete.id);
        }

        for (const job of jobs) {
          const companyId = await getOrCreateCompany(job.company);
          if (!companyId) continue;
          
          const existingJob = existingLinks.get(job.applyLink);
          const focusKeyword = `${job.title} ${job.location.split(',')[0]}`.trim();
          const category = (job.title && (job.title.match(/(engineer|developer|architect|tech)/i))) ? "Engineering" : "General";
          const url_slug = focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const date_posted = job.date !== 'Not Found' && job.date !== '' ? job.date : new Date().toISOString().split('T')[0];

          if (existingJob) {
            if (scraperFilters.duplicateJob === 'Skip') {
              continue;
            } else {
              // Overwrite: UPDATE existing instead of delete/insert to preserve is_approved
              const { error } = await supabase.from('jobs').update({
                title: job.title, 
                company_id: companyId, 
                description: job.description, 
                location: job.location,
                salary_range: job.salary, 
                job_type: scraperFilters.jobType === 'All' ? 'Full-time' : scraperFilters.jobType, 
                experience_level: job.experience,
                category: category, 
                source_url: url,
                date_posted: date_posted, 
                focus_keyword: focusKeyword,
                url_slug: url_slug
                // Do NOT update is_approved!
              }).eq('id', existingJob.id);

              if (!error) { 
                urlJobsSaved++; 
                totalJobsSaved++; 
                console.log(`💾 Updated Job: ${job.title} (${job.company})`);
              } else {
                console.error(`❌ Error updating job ${job.title}:`, error.message);
              }
            }
          } else {
            // INSERT new job
            const { error } = await supabase.from('jobs').insert([{
              title: job.title, 
              company_id: companyId, 
              description: job.description, 
              location: job.location,
              salary_range: job.salary, 
              job_type: scraperFilters.jobType === 'All' ? 'Full-time' : scraperFilters.jobType, 
              experience_level: job.experience,
              category: category, 
              apply_link: job.applyLink, 
              source_url: url,
              date_posted: date_posted, 
              focus_keyword: focusKeyword,
              url_slug: url_slug,
              is_approved: false
            }]);

            if (!error) { 
              urlJobsSaved++; 
              totalJobsSaved++; 
              console.log(`💾 Saved Job: ${job.title} (${job.company})`);
            } else {
              console.error(`❌ Error saving job ${job.title}:`, error.message);
            }
          }
        }

        if (runLogId) {
          await supabase.from('scraper_logs').update({ 
            status: 'completed', jobs_found: urlJobsSaved, 
            error_message: `${url}`
          }).eq('id', runLogId);
        }
      } catch (err) {
        console.log(`❌ Failed: ${url}`, err.message);
        if (runLogId) await supabase.from('scraper_logs').update({ status: 'failed', error_message: err.message }).eq('id', runLogId);
      }
      
      await page.close();
    }

    await browser.close();
    console.log("👋 Scraper finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  }
}

scrapeJobs();