const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchJobUrls() {
  console.log("📥 Fetching target URLs from Supabase...");
  const { data, error } = await supabase
    .from('scraper_urls')
    .select('url')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Failed to fetch database URLs:', error.message);
    return [];
  }
  
  const urls = data.map(d => d.url);
  console.log(`✅ Loaded ${urls.length} active target URLs.`);
  return urls;
}

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
  let logId = null;

  try {
    const startTime = Date.now();
    // Initial log entry
    const { data: logData } = await supabase
      .from('scraper_logs')
      .insert([{ status: 'running', jobs_found: 0 }])
      .select('id')
      .single();
    logId = logData?.id;

    // ... rest of the code ...

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // duration in seconds

    console.log(`📦 Scrape Summary: Found ${totalJobsFound}, Saved ${totalJobsSaved} new jobs. Duration: ${duration}s`);
    
    // Update log to completed
    if (logId) {
      await supabase
        .from('scraper_logs')
        .update({ 
          status: 'completed', 
          jobs_found: totalJobsFound,
          duration: duration
        })
        .eq('id', logId);
    }

    await browser.close();
  } catch (err) {
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    console.error("❌ Fatal Error:", err);
    if (logId) {
      await supabase
        .from('scraper_logs')
        .update({ 
          status: 'failed', 
          error_message: err.message,
          duration: duration
        })
        .eq('id', logId);
    }
  }
}

scrapeJobs();
