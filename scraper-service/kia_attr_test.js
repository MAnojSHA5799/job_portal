const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);

    // Intercept Angular's internal data by looking at all attributes including data-* attrs
    const cardData = await page.evaluate(() => {
        const cards = document.querySelectorAll('mat-card, .mat-mdc-card');
        const info = [];
        cards.forEach(card => {
            const title = card.querySelector('mat-card-title')?.innerText?.trim();
            
            // Get ALL attributes
            const attrs = {};
            for (const attr of card.attributes) {
                attrs[attr.name] = attr.value;
            }
            
            // Also check if the card itself has an id or data attribute
            const allAttrs = {};
            card.querySelectorAll('*').forEach(el => {
                for (const attr of el.attributes) {
                    if (attr.name.includes('data-') || attr.name.includes('id') || attr.name.includes('job')) {
                        allAttrs[attr.name] = attr.value;
                    }
                }
            });
            
            info.push({ title, cardAttrs: attrs, childAttrs: allAttrs });
        });
        return info;
    });
    
    console.log("First card data:");
    console.log(JSON.stringify(cardData[0], null, 2));
    
    await browser.close();
})();
