const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Listen for new pages (tabs)
    context.on('page', async newPage => {
        console.log("NEW TAB OPENED! URL:", newPage.url());
        await newPage.waitForLoadState('domcontentloaded');
        console.log("NEW TAB FINAL URL:", newPage.url());
    });
    
    await page.goto('https://appcareer.talentrecruit.com/career-page/?sortName=voltas', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('.card-wrap', { timeout: 30000 });
    
    console.log("Found cards! Clicking Apply on the first one...");
    const card = page.locator('.card-wrap').first();
    const applyBtn = card.locator('button.apply-job-btn').first();
    
    await applyBtn.click({ force: true });
    
    // Wait a bit to see if anything happens in this tab or a new tab
    await page.waitForTimeout(5000);
    
    console.log("Current tab URL after click:", page.url());
    
    try {
        const hasApplySec = await page.$('.apply-sec');
        console.log("Does current tab have .apply-sec?", !!hasApplySec);
    } catch (e) {}
    
    await browser.close();
})();
