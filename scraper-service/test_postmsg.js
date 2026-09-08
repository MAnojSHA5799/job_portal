const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Inject script to listen for postMessage
    await page.addInitScript(() => {
        window.addEventListener('message', (event) => {
            console.log('INTERCEPTED MESSAGE:', event.data);
        });
        
        // Also intercept window.parent.postMessage directly
        const originalPostMessage = window.parent.postMessage;
        window.parent.postMessage = function(message, targetOrigin, transfer) {
            console.log('PARENT POSTMESSAGE CALLED:', JSON.stringify(message));
            originalPostMessage.apply(this, [message, targetOrigin, transfer]);
        };
    });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.card-wrap', { timeout: 30000 });
    
    const card = page.locator('.card-wrap').first();
    const applyBtn = card.locator('button.apply-job-btn').first();
    
    console.log("Clicking Apply button...");
    await applyBtn.click({ force: true });
    
    await page.waitForTimeout(3000);
    await browser.close();
})();
