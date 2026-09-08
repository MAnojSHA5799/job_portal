const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await page.waitForTimeout(10000);
    
    const jobs = await page.evaluate(() => {
        const results = [];
        const cards = document.querySelectorAll('mat-card, .mat-mdc-card');
        
        cards.forEach(card => {
            const titleEl = card.querySelector('mat-card-title, .mat-mdc-card-title');
            if (!titleEl) return;
            
            const title = titleEl.innerText.trim();
            
            let location = 'India';
            // look for location in card content or just take all text
            const content = card.querySelector('mat-card-content, .mat-mdc-card-content');
            if(content && content.innerText.includes('Bengaluru') || content.innerText.includes('Anantapur')) {
                // simple hack, extract location lines if possible
                const lines = content.innerText.split('\n');
                if(lines.length > 0) location = lines[0].trim();
            }

            let applyLink = '';
            const btn = card.querySelector('button, a');
            if (btn && btn.getAttribute('href')) {
                applyLink = btn.getAttribute('href');
            }

            results.push({
                title,
                location,
                applyLink,
            });
        });
        return results;
    });
    
    console.log(`Found ${jobs.length} jobs.`);
    console.log(jobs.slice(0, 5));
    
    await browser.close();
})();
