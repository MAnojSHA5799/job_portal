const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    // Click the apply button on the first card
    const firstApplyBtn = await page.$('[data-testid="job-apply-btn"]');
    if (firstApplyBtn) {
        await firstApplyBtn.click();
        await page.waitForTimeout(5000); // Wait for modal or route change
        
        console.log("Current URL:", page.url());
        
        const hasJobView = await page.$('.job-view.container');
        console.log("Has .job-view.container:", !!hasJobView);
        
        if (hasJobView) {
            const desc = await page.$eval('.job-view.container', el => el.innerText.substring(0, 500));
            console.log("Details found:\n", desc);
        }
    }
    
    await browser.close();
})();
