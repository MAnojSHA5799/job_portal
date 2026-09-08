const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('https://jobs.bosch.com/en/?pages=1&country=in', { waitUntil: 'commit', timeout: 30000 }).catch(()=>{});
        await page.waitForTimeout(5000);
        
        // Find accept button
        const clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a'));
            const acceptBtn = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('accept'));
            if (acceptBtn) {
                acceptBtn.click();
                return acceptBtn.innerText;
            }
            return false;
        });
        console.log('Clicked cookie button:', clicked);
        
        await page.waitForTimeout(5000);
        
        const cards = await page.$$('.M-JobSearchResultsGroup__item');
        console.log('Found cards after accept:', cards.length);
        
    } catch(e) {
        console.log('Error:', e.message);
    }
    await browser.close();
})();
