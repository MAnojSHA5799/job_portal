const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForSelector('.card-wrap', { timeout: 30000 });
  
  const viewBtn = page.locator('.card-wrap').nth(0).locator('button:has-text("View Details"), .cancel-job-btn').first();
  await viewBtn.click({ force: true });
  
  // Wait a bit for the page to transition
  await page.waitForTimeout(5000);
  
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('post_click.html', html);
  
  await browser.close();
})();
