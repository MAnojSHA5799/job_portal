const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('https://careers.gevernova.com/ai-product-manager/job/R5052096', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    const html = await page.evaluate(() => {
        return document.body.innerHTML;
    });
    
    fs.writeFileSync('/Users/manojshakya/Desktop/job_portal/scraper-service/gevernova_detail_dump.html', html);
    console.log('Dumped detail page HTML');
    
    await browser.close();
})();
