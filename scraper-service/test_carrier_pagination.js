const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://jobs.carrier.com/en/search-jobs');
  await page.waitForTimeout(3000);
  const paginationHTML = await page.evaluate(() => {
    const btn = document.querySelector('button.load-more, a.next, .pagination');
    return btn ? btn.outerHTML : 'No pagination found';
  });
  console.log('Pagination:', paginationHTML);
  await browser.close();
})();
