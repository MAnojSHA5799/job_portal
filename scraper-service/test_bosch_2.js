const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('Navigating...');
    try {
        // use 'commit' to not get stuck
        await page.goto('https://jobs.bosch.com/en/?pages=1&country=in', { waitUntil: 'commit', timeout: 60000 });
        console.log('Success commit, waiting for selector...');
        await page.waitForSelector('.M-JobSearchResultsGroup__item', { timeout: 30000 });
        console.log('Selector found!');
        
        const cards = await page.$$('.M-JobSearchResultsGroup__item');
        console.log('Found cards:', cards.length);
        
        // try to click load more
        const btn = await page.$('.M-JobSearchResultsGroup__loadMore button');
        if (btn) {
            console.log('Found load more button, clicking...');
            await btn.click();
            await page.waitForTimeout(3000);
            const cardsAfter = await page.$$('.M-JobSearchResultsGroup__item');
            console.log('Found cards after click:', cardsAfter.length);
        }
    } catch(e) {
        console.log('Error:', e.message);
    }
    
    await browser.close();
})();
