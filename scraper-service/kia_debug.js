const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'] 
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    console.log("Navigating...");
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log("Waiting for network idle or timeout...");
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'kia_debug.png' });
    console.log("Screenshot saved to kia_debug.png");
    
    const count = await page.locator('.row.align-items-center').count();
    console.log(`Found ${count} rows`);
    
    const title = await page.title();
    console.log(`Title: ${title}`);
    
    await browser.close();
})();
