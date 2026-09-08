const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.addInitScript(() => {
        window.interceptedPayloads = [];
        const originalPostMessage = window.parent.postMessage;
        window.parent.postMessage = function(message, targetOrigin, transfer) {
            if (typeof message === 'string' && message.startsWith('U2FsdGVkX1')) {
                window.interceptedPayloads.push(message);
            }
            // originalPostMessage.apply(this, [message, targetOrigin, transfer]);
        };
    });

    await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.card-wrap', { timeout: 30000 });
    
    const card = page.locator('.card-wrap').first();
    const applyBtn = card.locator('button.apply-job-btn').first();
    
    await applyBtn.click({ force: true });
    await page.waitForTimeout(1000);
    
    const payload = await page.evaluate(() => window.interceptedPayloads.pop());
    console.log("Extracted payload:", payload);
    if (payload) {
        console.log("Final URL:", `https://voltas.talentrecruit.com/career-page/apply/${encodeURIComponent(payload)}?viewJD=true`);
    }
    
    await browser.close();
})();
