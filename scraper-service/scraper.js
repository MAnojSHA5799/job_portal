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

    if (urlsError) console.error("⚠️ URL Error:", urlsError.message);
    
    const jobUrls = targetUrls ? targetUrls.map(t => t.url) : [];

    if (jobUrls.length === 0) {
      console.log("No active target URLs found.");
      process.exit(0);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let allScrapedJobs = [];
    let totalJobsSaved = 0;

    for (const url of jobUrls) {
      let runLogId = null;
      try {
        console.log(`🌐 Visiting: ${url}`);
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

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(5000);
 
        const jobs = await page.evaluate(({ currentUrl, filters }) => {
          const results = [];
          
          // 1. UNIVERSAL COMPANY DETECTION
          let detectedCompany = document.querySelector('meta[property="og:site_name"]')?.content 
                             || document.querySelector('meta[name="application-name"]')?.content
                             || document.title.split(/[|–-]/)[0].trim();
          
          // Fallback if company name is generic
          if (detectedCompany.match(/(career|job|opening|hiring|opportunity|portal|work)/i) || detectedCompany.length < 2) {
            detectedCompany = window.location.hostname.replace('www.', '').split('.')[0].toUpperCase();
          }

          // 2. EXPANDED UNIVERSAL SELECTORS & PATTERNS
          const elements = document.querySelectorAll('a, div, li, tr, section, article, [class*="job"], [id*="job"]');
          const ageMap = { '24h': 1, '7d': 7, '30d': 30, '60d': 60 };
          
          // Universal Role Keywords (Tech, Sales, HR, Marketing, Finance, Admin, etc.)
          const roleRegex = /(engineer|developer|manager|associate|analyst|technician|lead|intern|designer|specialist|architect|consultant|executive|coordinator|strategist|operator|representative|accountant|recruiter|hr|legal|sales|marketing|support|admin|writer|editor|producer|nurse|doctor|teacher|driver|chef|assistant)/i;
          const noiseTitleRegex = /(team|culture|about|work|join|life|mission|values|story|benefit|people|community|diversity)/i;

          const expKeywords = {
            'Entry': ['entry', 'junior', 'intern', 'fresher', 'associate', '0-2 years', '0-1 years'],
            'Mid': ['mid', 'intermediate', '3-5 years', '2-4 years', '2-5 years'],
            'Senior': ['senior', 'sr', '5+ years', '8+ years', '5-10 years'],
            'Lead': ['lead', 'principal', 'staff', 'manager', 'director', '10+ years']
          };

          elements.forEach((el) => {
            const text = el.innerText ? el.innerText.trim() : "";
            if (text.length < 20 || text.length > 4000) return;
            
            const lowerText = text.toLowerCase();
            const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length < 1) return;

            // 3. UNIVERSAL JOB IDENTIFICATION
            // Look for title: usually in the first 3 lines, matches role keywords, and isn't noise
            const title = lines.slice(0, 3).find(l => 
              l.length > 4 && l.length < 120 && 
              roleRegex.test(l) && 
              !noiseTitleRegex.test(l)
            );
            
            if (!title) return;

            // Check if it's a valid job container (has action words, links, or specific metadata)
            const isJobElement = lowerText.match(/(apply|view|details|full-time|posted|remote|onsite|hybrid|salary|experience|yrs|yrs|location|shift)/i)
                              || el.tagName === 'A' 
                              || el.querySelector('a');
            
            if (!isJobElement) return;

            // 4. UNIVERSAL FILTERING LOGIC
            
            // Job Type Detection
            let detectedJobType = 'Full-time';
            if (lowerText.includes('intern')) detectedJobType = 'Internship';
            else if (lowerText.includes('contract') || lowerText.includes('temporary')) detectedJobType = 'Contract';
            else if (lowerText.includes('freelance')) detectedJobType = 'Freelance';
            else if (lowerText.includes('part-time')) detectedJobType = 'Part-time';

            if (filters.jobType !== 'All') {
              const targetType = filters.jobType.toLowerCase();
              if (!lowerText.includes(targetType) && detectedJobType.toLowerCase() !== targetType) return;
            }

            // Experience Detection (Regex & Keywords)
            let detectedExpLevel = 'Unknown';
            const expMatch = text.match(/(\d+)\s*(?:-|to|\+)?\s*(\d+)?\s*(?:years|yrs|exp)/i);
            if (expMatch) {
              const years = parseInt(expMatch[1]);
              if (years <= 1) detectedExpLevel = 'Entry';
              else if (years <= 4) detectedExpLevel = 'Mid';
              else if (years <= 8) detectedExpLevel = 'Senior';
              else detectedExpLevel = 'Lead';
            } else {
              for (const [level, keywords] of Object.entries(expKeywords)) {
                if (keywords.some(kw => lowerText.includes(kw))) { detectedExpLevel = level; break; }
              }
            }

            if (filters.experienceLevel !== 'All' && detectedExpLevel !== 'Unknown' && detectedExpLevel !== filters.experienceLevel) {
              return;
            }

            // Country/Location Detection
            if (filters.country !== 'All') {
              const countryLower = filters.country.toLowerCase();
              const countryKeywords = [countryLower];
              if (filters.country === 'India') countryKeywords.push('noida', 'bangalore', 'bengaluru', 'mumbai', 'pune', 'delhi', 'gurgaon', 'gurugram', 'chennai', 'hyderabad', 'kolkata');
              if (!countryKeywords.some(kw => lowerText.includes(kw))) return;
            }

            // Job Age Filtering
            if (filters.jobAge !== 'Any') {
              const maxDays = ageMap[filters.jobAge] || 999;
              const ageMatch = text.match(/(\d+)\s*(?:day|hour|h|d|week|w)s?\s*ago/i);
              if (ageMatch) {
                let days = parseInt(ageMatch[1]);
                const unit = ageMatch[0].toLowerCase();
                if (unit.includes('hour') || unit.includes('h')) days = 0;
                if (unit.includes('week') || unit.includes('w')) days *= 7;
                if (days > maxDays) return;
              }
            }

            // 5. DATA EXTRACTION
            const location = lines.find(l => 
              (l.includes(",") || l.match(/(remote|hybrid|onsite|india|usa|uk|uae|dubai|office)/i)) 
              && l !== title && l.length < 60
            ) || "Remote/Global";

            results.push({
              jobId: text.match(/(?:ID|Ref|Job\sNo)[:\s]*([A-Z0-9-]+)/i)?.[1] || (el.href ? el.href.match(/(\d{6,})/)?.[1] : null),
              title: title,
              companyName: detectedCompany,
              location: location,
              salary_range: text.match(/(?:Rs|INR|USD|\$|£|€)\s*[\d,]+(?:\s*-\s*[\d,]+)?/i)?.[0] || "Not disclosed",
              description: lines.slice(1, 6).join(" ").substring(0, filters.maxDescLength || 300),
              experience_level: expMatch ? expMatch[0] : (detectedExpLevel !== 'Unknown' ? detectedExpLevel : "Not specified"),
              apply_link: el.href && el.href.startsWith('http') ? el.href : (el.querySelector('a')?.href && el.querySelector('a').href.startsWith('http') ? el.querySelector('a').href : window.location.href),
              source_url: currentUrl,
              date_posted: new Date().toISOString().split('T')[0],
              category: roleRegex.test(title) ? (title.match(/(engineer|developer|architect|tech)/i) ? "Engineering" : "General") : "Other"
            });
          });
          
          return Array.from(new Map(results.map(j => [j.title + j.apply_link, j])).values()).slice(0, 30);
        }, { currentUrl: url, filters: scraperFilters });

        console.log(`✅ Found ${jobs.length} jobs from ${url}`);

        let urlJobsSaved = 0;
        if (jobs.length > 0) {
          const cid = await getOrCreateCompany(jobs[0].companyName);
          if (cid) {
            await supabase.from('jobs').delete().eq('company_id', cid).eq('source_url', url);
            // Link this log run to the company
            if (runLogId) {
              await supabase.from('scraper_logs').update({ company_id: cid }).eq('id', runLogId);
            }
          }
        }

        for (const job of jobs) {
          const companyId = await getOrCreateCompany(job.companyName);
          if (!companyId) continue;
          
          const { data: existingJob } = await supabase.from('jobs').select('id').eq('apply_link', job.apply_link).single();
          
          if (existingJob) {
            if (scraperFilters.duplicateJob === 'Skip') {
              continue;
            } else {
              // Overwrite: delete existing first
              await supabase.from('jobs').delete().eq('id', existingJob.id);
            }
          }

          const focusKeyword = `${job.title} ${job.location.split(',')[0]}`.trim();
          const { error } = await supabase.from('jobs').insert([{
            title: job.title, company_id: companyId, description: job.description, location: job.location,
            salary_range: job.salary_range, job_type: scraperFilters.jobType === 'All' ? 'Full-time' : scraperFilters.jobType, 
            experience_level: job.experience_level,
            category: job.category, apply_link: job.apply_link, source_url: job.source_url,
            date_posted: job.date_posted, focus_keyword: focusKeyword,
            url_slug: focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            is_approved: false
          }]);
          if (!error) { urlJobsSaved++; totalJobsSaved++; }
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
