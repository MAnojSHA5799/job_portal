const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('https://jobs.bosch.com/en/?pages=1&country=in', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e=>console.log(e.message));
        await page.waitForTimeout(5000);
        const html = await page.content();
        if (html.includes('cookie') || html.includes('consent') || html.includes('accept')) {
            console.log('Cookie banner found!');
        }
        
        // Let's take a screenshot to see what it actually shows
        await page.screenshot({ path: 'bosch.png' });
        console.log('Screenshot saved to bosch.png');
    } catch(e) {
        console.log('Error:', e.message);
    }
    await browser.close();
})();
