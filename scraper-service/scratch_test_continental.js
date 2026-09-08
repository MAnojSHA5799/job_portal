const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://jobs.continental.com/en/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000); 
  
  const getActive = async () => await page.evaluate(() => {
      const activeBtn = document.querySelector('button.c-pagination__button.is-active');
      return activeBtn ? activeBtn.innerText.trim() : null;
  });
  
  console.log("ACTIVE PAGE BEFORE:", await getActive());
  
  // click next
  await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button, a')).find(b => 
          b.innerHTML.includes('chevron-right')
      );
      if (nextBtn) nextBtn.click();
  });
  
  await page.waitForTimeout(5000);
  
  console.log("ACTIVE PAGE AFTER 5S:", await getActive());
  
  await browser.close();
})();
