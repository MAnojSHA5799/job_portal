const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://jobs.carrier.com/en/search-jobs');
  await page.waitForTimeout(3000);
  const html = await page.content();
  console.log(html.substring(0, 1000));
  const jobCards = await page.$$eval('li.jobs-list-item, section#search-results-list ul li, .job-item', els => els.length);
  console.log('Job cards count:', jobCards);
  await browser.close();
})();
