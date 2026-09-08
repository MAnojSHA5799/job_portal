const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Inject script to listen for postMessage
    await page.addInitScript(() => {
        window.interceptedPayloads = [];
        const originalPostMessage = window.parent.postMessage;
        window.parent.postMessage = function(message, targetOrigin, transfer) {
            console.log('PARENT POSTMESSAGE:', message);
            window.interceptedPayloads.push(message);
            // Don't call original if it breaks things, but we can call it
        };
    });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.card-wrap', { timeout: 30000 });
    
    const card = page.locator('.card-wrap').first();
    const viewBtn = card.locator('button:has-text("View Details"), .cancel-job-btn').first();
    await viewBtn.click({ force: true });
    
    await page.waitForSelector('view-jd-dialog', { timeout: 12000 });
    
    console.log("Clicking Apply Job inside modal...");
    const applyModalBtn = page.locator('view-jd-dialog button.apply-btn').first();
    await applyModalBtn.click({ force: true });
    
    await page.waitForTimeout(1000);
    
    const payloads = await page.evaluate(() => window.interceptedPayloads);
    console.log("Payloads intercepted:", payloads);
    
    await browser.close();
})();
