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
    console.log('Waiting for job results container...');
    await page.waitForSelector('.shmJobResult, .shmJobResultStd, [data-rel="job-results-list"] div', { timeout: 25000 }).catch(e => console.log('waitForSelector timeout:', e.message));
    await page.waitForTimeout(4000);

    const jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.shmJobResult, .shmJobResultStd'));
        return cards.map(card => {
            const titleEl = card.querySelector('a.shmJobtitle, .shmJobtitle a, .shmJobtitle');
            const locEl = card.querySelector('.shmJobLocation, [class*="location"], [class*="Location"]');
            const dateEl = card.querySelector('.shmTimePostedText, [class*="TimePosted"]');
            
            // Find all <a> tags inside card
            const links = Array.from(card.querySelectorAll('a')).map(a => ({
                text: a.innerText?.trim(),
                href: a.href,
                className: a.className,
                onclick: a.getAttribute('onclick') || a.getAttribute('data-rel') || a.getAttribute('data-jobid') || a.getAttribute('data-job-id')
            }));

            return {
                title: titleEl?.innerText?.trim(),
                titleHref: titleEl?.href,
                titleOuterHTML: titleEl?.outerHTML,
                cardOuterHTML: card.outerHTML.slice(0, 500),
                loc: locEl?.innerText?.trim() || card.innerText.split('\n').filter(s => s.includes(',') || s.includes('Location'))[0] || 'Unknown',
                links
            };
        });
    });

    console.log(`Found ${jobs.length} jobs on Page 1:`);
    console.log('Sample Job 0:', jobs[0]);

    const paginationHTML = await page.evaluate(() => {
        const pag = document.querySelector('.shmResultViewPagination, .pagination, [class*="pagination"], [class*="Pagination"]');
        return pag ? pag.outerHTML : 'No pagination found';
    });
    console.log('Pagination HTML:', paginationHTML);

    await browser.close();
})();
