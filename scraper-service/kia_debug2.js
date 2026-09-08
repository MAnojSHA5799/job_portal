const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // Launch headless false to bypass basic bot protection for testing
    const browser = await chromium.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    // Inject custom headers or user agent
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    console.log("Navigating to Kia India...");
    
    // Listen to console to see if the page logs errors
    page.on('console', msg => {
        if(msg.type() === 'error') console.log(`PAGE LOG ERROR: ${msg.text()}`);
    });

    try {
        await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log("Page domcontentloaded. Waiting 10s for API responses...");
        await page.waitForTimeout(10000);
        
        // Grab all classes currently in the DOM to see what rendered
        const allClasses = await page.evaluate(() => {
            const allElements = document.querySelectorAll('*');
            const classes = new Set();
            allElements.forEach(el => {
                if(el.className && typeof el.className === 'string') {
                    el.className.split(' ').forEach(c => c && classes.add(c));
                }
            });
            return Array.from(classes).filter(c => c.includes('job') || c.includes('card') || c.includes('row') || c.includes('search'));
        });
        
        console.log("\nRelevant Classes found in DOM:");
        console.log(allClasses);
        
        // Grab body text
        const text = await page.evaluate(() => document.body.innerText.substring(0, 500).replace(/\n/g, ' '));
        console.log(`\nVisible Text snippet: ${text}`);
        
    } catch (e) {
        console.log("Error:", e);
    } finally {
        await browser.close();
    }
})();
