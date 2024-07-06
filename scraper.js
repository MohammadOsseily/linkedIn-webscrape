const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

async function scrapeLinkedInJobs(keyword) {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    // Navigate to LinkedIn login page
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

    // Perform login
    await page.type('#username', process.env.LINKEDIN_EMAIL);
    await page.type('#password', process.env.LINKEDIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to complete after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Navigate to the job search page with the specified keyword
    const searchURL = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}`;
    await page.goto(searchURL, { waitUntil: 'networkidle2' });

    // Debugging: Check if the search results page has loaded
    console.log('Navigated to search results page');

    // Wait for job listings to be present
    await page.waitForSelector('.job-card-list', { timeout: 30000 });  // Adjust timeout if needed

    // Extract job listings
    const jobListings = await page.evaluate(() => {
        const jobs = [];
        const jobElements = document.querySelectorAll('.job-card-container');  // Updated selector
        jobElements.forEach(job => {
            const jobTitle = job.querySelector('.job-card-list__title')?.innerText || 'N/A';
            const companyName = job.querySelector('.job-card-container__company-name')?.innerText || 'N/A';
            const jobLocation = job.querySelector('.job-card-container__metadata-item')?.innerText || 'N/A';
            const jobDescription = job.querySelector('.job-card-container__snippet')?.innerText || 'N/A';
            const jobPostDate = job.querySelector('time')?.getAttribute('datetime') || 'N/A';
            const applicationLink = job.querySelector('a')?.href || 'N/A';

            jobs.push({
                jobTitle,
                companyName,
                jobLocation,
                jobDescription,
                jobPostDate,
                applicationLink
            });
        });
        return jobs;
    });

    // Debugging: Log the number of jobs found
    console.log(`Found ${jobListings.length} job listings`);

    await browser.close();

    // Save data to a JSON file
    fs.writeFileSync('jobs.json', JSON.stringify(jobListings, null, 2));
    console.log('Scraping complete. Data saved to jobs.json');
}

// Use the function
const keyword = 'MLOps';

scrapeLinkedInJobs(keyword);
