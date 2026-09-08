const fs = require('fs');

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. detectTypeFromUrl
    content = content.replace(
        "    if (u.includes('jobs.porsche.com')) return 'porsche';",
        "    if (u.includes('jobs.porsche.com')) return 'porsche';\n    if (u.includes('jobs.bosch.com')) return 'bosch';"
    );

    // 2. detectTypeFromDom
    content = content.replace(
        "        if (html.includes('jobs.porsche.com') || document.querySelector('.jb-datatable')) return 'porsche';",
        "        if (html.includes('jobs.porsche.com') || document.querySelector('.jb-datatable')) return 'porsche';\n        if (url.includes('jobs.bosch.com') || html.includes('jobs.bosch')) return 'bosch';"
    );

    // 3. inside main loop
    content = content.replace(
        "            else if (type === 'godrej') { await scrapeGodrej(page, context, listingUrl, results || jobsBatch); }",
        "            else if (type === 'godrej') { await scrapeGodrej(page, context, listingUrl, results || jobsBatch); }\n            else if (type === 'bosch') { await scrapeBosch(page, context, listingUrl, results || jobsBatch); }"
    );
    // Because pog.js uses `results` and scraper.js uses `jobsBatch`, I should use regex for this one.
    content = content.replace(
        /else if \(type === 'godrej'\) { await scrapeGodrej\(page, context, listingUrl, (\w+)\); }/,
        "else if (type === 'godrej') { await scrapeGodrej(page, context, listingUrl, $1); }\n            else if (type === 'bosch') { await scrapeBosch(page, context, listingUrl, $1); }"
    );

    // 4. detailUrl.includes
    content = content.replace(
        "|| job.detailUrl.includes('careers.godrejindustries.com')) {",
        "|| job.detailUrl.includes('careers.godrejindustries.com') || job.detailUrl.includes('jobs.bosch.com')) {"
    );

    // 5. getText inside genericJobEvaluator
    content = content.replace(
        "let description = getText(['.p-htmlviewer'",
        "let description = getText(['section[aria-label=\"Your tasks-Your profile\"]', '.M-Rich-Text-Two-Col', '.p-htmlviewer'"
    );

    // 6. Append scrapeBosch function at the end
    if (!content.includes('async function scrapeBosch')) {
        content += `\n\n// ════════════════════════════════════════════════════════════════════════════
// 🏢  BOSCH
// ════════════════════════════════════════════════════════════════════════════
async function scrapeBosch(page, context, listingUrl, results) {
    console.log(\`\\n🏢 Scraping Bosch...\`);
    try {
        await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
        
        let hasMore = true;
        let attempt = 0;
        while (hasMore && attempt < 50) {
            attempt++;
            hasMore = await page.evaluate(() => {
                const btn = document.querySelector('.M-JobSearchResultsGroup__loadMore button');
                if (btn && btn.style.display !== 'none' && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            if (hasMore) {
                console.log(\`     ↳ Clicked "Load More" (\${attempt})\`);
                await page.waitForTimeout(3000);
            }
        }

        const jobs = await page.evaluate(() => {
            const pageResults = [];
            const cards = document.querySelectorAll('.M-JobSearchResultsGroup__item');

            cards.forEach(card => {
                const titleEl = card.querySelector('.A-JobPanel__title');
                const linkEl = card.querySelector('a.A-JobPanel__header');

                if (!titleEl || !linkEl) return;

                const title = titleEl.innerText.trim();
                const applyLink = linkEl.href;
                let location = 'Not Found';
                let date = 'Not Found';
                let category = 'Not Found';

                const details = card.querySelectorAll('.A-JobPanel__description');
                details.forEach(desc => {
                    const label = desc.querySelector('.A-JobPanel__label')?.innerText || '';
                    const value = desc.querySelector('.A-JobPanel__value')?.innerText || '';
                    
                    if (label.includes('Location')) location = value.replace(/\\n|On-Site|Hybrid|Remote/g, '').trim();
                    if (label.includes('Job posted')) date = value.trim();
                    if (label.includes('Fields of work')) category = value.trim();
                });

                pageResults.push({
                    title,
                    location,
                    date,
                    category,
                    applyLink,
                    detailUrl: applyLink,
                    company: 'Bosch',
                    experience: 'Not Found',
                    description: ''
                });
            });

            return pageResults;
        });

        console.log(\`     ↳ Total found \${jobs.length} jobs on Bosch\`);

        for (const job of jobs) {
            if (results.length >= 1000) break;
            await visitDetailPage(context, job, 'bosch', results, { company: 'Bosch' });
        }

    } catch (e) {
        console.log(\`  ❌ Failed to scrape Bosch: \${e.message}\`);
    }
}
`;
    }

    fs.writeFileSync(filepath, content);
}

patchFile('/Users/manojshakya/Desktop/job_portal/scraper-service/pog.js');
patchFile('/Users/manojshakya/Desktop/job_portal/scraper-service/scraper.js');
console.log('Patched both files successfully.');
