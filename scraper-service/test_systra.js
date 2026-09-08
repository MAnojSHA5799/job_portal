const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
    const page = await context.newPage();

    console.log('Navigating to SYSTRA join-us...');
    await page.goto('https://www.systra.com/en/join-us/?country=india_en&pa=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    const countryVal = await page.evaluate(() => document.querySelector('#country')?.value);
    console.log('#country select value on load:', countryVal);

    const totalRes = await page.evaluate(() => document.querySelector('#total-results')?.innerText);
    console.log('#total-results on load:', totalRes);

    let pageNum = 1;
    while (pageNum <= 10) {
        await page.waitForSelector('.jobs_wrapper a.job', { timeout: 10000 }).catch(() => {});
        const jobs = await page.evaluate(() => Array.from(document.querySelectorAll('.jobs_wrapper a.job .content p')).map(p => p.innerText.trim()));
        console.log(`Page ${pageNum} jobs count: ${jobs.length}, first job: "${jobs[0]}"`);

        const nextClicked = await page.evaluate(() => {
            const nextA = document.querySelector('a.next.page-numbers, a.nav_next');
            if (nextA) {
                nextA.click();
                return true;
            }
            return false;
        });

        if (!nextClicked) {
            console.log('No next button found');
            break;
        }

        const firstJobCurrent = jobs[0];
        await page.waitForFunction((prevFirstJob) => {
            const newFirst = document.querySelector('.jobs_wrapper a.job .content p')?.innerText?.trim();
            return newFirst && newFirst !== prevFirstJob;
        }, firstJobCurrent, { timeout: 10000 }).catch(() => console.log('Timeout waiting for next page AJAX'));

        pageNum++;
    }

    await browser.close();
})();
