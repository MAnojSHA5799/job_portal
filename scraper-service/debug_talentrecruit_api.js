const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('job')) {
      console.log('API Request:', request.method(), request.url());
    }
  });
  
  console.log('Navigating...');
  await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle' });
  
  console.log('Clicking first job...');
  await page.click('.card-wrap');
  
  await page.waitForTimeout(4000);
  console.log('Current URL after click:', page.url());
  
  await browser.close();
})();
