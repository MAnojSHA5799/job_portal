const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  console.log('Navigating...');
  const response = await page.goto('https://voltas.talentrecruit.com/career-page', { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('Status:', response.status());
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'voltas_debug.png' });
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('voltas_debug.html', html);
  console.log('Saved screenshot and html. Body length:', html.length);
  await browser.close();
})();
