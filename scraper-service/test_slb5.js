const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = "https://careers.slb.com/job-listing#sortCriteria=%40title%20ascending&f-country-job=India&cq=%40source%3D%3D%24%22ATS_Jobs_Source%20-%20Prod%22";
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);
  
  const jobs = await page.evaluate(() => {
      const pageResults = [];

      function queryShadowAll(root, selector) {
        const found = [...root.querySelectorAll(selector)];
        for (const el of root.querySelectorAll('*')) {
          if (el.shadowRoot) found.push(...queryShadowAll(el.shadowRoot, selector));
        }
        return found;
      }

      function getFieldText(el) {
        if (!el) return '';
        const sh = el.shadowRoot;
        if (sh) {
          const parts = sh.querySelectorAll('[part*="value"], [part*="result-multi-value"]');
          if (parts.length) {
            const vals = [...parts].map(p => p.textContent?.trim()).filter(Boolean);
            return [...new Set(vals)].join(', ');
          }
          return sh.textContent?.trim() || '';
        }
        return el.textContent?.trim() || '';
      }

      const resultList = document.querySelector('atomic-result-list');
      let atomicResults = resultList?.shadowRoot
        ? [...resultList.shadowRoot.querySelectorAll('atomic-result')]
        : [];

      if (atomicResults.length === 0) {
        atomicResults = queryShadowAll(document, 'atomic-result');
      }

      for (const result of atomicResults) {
        const shadow = result.shadowRoot;
        if (!shadow) continue;

        let href = '';
        let title = '';
        const atomicLink = shadow.querySelector('atomic-result-link');
        
        if (atomicLink) {
            const anchor = atomicLink.querySelector('a');
            href = anchor?.href || '';
            
            const atomicText = atomicLink.querySelector('atomic-text');
            if (atomicText) {
                title = atomicText.getAttribute('value') || '';
            }
            if (!title) {
                title = anchor?.textContent?.trim() || '';
            }
        }
        
        if (!href || !title) {
          const anyAnchor = shadow.querySelector('a[href*="/job/"]') || shadow.querySelector('a[href*="careers.slb.com"]');
          if (anyAnchor) { 
            href = href || anyAnchor.href; 
            title = title || anyAnchor.textContent?.trim() || ''; 
          }
        }

        const city = getFieldText(shadow.querySelector('atomic-result-multi-value-text[field="city"]'));
        const country = getFieldText(shadow.querySelector('atomic-result-multi-value-text[field="country"]'));
        const category = getFieldText(shadow.querySelector('atomic-result-multi-value-text[field="category"]'));

        pageResults.push({ title, href, city, country, category });
      }
      return pageResults;
  });
  
  console.log(JSON.stringify(jobs, null, 2));
  await browser.close();
})();
