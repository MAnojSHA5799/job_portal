const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
    const page = await context.newPage();

    console.log('1. Navigating to SYSTRA...');
    await page.goto('https://www.systra.com/en/join-us/?country=india_en&pa=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const p1Jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.jobs_wrapper a.job')).map(a => ({
            href: a.href,
            title: a.querySelector('.content p')?.innerText?.trim()
        }));
    });
    console.log('Page 1 Jobs Count:', p1Jobs.length);
    console.log('Page 1 Job 0:', p1Jobs[0]);
    console.log('Page 1 Job 9:', p1Jobs[p1Jobs.length - 1]);

    const nextHref = await page.evaluate(() => {
        const nextA = document.querySelector('a.next.page-numbers, a.nav_next');
        return nextA ? { href: nextA.href, outerHTML: nextA.outerHTML } : null;
    });
    console.log('Next button:', nextHref);

    console.log('2. Testing JS synthetic click in page.evaluate...');
    const evalClicked = await page.evaluate(() => {
        const nextA = document.querySelector('a.next.page-numbers, a.nav_next');
        if (nextA) {
            nextA.click();
            return true;
        }
        return false;
    });
    console.log('evalClicked:', evalClicked);
    await page.waitForTimeout(4000);

    const afterEvalJobs = await page.evaluate(() => Array.from(document.querySelectorAll('.jobs_wrapper a.job .content p')).map(p => p.innerText.trim()));
    console.log('First job after page.evaluate click:', afterEvalJobs[0]);

    if (afterEvalJobs[0] === p1Jobs[0].title) {
        console.log('⚠️ Synthetic click did NOT change page! Testing page.click()...');
        await page.click('a.next.page-numbers, a.nav_next').catch(e => console.log('page.click error:', e.message));
        await page.waitForTimeout(4000);
        const afterPageClickJobs = await page.evaluate(() => Array.from(document.querySelectorAll('.jobs_wrapper a.job .content p')).map(p => p.innerText.trim()));
        console.log('First job after page.click():', afterPageClickJobs[0]);
    }

    await browser.close();
})();
