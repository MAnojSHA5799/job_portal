const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration (Use environment variables for security)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
              results.push({
                jobId: jobIdMatch ? jobIdMatch[1] : null,
                title: title,
                companyName: document.title.split("|")[0].split("-")[0].trim(),
                location: text.includes("India") ? "India" : (lines.find(l => l.includes(",") || (l.length < 30 && l.length > 3)) || "Remote/Global"),
                salary_range: text.match(/(?:Rs|INR|USD|\$|£|€)\s*[\d,]+(?:\s*-\s*[\d,]+)?/i)?.[0] || "Not disclosed",
                description: lines.slice(1, 4).join(" ").substring(0, 300),
                experience_level: text.match(/(\d+[-/]\d+|\d+)\+?\s*(?:years|yrs|exp)/i)?.[0] || "Not specified",
                apply_link: el.href && el.href.startsWith('http') ? el.href : window.location.href,
                source_url: currentUrl,
                date_posted: new Date().toISOString().split('T')[0],
                category: text.toLowerCase().includes("engineer") ? "Engineering" : "General"
              });
            }
          });
          return Array.from(new Map(results.map(j => [j.title + j.apply_link, j])).values()).slice(0, 15);
        }, url);

        console.log(`✅ Found ${jobs.length} jobs from ${url}`);

        let urlJobsSaved = 0;
        if (jobs.length > 0) {
          const cid = await getOrCreateCompany(jobs[0].companyName);
          if (cid) await supabase.from('jobs').delete().eq('company_id', cid).eq('source_url', url);
        }

        for (const job of jobs) {
          const companyId = await getOrCreateCompany(job.companyName);
          if (!companyId) continue;
          const { data: existingJob } = await supabase.from('jobs').select('id').eq('apply_link', job.apply_link).single();
          if (existingJob) continue;
          const focusKeyword = `${job.title} ${job.location.split(',')[0]}`.trim();
          const { error } = await supabase.from('jobs').insert([{
            title: job.title, company_id: companyId, description: job.description, location: job.location,
            salary_range: job.salary_range, job_type: 'Full-time', experience_level: job.experience_level,
            category: job.category, apply_link: job.apply_link, source_url: job.source_url,
            date_posted: job.date_posted, focus_keyword: focusKeyword,
            url_slug: focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            is_approved: true
          }]);
          if (!error) { urlJobsSaved++; totalJobsSaved++; }
        }

        if (runLogId) {
          await supabase.from('scraper_logs').update({ 
            status: 'completed', jobs_found: urlJobsSaved, 
            error_message: `[${urlIdentifier}] Scraped: ${jobs.length > 0 ? jobs[0].companyName : url.split('/')[2]}`
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
