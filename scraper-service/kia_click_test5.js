const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    // Check for and dismiss the fraud warning overlay
    const overlayVisible = await page.$('.cdk-overlay-container .cdk-overlay-backdrop');
    if (overlayVisible) {
        console.log("Overlay detected! Dismissing...");
        
        // Try to find a close/OK button inside the dialog
        const closeBtn = await page.$('.cdk-overlay-container button, .cdk-overlay-container [mat-dialog-close], .cdk-overlay-container .close-btn, .cdk-overlay-container mat-dialog-actions button');
        if (closeBtn) {
            await closeBtn.click();
            console.log("Clicked close button");
        } else {
            // Click the backdrop to dismiss
            await page.keyboard.press('Escape');
            console.log("Pressed Escape to dismiss");
        }
        await page.waitForTimeout(2000);
    }
    
    // Now click the title
    const firstTitle = await page.$('.mat-mdc-card-title');
    if (firstTitle) {
        console.log("Clicking title...");
        await firstTitle.click({ force: true });
        await page.waitForTimeout(5000); 
        
        console.log("Current URL after title click:", page.url());
        
        const hasJobView = await page.$('.job-view.container');
        console.log("Has .job-view.container:", !!hasJobView);
        if (hasJobView) {
            const desc = await page.$eval('.job-view.container', el => el.innerText.substring(0, 500));
            console.log("Details:", desc);
        }
    }
    
    await browser.close();
})();
