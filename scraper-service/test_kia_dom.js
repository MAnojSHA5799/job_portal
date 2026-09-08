const { chromium } = require('playwright');

async function scrapeKiaIndia() {
    const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'] 
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    console.log("Navigating to Kia India...");
    
    try {
        await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log("Page loaded. Waiting for jobs...");
        
        await page.waitForTimeout(5000); // Wait for Angular to render

        const jobs = await page.evaluate(() => {
            const results = [];
            // Assuming Zwayam Angular layout has cards with class containing 'job' or specific rows
            const cards = document.querySelectorAll('.job-card, .job-row, .row.align-items-center.mb-3');
            
            cards.forEach(card => {
                const titleEl = card.querySelector('.job-title');
                if (!titleEl) return;
                
                const title = titleEl.innerText.trim();
                
                let location = 'India';
                const locEl = Array.from(card.querySelectorAll('.label')).find(el => el.innerText.includes('Location'));
                if (locEl && locEl.nextElementSibling) {
                    location = locEl.nextElementSibling.innerText.trim();
                }

                // Try to find the apply/detail link
                let applyLink = '';
                const linkEl = card.querySelector('a.job-title, a[href*="apply"], a[href*="job"]');
                if (linkEl && linkEl.href) {
                    applyLink = linkEl.href;
                } else {
                    // Fallback: sometimes click is handled via JS, we might have to construct it or use a fallback
                    applyLink = window.location.href; 
                }

                results.push({
                    title,
                    location,
                    applyLink,
                    company: 'Kia India'
                });
            });
            return results;
        });
        
        console.log(`Found ${jobs.length} jobs.`);
        console.log(JSON.stringify(jobs.slice(0, 2), null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

scrapeKiaIndia();
