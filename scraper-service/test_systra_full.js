const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
    const page = await context.newPage();

    console.log('Navigating to SYSTRA...');
    await page.goto('https://www.systra.com/en/join-us/?country=india_en&pa=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Close cookie banner if present
    await page.evaluate(() => {
        const acceptBtn = document.querySelector('.cky-btn-accept, [data-cookie-accept], .accept-cookies, #cky-btn-accept');
        if (acceptBtn) acceptBtn.click();
    }).catch(() => {});
    await page.waitForTimeout(1000);

    let pageNum = 1;
    const allJobs = [];

    while (true) {
        await page.waitForSelector('.jobs_wrapper a.job', { timeout: 15000 }).catch(() => {});
        const jobs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.jobs_wrapper a.job')).map(card => {
                const title = card.querySelector('.content p, .content')?.innerText?.trim() || 'Not Found';
                const location = card.querySelector('span.location')?.innerText?.trim() || 'India';
                return {
                    title,
                    location: location.replace(/\s+/g, ' ').trim(),
                    detailUrl: card.href
                };
            });
        });

        console.log(`Page ${pageNum}: Collected ${jobs.length} jobs. First: "${jobs[0]?.title}"`);
        allJobs.push(...jobs);

        const firstUrlCurrent = jobs[0]?.detailUrl;

        // Try clicking next button
        let nextClicked = false;

        // 1. Try Playwright click
        try {
            const nextElem = await page.$('a.next.page-numbers, a.nav_next');
            if (nextElem) {
                await nextElem.scrollIntoViewIfNeeded();
                await nextElem.click({ force: true });
                nextClicked = true;
            }
        } catch (e) {
            console.log('Playwright click failed:', e.message);
        }

        // 2. Fallback to JS click
        if (!nextClicked) {
            nextClicked = await page.evaluate(() => {
                const nextA = document.querySelector('a.next.page-numbers, a.nav_next');
                if (nextA) {
                    nextA.click();
                    return true;
                }
                return false;
            });
        }

        if (!nextClicked) {
            console.log('🛑 No next button found.');
            break;
        }

        pageNum++;

        const updated = await page.waitForFunction((prevUrl) => {
            const firstA = document.querySelector('.jobs_wrapper a.job');
            return firstA && firstA.href !== prevUrl;
        }, firstUrlCurrent, { timeout: 15000 }).catch(() => null);

        if (!updated) {
            console.log('⚠️ Timeout waiting for next page AJAX update.');
            break;
        }
        await page.waitForTimeout(2000);
    }

    console.log(`🎉 Total jobs collected across ${pageNum} pages: ${allJobs.length}`);
    await browser.close();
})();
