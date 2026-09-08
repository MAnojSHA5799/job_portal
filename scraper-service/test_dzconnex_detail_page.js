const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const detailUrl = 'https://ir-jobs.dzconnex.com/job-details/lead-management-specialist-in-marketing-jobs-1710863';
    console.log(`Navigating to detail page: ${detailUrl}...`);
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
    console.log('Body Text snippet:', bodyText);

    const htmlSnippet = await page.evaluate(() => {
        const container = document.querySelector('.shmJobDetails, .job-details, #dm, .dmwr') || document.body;
        return container.innerHTML.slice(0, 1500);
    });
    console.log('HTML snippet:', htmlSnippet);
    await browser.close();
})();
