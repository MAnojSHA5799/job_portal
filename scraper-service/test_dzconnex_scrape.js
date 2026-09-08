const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log('Navigating to DZConnex...');
    await page.goto('https://ir-jobs.dzconnex.com/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.shmJobResultStd, .shmJobResult', { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(3000);

    let pageNum = 1;
    const collected = [];

    while (pageNum <= 3) {
        const pageJobs = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.shmJobResultStd, .shmJobResult'));
            return cards.map(card => {
                const titleA = card.querySelector('a.shmJobtitle, .shmJobtitle a');
                const locEl = card.querySelector('.shmLocation');
                const dateEl = card.querySelector('.shmJobDateCreated, .shmTimePostedText');
                const detailUrl = titleA?.href || card.querySelector('a.shmGoReadMore')?.href;

                return {
                    title: titleA?.innerText?.trim() || 'Not Found',
                    location: locEl?.innerText?.trim() || 'Unknown',
                    date: dateEl?.innerText?.trim() || 'Not Found',
                    detailUrl,
                    applyLink: detailUrl,
                    company: 'Ingersoll Rand'
                };
            }).filter(j => j.detailUrl && j.title !== 'Not Found');
        });

        console.log(`Page ${pageNum}: Collected ${pageJobs.length} jobs. First: "${pageJobs[0]?.title}" (${pageJobs[0]?.detailUrl})`);
        collected.push(...pageJobs);

        // Test pagination click
        const firstUrlCurrent = pageJobs[0]?.detailUrl;
        const clicked = await page.evaluate((currPage) => {
            // Find next page button in .section-job-results-paging
            const pagingButtons = Array.from(document.querySelectorAll('.section-job-results-paging a.button-paging'));
            // Find next page button by data-page-number = currPage or last child not disabled
            const nextBtn = pagingButtons.find(a => a.getAttribute('data-page-number') === String(currPage) && !a.classList.contains('active') && !a.classList.contains('disabled'))
                || pagingButtons[pagingButtons.length - 1];
            if (nextBtn && !nextBtn.classList.contains('disabled')) {
                nextBtn.click();
                return true;
            }
            return false;
        }, pageNum);

        if (!clicked) {
            console.log('No next page button or disabled.');
            break;
        }

        console.log(`Clicked next page (${pageNum + 1})...`);
        pageNum++;

        const updated = await page.waitForFunction((prevUrl) => {
            const firstA = document.querySelector('.shmJobResultStd a.shmJobtitle, .shmJobResult a.shmJobtitle');
            return firstA && firstA.href !== prevUrl;
        }, firstUrlCurrent, { timeout: 15000 }).catch(() => null);

        if (!updated) {
            console.log('Timeout waiting for next page AJAX update.');
            break;
        }
        await page.waitForTimeout(2000);
    }

    console.log(`Total test jobs collected: ${collected.length}`);
    if (collected.length > 0) {
        console.log('Sample Job:', collected[0]);
    }

    await browser.close();
})();
