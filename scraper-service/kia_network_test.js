const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    // Intercept all API responses to find the one with job listings
    const apiResponses = [];
    page.on('response', async (response) => {
        const url = response.url();
        const ct = response.headers()['content-type'] || '';
        if ((url.includes('/api/') || url.includes('/job') || url.includes('.json')) && ct.includes('application/json')) {
            try {
                const body = await response.json().catch(() => null);
                if (body) apiResponses.push({ url, body });
            } catch(e) {}
        }
    });
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    console.log(`\nFound ${apiResponses.length} JSON API responses:\n`);
    apiResponses.forEach((r, i) => {
        console.log(`\n--- Response ${i+1}: ${r.url}`);
        const bodyStr = JSON.stringify(r.body);
        console.log(bodyStr.substring(0, 500));
    });
    
    await browser.close();
})();
