const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.mat-mdc-card', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Click the first card
    const firstCard = await page.$('.mat-mdc-card');
    await firstCard.click();
    
    await page.waitForTimeout(3000); // Wait for modal or route change
    
    console.log("URL after click:", page.url());
    
    const hasJobView = await page.$('.job-view.container');
    console.log("Has .job-view.container:", !!hasJobView);
    
    await browser.close();
})();
