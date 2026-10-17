// Replace scrapeTtcPortals function in scraper.js with the 2-phase version
const fs = require('fs');

const code = fs.readFileSync('scraper.js', 'utf8');

const newFunc = `async function scrapeTtcPortals(page, context, listingUrl, results) {
  const subdomain = new URL(listingUrl).hostname.split('.')[0]; // e.g. 'parkercareers'
  const companyName = subdomain;
  const origin = new URL(listingUrl).origin;

  console.log(\`  📄 TTC Portals listing (\${companyName})...\`);

  // ── PHASE 1: Collect all job links across all listing pages ──────────────
  let currentUrl = listingUrl;
  let pageNum = 1;
  const allJobLinks = [];

  while (true) {
    if (pageNum > 1) {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => { });
    }
    await page.waitForSelector('div.jobs-section__item, .jobs-section__item', { timeout: 30000 }).catch(() => { });
    await page.waitForTimeout(2000);

    const { jobLinks, nextUrl } = await page.evaluate((origin) => {
      const cards = [...document.querySelectorAll('div.jobs-section__item')];
      const jobLinks = cards.map(card => {
        const a = card.querySelector('p a, a[href*="/jobs/"]');
        if (!a) return null;
        const title = a.innerText.trim();
        if (!title) return null;
        let href = a.getAttribute('href') || '';
        if (href && !href.startsWith('http')) href = origin + href;

        // Location from listing card (.large-4 columns)
        const locDiv = card.querySelector('.large-4.columns, [class*="large-4"]');
        let location = 'Not Found';
        if (locDiv) {
          const clone = locDiv.cloneNode(true);
          clone.querySelectorAll('.hide').forEach(el => el.remove());
          location = clone.innerText.replace(/\s+/g, ' ').trim().replace(/,\s*$/, '') || 'Not Found';
        }

        // Date from listing card (.large-2 columns)
        const dateDiv = card.querySelector('.large-2.columns, [class*="large-2"]');
        let date = 'Not Found';
        if (dateDiv) {
          const clone = dateDiv.cloneNode(true);
          clone.querySelectorAll('.hide-for-large').forEach(el => el.remove());
          date = clone.innerText.replace(/\s+/g, ' ').trim() || 'Not Found';
        }

        const jobId = href.split('/').filter(Boolean).pop() || '';
        return { title, location, date, detailUrl: href, jobId };
      }).filter(j => j && j.detailUrl && j.title);

      // Pagination: TTC portals uses jobs-section__paginate-view-more
      const nextLink = document.querySelector('a.jobs-section__paginate-view-more, a[href*="?page="], a[rel="next"]');
      let nextUrl = null;
      if (nextLink) {
        let href = nextLink.getAttribute('href') || '';
        if (href && !href.startsWith('http')) href = origin + href;
        nextUrl = href || null;
      }
      return { jobLinks, nextUrl };
    }, origin);

    console.log(\`     ↳ Page \${pageNum}: \${jobLinks.length} jobs found\`);
    allJobLinks.push(...jobLinks);

    if (!nextUrl) {
      console.log('     ↳ No more listing pages. Moving to detail scrape...');
      break;
    }
    console.log(\`     ↳ Next listing page \${pageNum + 1}...\`);
    currentUrl = nextUrl;
    pageNum++;
    await page.waitForTimeout(2000);
  }

  // ── PHASE 2: Visit each detail page using SAME page (same session = bypasses Cloudflare) ──
  for (const job of allJobLinks) {
    if (results.length >= MAX_JOBS) break;
    console.log(\`    🔎 \${job.title?.slice(0, 60)}\`);

    try {
      await page.goto(job.detailUrl, { waitUntil: 'domcontentloaded', timeout: 40000, referer: listingUrl });
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle').catch(() => {});

      const details = await page.evaluate(() => {
        const bodyText = document.body?.innerText || '';
        // Cloudflare detection
        const isCloudflare = /just a moment/i.test(document.title)
          || /security verification|verifies you are not a bot/i.test(bodyText.slice(0, 600));
        if (isCloudflare) return { isCloudflare: true };

        // Title: h5.job-title (TTC portals specific)
        const title = document.querySelector('h5.job-title, h1.title, h1.job-title, h1')?.innerText?.trim() || '';

        // Location: span.job-info.location parent — has "Group: X\nDivision: Y\nLocation: CITY"
        let location = '';
        const locSpan = document.querySelector('span.job-info.location');
        if (locSpan && locSpan.parentElement) {
          const parentText = locSpan.parentElement.innerText || '';
          const match = parentText.match(/Location\s*:\s*([^\n\r<]+)/i);
          if (match) location = match[1].trim();
        }

        // Date: span.job-info.posted parent
        let date = '';
        const postedSpan = document.querySelector('span.job-info.posted');
        if (postedSpan && postedSpan.parentElement) {
          const parentText = postedSpan.parentElement.innerText || '';
          const match = parentText.match(/Posted\s*:\s*([^\n\r]+)/i);
          if (match) date = match[1].trim();
        }

        // Job ID: span.job-info.jobid parent text
        let jobId = '';
        const jobIdSpan = document.querySelector('span.job-info.jobid');
        if (jobIdSpan && jobIdSpan.parentElement) {
          const parentText = jobIdSpan.parentElement.innerText || '';
          const match = parentText.match(/Job ID\s*:\s*([^\n\r]+)/i);
          if (match) jobId = match[1].trim();
        }
        if (!jobId) jobId = window.location.pathname.split('/').filter(Boolean).pop() || '';

        // Full description: .page-section-medium (the job description section)
        let desc = '';
        const descEl = document.querySelector('.page-section-medium');
        if (descEl) {
          const clone = descEl.cloneNode(true);
          clone.querySelectorAll('script, style, .branded-button-outer, .branded-button, .save-job, .job-saved, .apply, [id*="apply"]').forEach(el => el.remove());
          desc = clone.innerText.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        }

        const experience = desc.match(/(\d+\+?\s*(?:years?|yrs?)[\s\w]*experience)/i)?.[0] || 'Not Available';
        return { isCloudflare: false, title, location, date, jobId, desc, experience };
      });

      if (details.isCloudflare) {
        console.log(\`    ⚠️ Cloudflare blocked — using listing data for \${job.title}\`);
        results.push({
          source: 'ttcportals', url: job.detailUrl, title: job.title,
          location: job.location, company: companyName, date: job.date,
          experience: 'Not Available',
          description: \`\${job.title} at \${companyName}. Location: \${job.location}. Apply at: \${job.detailUrl}\`,
          applyLink: job.detailUrl, salary: 'Not Available', jobId: job.jobId, sourceUrl: listingUrl
        });
      } else {
        const finalTitle    = details.title    || job.title;
        const finalLocation = details.location || job.location;
        const finalDate     = details.date     || job.date;
        const finalJobId    = details.jobId    || job.jobId;
        const finalDesc     = details.desc     || \`\${finalTitle} at \${companyName}. Location: \${finalLocation}.\`;
        console.log(\`       ✅ \${finalTitle} | \${finalLocation} | \${finalDesc.length} chars desc\`);
        results.push({
          source: 'ttcportals', url: job.detailUrl, title: finalTitle,
          location: finalLocation, company: companyName, date: finalDate,
          experience: details.experience || 'Not Available',
          description: finalDesc, applyLink: job.detailUrl,
          salary: 'Not Available', jobId: finalJobId, sourceUrl: listingUrl
        });
      }
    } catch (e) {
      console.log(\`    ⚠️ Error — using listing data for \${job.title}\`);
      results.push({
        source: 'ttcportals', url: job.detailUrl, title: job.title,
        location: job.location, company: companyName, date: job.date,
        experience: 'Not Available',
        description: \`\${job.title} at \${companyName}. Location: \${job.location}.\`,
        applyLink: job.detailUrl, salary: 'Not Available', jobId: job.jobId, sourceUrl: listingUrl
      });
    }
    await delay(500);
  }
}`;

// Find and replace the function using regex
const funcStart = 'async function scrapeTtcPortals(page, context, listingUrl, results) {';
const startIdx = code.indexOf(funcStart);
if (startIdx === -1) { console.error('Function not found!'); process.exit(1); }

// Find the matching closing brace
let depth = 0;
let endIdx = startIdx;
for (let i = startIdx; i < code.length; i++) {
  if (code[i] === '{') depth++;
  else if (code[i] === '}') {
    depth--;
    if (depth === 0) { endIdx = i + 1; break; }
  }
}

console.log(`Found function at ${startIdx}-${endIdx} (${endIdx - startIdx} chars)`);

const newCode = code.slice(0, startIdx) + newFunc + code.slice(endIdx);
fs.writeFileSync('scraper.js', newCode);
console.log(`Done. Old size: ${code.length}, New size: ${newCode.length}`);
