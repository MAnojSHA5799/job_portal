const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://jobs.carrier.com/en/search-jobs');
  await page.waitForTimeout(3000);
  const jobs = await page.$$eval('section#search-results-list ul li', cards => {
    return cards.map(card => {
      const anchor = card.querySelector('a');
      return {
        title: anchor ? anchor.innerText.trim() : 'No title',
        href: anchor ? anchor.href : 'No href'
      };
    });
  });
  console.log(JSON.stringify(jobs, null, 2));
  await browser.close();
})();
