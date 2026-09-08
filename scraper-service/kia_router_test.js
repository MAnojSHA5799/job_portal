const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);

    // Try to get the Angular router link or click event bindings
    const cardData = await page.evaluate(() => {
        const cards = document.querySelectorAll('mat-card, .mat-mdc-card');
        const info = [];
        cards.forEach(card => {
            const title = card.querySelector('mat-card-title')?.innerText?.trim();
            // Look for routerLink attributes on any element
            const allEls = card.querySelectorAll('*');
            let routerLink = null;
            allEls.forEach(el => {
                const rl = el.getAttribute('routerlink') || el.getAttribute('ng-reflect-router-link') || el.getAttribute('href');
                if (rl && rl.includes('jobview')) routerLink = rl;
            });
            info.push({ title, routerLink });
        });
        return info;
    });
    
    console.log("Card router links:");
    console.log(JSON.stringify(cardData, null, 2));
    
    await browser.close();
})();
