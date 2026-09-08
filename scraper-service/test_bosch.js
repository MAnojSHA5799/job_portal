const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    console.log('Navigating (waitUntil commit)...');
    try {
        await page.goto('https://jobs.bosch.com/en/?pages=1&country=in', { waitUntil: 'commit', timeout: 30000 });
        console.log('Success (commit)');
    } catch(e) {
        console.log('Error (commit):', e.message);
    }
    
    await page.waitForTimeout(10000); // wait 10 seconds to see if it loads async
    
    // Check if we can find the jobs
    try {
        const cards = await page.$$('.M-JobSearchResultsGroup__item');
        console.log('Found cards:', cards.length);
    } catch(e) {}
    
    await browser.close();
})();
