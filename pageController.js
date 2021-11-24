import Impawards from './scrapers/impawards/index.js';

const availableScrapers = {
  Impawards,
  FanartTv: ''
};

async function scrapeAll(browserInstance, filmName, scrapers) {
  let browser;
  try {
    browser = await browserInstance;
    // Run scrapers
    scrapers.forEach(async (page) =>
      await availableScrapers[page].scraper(browser, filmName));
  }
  catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}

export { scrapeAll };
export default (browserInstance, filmName, scrapers) => scrapeAll(browserInstance, filmName, scrapers);
