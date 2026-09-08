const fs = require('fs');

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Patch main loop goto in pog.js and scraper.js
    content = content.replace(
        "await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });\n            await page.waitForTimeout(5000);",
        "await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});\n            await page.waitForTimeout(5000);"
    );
    
    // In scraper.js, it might be:
    // await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // await page.waitForTimeout(4000);
    content = content.replace(
        "await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });\n      await page.waitForTimeout(4000);",
        "await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});\n      await page.waitForTimeout(4000);"
    );

    // Patch scrapeBosch goto
    content = content.replace(
        "await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });\n        await page.waitForTimeout(5000);\n        \n        let hasMore",
        "await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});\n        await page.waitForTimeout(5000);\n        await page.waitForSelector('.M-JobSearchResultsGroup__item', { timeout: 30000 }).catch(() => {});\n        \n        let hasMore"
    );

    fs.writeFileSync(filepath, content);
}

patchFile('/Users/manojshakya/Desktop/job_portal/scraper-service/pog.js');
patchFile('/Users/manojshakya/Desktop/job_portal/scraper-service/scraper.js');
console.log('Patched goto in both files.');
