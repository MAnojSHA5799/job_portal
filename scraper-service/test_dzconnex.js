const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
    });
    const page = await context.newPage();

    console.log('Navigating to DZConnex...');
    await page.goto('https://ir-jobs.dzconnex.com/#/', { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto error:', e.message));
    await page.waitForTimeout(5000);

    const title = await page.title();
    console.log('Page Title:', title);

    const cards = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('a, div')).filter(el => {
            return el.className && typeof el.className === 'string' && (el.className.includes('job') || el.className.includes('shm'));
        });
        return items.map(el => ({
            tagName: el.tagName,
            className: el.className,
            text: el.innerText?.slice(0, 100)
        })).slice(0, 20);
    });
    console.log('Job elements sample:', cards);

    const fullHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
    console.log('Body HTML snippet:', fullHtml);

    await browser.close();
})();
