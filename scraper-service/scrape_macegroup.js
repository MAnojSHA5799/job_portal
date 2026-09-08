async function scrapeMacegroup(page, context, listingUrl, results) {
    console.log(`\n🏢 Scraping Macegroup...`);
    let pageNum = 1;
    let hasNextPage = true;

    while (hasNextPage && results.length < MAX_JOBS) {
        console.log(`▶️ Macegroup: Fetching Page ${pageNum} (${listingUrl})...`);
        try {
            await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(5000); 

            // Wait explicitly for jobs to render
            await page.waitForSelector('.jobs-list-item', { timeout: 30000 }).catch(() => console.log('Timeout waiting for cards'));
            await page.waitForTimeout(2000);

            const jobs = await page.evaluate(() => {
                const pageResults = [];
                const cards = document.querySelectorAll('.jobs-list-item');
                
                cards.forEach(card => {
                    const titleEl = card.querySelector('.job-title');
                    if (!titleEl) return;
                    
                    const title = titleEl.innerText.trim();
                    
                    let location = 'India';
                    const locEl = card.querySelector('.job-location');
                    if (locEl) {
                        location = locEl.innerText.replace('Location', '').trim();
                    }

                    let experience = 'Not Found';

                    let description = '';
                    const descEl = card.querySelector('.job-description');
                    if (descEl) {
                        description = descEl.innerText.trim();
                    }

                    let category = '';
                    const catEl = card.querySelector('.job-category');
                    if (catEl) {
                        category = catEl.innerText.replace('Category', '').trim();
                    }

                    let applyLink = '';
                    const linkEl = card.querySelector('a[data-ph-at-id="job-link"], a[ph-tevent="job_click"]');
                    if (linkEl && linkEl.href) {
                        applyLink = linkEl.href;
                    } else {
                        applyLink = window.location.href; 
                    }

                    let jobId = '';
                    const idEl = card.querySelector('.jobId span[innerhtml\\.bind], .jobId span.au-target, .jobId');
                    if (idEl) {
                        jobId = idEl.innerText.replace('Job Id', '').trim();
                    }
                    if (!jobId && linkEl) {
                        const idAttr = linkEl.getAttribute('data-ph-at-job-id-text');
                        if (idAttr) jobId = idAttr;
                    }
                    
                    // clean up jobId text if it contains extra newlines or spaces
                    jobId = jobId.split('\n').pop().trim();

                    pageResults.push({
                        title,
                        location,
                        experience,
                        applyLink,
                        company: 'Macegroup',
                        description: description || category,
                        jobId: jobId || 'Not Found'
                    });
                });
                return pageResults;
            });

            console.log(`  ↳ Found ${jobs.length} jobs on page ${pageNum}`);
            if (jobs.length === 0) {
                console.log(`  ⚠️ No jobs found on page ${pageNum}. Assuming end of list.`);
                break;
            }

            for (const job of jobs) {
                if (results.length >= MAX_JOBS) break;
                
                results.push({
                    ...job,
                    id: `macegroup-${job.jobId !== 'Not Found' ? job.jobId : job.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                    date: new Date().toISOString()
                });
                console.log(`    🔎 ${job.title} | ${job.location}`);
                if (typeof saveJobsNow === 'function') saveJobsNow(results);
            }

            // Check for pagination
            const clickedNext = await page.evaluate(() => {
                const nextBtn = document.querySelector('a.next-page, li.next a, a[aria-label="Next page"]');
                if (nextBtn && !nextBtn.hasAttribute('disabled') && !nextBtn.classList.contains('disabled')) {
                    nextBtn.click();
                    return true;
                }
                
                const nextPaginationBtn = document.querySelector('.pagination .next button, .pagination-next button');
                if (nextPaginationBtn && !nextPaginationBtn.disabled) {
                    nextPaginationBtn.click();
                    return true;
                }
                
                // Some phenom pages use load more
                const loadMoreBtn = document.querySelector('button.load-more-btn, button[data-ph-at-id="load-more-button"]');
                if(loadMoreBtn) {
                   loadMoreBtn.click();
                   return true;
                }
                
                return false;
            });

            if (clickedNext) {
                pageNum++;
                await page.waitForTimeout(4000); 
                listingUrl = page.url(); 
            } else {
                hasNextPage = false;
            }

        } catch (e) {
            console.error(`  ❌ Error scraping Macegroup page ${pageNum}:`, e.message);
            hasNextPage = false;
        }
    }
}
