const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.card-wrap', { timeout: 30000 });
    
    const card = page.locator('.card-wrap').first();
    const viewBtn = card.locator('button:has-text("View Details"), .cancel-job-btn').first();
    await viewBtn.click({ force: true });
    
    await page.waitForSelector('mat-dialog-container', { timeout: 12000 });
    const descText = await page.$eval('mat-dialog-container', el => el.innerText);
    
    console.log("DESCRIPTION EXTRACTED FROM MODAL:");
    console.log("-----------------------------------");
    console.log(descText.trim());
    console.log("-----------------------------------");
    
    await browser.close();
})();
