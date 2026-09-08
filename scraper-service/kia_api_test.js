const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    let jobsApiData = null;
    
    // Intercept the Zwayam jobs/search API
    page.on('response', async (response) => {
        if (response.url().includes('zwayam.com/jobs/search')) {
            try {
                const body = await response.json();
                jobsApiData = body;
            } catch(e) {}
        }
    });
    
    await page.goto("https://career.kiaindia.net/kiaindia/apply", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000);
    
    if (jobsApiData) {
        const jobs = jobsApiData?.data?.data || [];
        console.log(`Total jobs from API: ${jobs.length}`);
        if (jobs.length > 0) {
            // Print first job's full structure
            const firstJob = jobs[0]._source;
            console.log("\nFirst job keys:", Object.keys(firstJob));
            console.log("\nFirst job sample fields:");
            console.log("  jobTitle:", firstJob.jobTitle);
            console.log("  jobId:", firstJob.jobId || firstJob.id || firstJob._id);
            console.log("  location:", firstJob.location || firstJob.jobLocation || firstJob.officeLocation);
            console.log("  jobDescription:", firstJob.jobDescription ? firstJob.jobDescription.substring(0, 100) : null);
            console.log("  refNumber:", firstJob.referenceNumber);
            
            // Print all first job fields to find the ID and description
            const fs = require('fs');
            fs.writeFileSync('kia_api_first_job.json', JSON.stringify(firstJob, null, 2));
            console.log("\nFull first job saved to kia_api_first_job.json");
        }
    } else {
        console.log("No API data captured");
    }
    
    await browser.close();
})();
