const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://jobs.carrier.com/en/search-jobs');
  await page.waitForTimeout(3000);
  const classes = await page.$$eval('section#search-results-list ul li', els => els.map(e => e.className));
  console.log('Classes:', classes);
  await browser.close();
})();
