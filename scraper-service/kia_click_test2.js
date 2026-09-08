const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    // Evaluate cards to find any IDs or links
    const cardData = await page.evaluate(() => {
        const firstCard = document.querySelector('.mat-mdc-card');
        if(!firstCard) return null;
        
        let href = null;
        let id = firstCard.id;
        const link = firstCard.querySelector('a');
        if(link) href = link.href;
        
        return { href, id, innerHTML: firstCard.innerHTML.slice(0, 1000) };
    });
    
    console.log("Card Data:", cardData);
    
    // Click the first card
    const firstCard = await page.$('.mat-mdc-card');
    if (firstCard) {
        await firstCard.click();
        await page.waitForTimeout(5000); // Wait for modal or route change
        
        console.log("URL after click:", page.url());
        
        const hasJobView = await page.$('.job-view.container');
        console.log("Has .job-view.container:", !!hasJobView);
        
        if (hasJobView) {
            const description = await page.$eval('.job-view.container', el => {
                const desc = el.querySelector('.attribute-label:has(label:contains("Job Description")) + .attribute-data, label:contains("Job Description")');
                return desc ? desc.innerText : el.innerText.substring(0, 500);
            }).catch(() => null);
            console.log("Found Description snippet:", description);
        }
    }
    
    await browser.close();
})();
