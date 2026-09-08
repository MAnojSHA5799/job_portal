const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('https://careers.gevernova.com/jobs?filter%5Bcountry%5D%5B0%5D=India', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    const html = await page.evaluate(() => {
        return document.body.innerHTML;
    });
    
    const fs = require('fs');
    fs.writeFileSync('/Users/manojshakya/Desktop/job_portal/scraper-service/gevernova_dump.html', html);
    console.log('Dumped to gevernova_dump.html');
    
    await browser.close();
})();
