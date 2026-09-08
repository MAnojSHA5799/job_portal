const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-http2',
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Capture all XHR/fetch network requests
  page.on('request', request => {
    const url = request.url();
    if (
      !url.includes('.css') &&
      !url.includes('.js') &&
      !url.includes('.png') &&
      !url.includes('.ico') &&
      !url.includes('.woff') &&
      !url.includes('.svg') &&
      !url.includes('google') &&
      !url.includes('analytics') &&
      !url.includes('gtm') &&
      !url.includes('fonts')
    ) {
      console.log(`[REQ] ${request.method()} ${url}`);
      try {
        const pd = request.postData();
        if (pd) console.log(`  Body: ${pd.slice(0, 300)}`);
      } catch(e) {}
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (
      url.includes('zwayam') ||
      url.includes('/api/') ||
      url.includes('/job') ||
      url.includes('career') ||
      url.includes('kiaindia')
    ) {
      console.log(`[RES] ${response.status()} ${url}`);
      try {
        const body = await response.text();
        if (body.length > 10 && body.length < 8000) {
          console.log(`  Body: ${body.slice(0, 600)}`);
        } else if (body.length >= 8000) {
          console.log(`  (large body ${body.length} chars) Sample: ${body.slice(0, 300)}`);
        }
      } catch(e) {}
    }
  });

  console.log('Opening https://career.kiaindia.net/kiaindia/apply ...');
  try {
    await page.goto('https://career.kiaindia.net/kiaindia/apply', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
  } catch(e) {
    console.log('goto error:', e.message);
  }

  console.log('\nWaiting 8s for JS to load jobs...');
  await page.waitForTimeout(8000);

  console.log('\nPage title:', await page.title());
  console.log('URL:', page.url());

  // Check DOM for job cards
  const count = await page.$$eval('[class*="job"], [class*="card"], [class*="position"]', els => els.length).catch(() => 0);
  console.log('Potential job elements found:', count);

  await browser.close();
})();
