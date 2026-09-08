const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = "https://careers.godrejindustries.com/in/en";
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(6000);
  
  const result = await page.evaluate(() => {
      // Find all job links
      const jobLinks = [...document.querySelectorAll('a[data-ph-at-id="job-link"]')];
      
      // Get pagination info
      const nextLink = document.querySelector('a[data-ph-at-id="pagination-next-link"]');
      const totalCount = document.querySelector('[data-ph-at-id="total-job-count"]')?.innerText
        || document.querySelector('[data-ph-at-id="jobs-count"]')?.innerText
        || document.querySelector('[aria-label*="jobs"]')?.innerText
        || '';
      
      // Get the parent li/div of the first link
      const first = jobLinks[0];
      const parent = first?.closest('li') || first?.closest('[class*="job"]') || first?.parentElement;
      
      return {
          jobCount: jobLinks.length,
          totalCountText: totalCount,
          nextHref: nextLink?.href || '',
          firstJobTitle: jobLinks[0]?.getAttribute('data-ph-at-job-title-text') || jobLinks[0]?.innerText?.trim() || '',
          firstJobHref: jobLinks[0]?.href || '',
          firstJobLocation: jobLinks[0]?.getAttribute('data-ph-at-job-location-area-text') || '',
          firstJobCategory: jobLinks[0]?.getAttribute('data-ph-at-job-category-text') || '',
          firstJobDate: jobLinks[0]?.getAttribute('data-ph-at-job-post-date-text') || '',
          firstJobId: jobLinks[0]?.getAttribute('data-ph-at-job-id-text') || '',
          parentHTML: parent?.outerHTML?.slice(0, 1000) || 'no parent',
          // Get all title+location pairs
          jobs: jobLinks.slice(0, 5).map(a => ({
              title: a.getAttribute('data-ph-at-job-title-text') || a.innerText?.trim(),
              href: a.href,
              location: a.getAttribute('data-ph-at-job-location-area-text') || '',
              category: a.getAttribute('data-ph-at-job-category-text') || '',
              date: a.getAttribute('data-ph-at-job-post-date-text') || '',
              jobId: a.getAttribute('data-ph-at-job-id-text') || '',
          }))
      };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
