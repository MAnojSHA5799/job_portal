const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getOrCreateCompany(name) {
  if (!name) return null;
  const cleanName = name.split('|')[0].split('-')[0].split('–')[0].trim();

  // Try to find existing company
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', cleanName)
    .single();

  if (existingCompany) return existingCompany.id;

  // Create new company if not found
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
  console.log("🚀 Starting Playwright Multi-Site Scraper with DB Integration...");
  
  try {
    // Fetch Target URLs
    const { data: targetUrls, error: urlsError } = await supabase
      .from('scraper_urls')
      .select('url')
      .eq('is_active', true);

    if (urlsError) {
      console.error("⚠️ Failed to fetch target URLs:", urlsError.message);
    }
    
    const jobUrls = targetUrls ? targetUrls.map(t => t.url) : [];

    if (jobUrls.length === 0) {
      console.log("No active target URLs found. Exiting.");
      process.exit(0);
    }

    console.log(`📡 Fetched ${jobUrls.length} target URLs from database.`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let allScrapedJobs = [];
    let totalJobsSaved = 0;

    for (const url of jobUrls) {
      let runLogId = null;
      try {
        console.log(`🌐 Visiting: ${url}`);
        
        // Find existing log for this URL (we use error_message to match since we don't have a URL column)
        const urlIdentifier = url.split('/').pop() || url;
        const { data: existingLogs } = await supabase
          .from('scraper_logs')
          .select('id')
          .ilike('error_message', `%${urlIdentifier}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingLogs && existingLogs.length > 0) {
          runLogId = existingLogs[0].id;
          await supabase
            .from('scraper_logs')
            .update({ status: 'running', jobs_found: 0, error_message: `Running: ${urlIdentifier}`, created_at: new Date().toISOString() })
            .eq('id', runLogId);
        } else {
          const { data: newLog } = await supabase
            .from('scraper_logs')
            .insert([{ status: 'running', jobs_found: 0, error_message: `Running: ${urlIdentifier}` }])
            .select('id')
            .single();
          runLogId = newLog?.id;
        }

        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(5000);

        const jobs = await page.evaluate((currentUrl) => {
          const results = [];
          const elements = document.querySelectorAll('a, div, li, tr');

          elements.forEach((el) => {
            const text = el.innerText ? el.innerText.trim() : "";
            if (text.length < 20 || text.length > 1000) return;

            const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
            const title = lines[0];

            const hasJobKeywords = text.toLowerCase().match(/(engineer|developer|manager|associate|analyst|technician|lead|intern|designer|specialist)/);
            const hasActionKeywords = text.toLowerCase().match(/(apply|view|details|full-time|entry|senior|posted)/);
            
            if (title && title.length > 5 && title.length < 100 && hasJobKeywords && (hasActionKeywords || el.tagName === 'A')) {
              const jobIdMatch = text.match(/(?:ID|Ref|Job\sNo)[:\s]*([A-Z0-9-]+)/i) || (el.href ? el.href.match(/(\d{6,})/) : null);
              const jobId = jobIdMatch ? jobIdMatch[1] : null;

              const expMatch = text.match(/(\d+[-/]\d+|\d+)\+?\s*(?:years|yrs|exp)/i);
              const experience = expMatch ? expMatch[0] : "Not specified";

              const salaryMatch = text.match(/(?:Rs|INR|USD|\$|£|€)\s*[\d,]+(?:\s*-\s*[\d,]+)?/i);
              const salary = salaryMatch ? salaryMatch[0] : "Not disclosed";

              const location = text.includes("India") ? "India" : (lines.find(l => l.includes(",") || (l.length < 30 && l.length > 3)) || "Remote/Global");

              results.push({
                jobId: jobId,
                title: title,
                companyName: document.title.split("|")[0].split("-")[0].trim(),
                location: location,
                salary_range: salary,
                description: lines.slice(1, 4).join(" ").substring(0, 300),
                experience_level: experience,
                apply_link: el.href && el.href.startsWith('http') ? el.href : window.location.href,
                source_url: currentUrl,
                date_posted: new Date().toISOString().split('T')[0],
                category: text.toLowerCase().includes("engineer") ? "Engineering" : "General"
              });
            }
          });

          const noiseText = ['job details', 'login', 'search', 'home', 'filter', 'apply now', 'view all', 'show', 'skip to', 'cookie'];
          const unique = Array.from(new Map(results.map(j => [j.title + j.apply_link, j])).values());
          
          return unique
            .filter(j => !noiseText.some(nt => j.title.toLowerCase().includes(nt)))
            .slice(0, 15);
        }, url);

        console.log(`✅ Found ${jobs.length} jobs from ${url}`);

        let urlJobsSaved = 0;
        let detectedCompanyName = jobs.length > 0 ? jobs[0].companyName : url.split('/')[2];

        // --- REFRESH LOGIC ---
        if (jobs.length > 0) {
          const firstCompanyId = await getOrCreateCompany(jobs[0].companyName);
          if (firstCompanyId) {
            console.log(`🧹 Cleaning up old jobs for company: ${jobs[0].companyName}`);
            await supabase.from('jobs').delete().eq('company_id', firstCompanyId).eq('source_url', url);
          }
        }

        // Process each job and save to DB
        for (const job of jobs) {
          const companyId = await getOrCreateCompany(job.companyName);
          if (!companyId) continue;

          const { data: existingJob } = await supabase
            .from('jobs')
            .select('id')
            .eq('apply_link', job.apply_link)
            .single();

          if (existingJob) continue;

          const focusKeyword = `${job.title} ${job.location.split(',')[0]}`.trim();
          const urlSlug = focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

          const { error: insertError } = await supabase
            .from('jobs')
            .insert([{
              title: job.title,
              company_id: companyId,
              description: job.description,
              location: job.location,
              salary_range: job.salary_range,
              job_type: 'Full-time',
              experience_level: job.experience_level,
              category: job.category,
              apply_link: job.apply_link,
              source_url: job.source_url,
              date_posted: job.date_posted,
              focus_keyword: focusKeyword,
              url_slug: urlSlug,
              is_approved: true
            }]);

          if (!insertError) {
            urlJobsSaved++;
            totalJobsSaved++;
            allScrapedJobs.push(job);
          }
        }

        // Final Update for THIS log entry
        if (runLogId) {
          await supabase
            .from('scraper_logs')
            .update({ 
              status: 'completed', 
              jobs_found: urlJobsSaved, 
              error_message: `[${urlIdentifier}] Scraped: ${detectedCompanyName}`
            })
            .eq('id', runLogId);
        }

      } catch (err) {
        console.log(`❌ Failed: ${url}`, err.message);
        if (runLogId) {
          await supabase
            .from('scraper_logs')
            .update({ status: 'failed', error_message: err.message })
            .eq('id', runLogId);
        }
      }
    }

    // Save JSON backup
    const outputPath = path.join(__dirname, 'scraped_jobs.json');
    fs.writeFileSync(outputPath, JSON.stringify(allScrapedJobs, null, 2));

    console.log(`📦 Scrape Summary: Found ${allScrapedJobs.length} unique jobs, Saved ${totalJobsSaved} new jobs to DB.`);
    
    // Clear JSON
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2));

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  }
}

scrapeJobs();
