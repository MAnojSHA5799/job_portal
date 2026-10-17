const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Going to L&T PeopleStrong...');
  await page.goto('https://larsentoubrocareers.peoplestrong.com/job/joblist', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);

  const result = await page.evaluate(() => {
    // Card count
    const cards = document.querySelectorAll('.section-card .card-block:not(.search-block-section)');
    
    // Pagination elements
    const paginationEl = document.querySelector('alt-pagination, ul.pagination, [class*="pagination"]');
    
    // All li items inside pagination
    const paginationLis = Array.from(document.querySelectorAll('alt-pagination li, ul.pagination li')).map(li => ({
      classes: li.className,
      text: li.innerText.trim().substring(0, 50),
      html: li.outerHTML.substring(0, 300)
    }));

    // Try finding nextview
    const nextView = document.querySelector('li.nextview');
    
    // Total count display
    const totalText = Array.from(document.querySelectorAll('*')).find(el => 
      el.children.length === 0 && /\d{3,4}\s*(jobs?|results?|positions?)/i.test(el.innerText)
    )?.innerText;

    return {
      cardCount: cards.length,
      paginationOuterHTML: paginationEl ? paginationEl.outerHTML.substring(0, 2000) : 'NOT FOUND',
      paginationLis,
      nextViewFound: !!nextView,
      nextViewHTML: nextView ? nextView.outerHTML : 'NOT FOUND',
      totalText: totalText || 'NOT FOUND'
    };
  });

  console.log('Card count:', result.cardCount);
  console.log('Total text:', result.totalText);
  console.log('nextview li found:', result.nextViewFound);
  console.log('nextview HTML:', result.nextViewHTML);
  console.log('\nAll pagination LIs:');
  result.paginationLis.forEach((li, i) => {
    console.log(`  [${i}] classes="${li.classes}" text="${li.text}"`);
    console.log(`       html: ${li.html}\n`);
  });
  console.log('\nFull pagination HTML:\n', result.paginationOuterHTML);

  await browser.close();
})();
