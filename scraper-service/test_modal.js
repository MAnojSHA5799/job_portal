const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.card-wrap', { timeout: 30000 });
    
    const card = page.locator('.card-wrap').first();
    const viewBtn = card.locator('button:has-text("View Details"), .cancel-job-btn').first();
    await viewBtn.click({ force: true });
    
    await page.waitForSelector('mat-dialog-container', { timeout: 12000 });
    const html = await page.$eval('mat-dialog-container', el => el.innerHTML);
    console.log(html);
    
    await browser.close();
})();
