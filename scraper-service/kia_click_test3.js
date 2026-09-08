const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    // Listen for new page events
    const pagePromise = context.waitForEvent('page').catch(() => null);
    
    // Click the first card
    const firstCard = await page.$('.mat-mdc-card');
    if (firstCard) {
        await firstCard.click();
        
        // Wait to see if a new tab opened
        let newPage = await Promise.race([pagePromise, new Promise(r => setTimeout(r, 5000))]);
        
        let targetPage = page;
        if(newPage) {
            console.log("Opened in new tab:", newPage.url());
            targetPage = newPage;
            await targetPage.waitForLoadState('domcontentloaded');
            await targetPage.waitForTimeout(2000);
        } else {
            console.log("No new tab. Current URL:", page.url());
        }
        
        const hasJobView = await targetPage.$('.job-view.container');
        console.log("Has .job-view.container on target page:", !!hasJobView);
        
        if (hasJobView) {
            const desc = await targetPage.$eval('.job-view.container', el => el.innerText.substring(0, 500));
            console.log("Details found!");
        }
    }
    
    await browser.close();
})();
