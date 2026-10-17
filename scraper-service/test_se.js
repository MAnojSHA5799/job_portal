const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://careers.se.com/jobs?location=United%20States&woe=12&regionCode=IN&stretchUnit=MILES&stretch=10&page=1', {waitUntil: 'networkidle'});
  await page.waitForTimeout(5000); // wait a bit
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('se_html.txt', html);
  const items = await page.$$eval('li', els => els.slice(0, 10).map(e => e.className).join(', '));
  console.log('Li classes:', items);
  const jobItems = await page.$$eval('.job-title', els => els.length);
  console.log('Items with .job-title:', jobItems);
  const searchItems = await page.$$eval('.search-result-item', els => els.length);
  console.log('Items with .search-result-item:', searchItems);
  await browser.close();
})();
