const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const detailUrl = 'https://konecranes.careers/job/project-manager-in-dubai-united-arab-emirates-jid-3228';
    
    console.log(`Navigating to detail page: ${detailUrl}...`);
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const detailData = await page.evaluate(() => {
        const descEl = document.querySelector(
            '.attrax-vacancy-details__description, .job-description, [data-type="JobDescriptionWidget"], .attrax-vacancy-description'
        ) || document.querySelector('.main-content, article');
        
        const desc = descEl?.innerText?.trim() || document.body?.innerText?.slice(0, 2000) || '';
        
        let jsonLdDesc = '';
        try {
            const ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}');
            if (ld.description) jsonLdDesc = ld.description.replace(/<[^>]+>/g, ' ').trim();
        } catch (_) {}
        
        const applyBtn = document.querySelector('a[href*="apply"], .attrax-vacancy-details__apply-button, a.attrax-button--apply');
        const applyLink = applyBtn?.href || window.location.href;
        
        return { descSnippet: desc.slice(0, 300), jsonLdSnippet: jsonLdDesc.slice(0, 300), applyLink };
    });
    
    console.log('Detail page data:', JSON.stringify(detailData, null, 2));
    await browser.close();
})();
