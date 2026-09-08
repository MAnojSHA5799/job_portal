const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('Navigating (waitUntil commit)...');
    try {
        await page.goto('https://jobs.bosch.com/en/?pages=1&country=in', { waitUntil: 'commit', timeout: 30000 });
        await page.waitForTimeout(5000);
        const html = await page.content();
        if (html.includes('M-JobSearchResultsGroup__item')) {
            console.log('Cards found in HTML!');
        } else {
            console.log('HTML snippet: ', html.substring(0, 1000));
            console.log('Is access denied? ', html.includes('Access Denied') || html.includes('captcha'));
        }
    } catch(e) {
        console.log('Error:', e.message);
    }
    await browser.close();
})();
