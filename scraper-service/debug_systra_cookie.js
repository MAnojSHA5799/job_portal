const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
    const page = await context.newPage();

    console.log('Navigating to SYSTRA...');
    await page.goto('https://www.systra.com/en/join-us/?country=india_en&pa=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    const overlays = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, a, div')).filter(el => {
            const txt = el.innerText?.toLowerCase() || '';
            return txt.includes('accept') || txt.includes('agree') || txt.includes('cookie') || txt.includes('consent');
        });
        return els.map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: el.innerText?.slice(0, 50)
        }));
    });
    console.log('Cookie/Overlay elements found:', overlays);

    await browser.close();
})();
