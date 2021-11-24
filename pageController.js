import pageScraper from './impawardsScraper.js';

async function scrapeAll(browserInstance) {
  let browser;
  try {
    browser = await browserInstance;
    await pageScraper.scraper(browser);

  }
  catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}

export { scrapeAll };
export default (browserInstance) => scrapeAll(browserInstance);
