const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = "https://careers.godrejindustries.com/in/en";
  
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(6000);
  
  const result = await page.evaluate(() => {
      // Try job list item selectors
      const li = document.querySelectorAll('li[data-ph-at-id="job-item"]');
      const liAlt = document.querySelectorAll('li.jobs-list-item');
      const cards = document.querySelectorAll('[data-ph-at-id="job-item"]');
      const paginationNext = document.querySelector('a[data-ph-at-id="pagination-next-link"]');
      
      // Get first card HTML
      const firstCard = li[0] || liAlt[0] || cards[0];
      const firstCardHTML = firstCard ? firstCard.outerHTML.slice(0, 2000) : 'No card found';
      
      // Get total job count
      const totalText = document.querySelector('[data-ph-at-id="jobs-count"]')?.innerText
          || document.querySelector('.phw-result-count')?.innerText
          || document.querySelector('[data-ph-at-id="search-count-text"]')?.innerText
          || '';
      
      // Check link structure
      const firstLink = document.querySelector('a[data-ph-at-id="job-link"]');
      
      return {
          liCount: li.length,
          liAltCount: liAlt.length,
          cardsCount: cards.length,
          totalText,
          hasPaginationNext: !!paginationNext,
          paginationHref: paginationNext?.href || '',
          firstLinkHref: firstLink?.href || '',
          firstLinkTitle: firstLink?.getAttribute('data-ph-at-job-title-text') || firstLink?.innerText?.trim() || '',
          firstCardHTML
      };
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
