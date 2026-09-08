const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'] 
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    console.log("Navigating to Kia India...");
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log("Waiting 10s...");
    await page.waitForTimeout(10000);
    
    const html = await page.content();
    fs.writeFileSync('kia_html_dump.html', html);
    console.log("Saved kia_html_dump.html. Length:", html.length);
    
    await browser.close();
})();
