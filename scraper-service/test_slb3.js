const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = "https://careers.slb.com/job-listing#sortCriteria=%40title%20ascending&f-country-job=India&cq=%40source%3D%3D%24%22ATS_Jobs_Source%20-%20Prod%22";
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);
  
  const jobs = await page.evaluate(() => {
      const resultList = document.querySelector('atomic-result-list');
      const atomicResults = resultList?.shadowRoot
        ? [...resultList.shadowRoot.querySelectorAll('atomic-result')]
        : [];
      
      if (atomicResults.length > 0) {
          const shadow = atomicResults[0].shadowRoot;
          
          return shadow.innerHTML;
      }
      return "No results";
  });
  
  console.log(jobs);
  await browser.close();
})();
