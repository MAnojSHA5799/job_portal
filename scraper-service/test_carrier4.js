const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://jobs.carrier.com/en/search-jobs');
  await page.waitForTimeout(3000);
  const cardHTML = await page.$eval('section#search-results-list ul li', el => el.innerHTML);
  console.log(cardHTML);
  await browser.close();
})();
