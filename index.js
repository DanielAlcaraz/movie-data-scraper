import inquirer from 'inquirer';
import browserObject from './browser.js';
import scraperController from './pageController.js';

// Ask what scrapers do you want to use
inquirer.prompt([
  {
    name: 'film',
    message: 'Write the film you want to scrape:',
  },
  {
    type: 'checkbox',
    name: 'scrapers',
    message: 'What scrapers do you want to use?',
    default: ['Impawards'],
    choices: [
      'Impawards', 'FanartTv',
    ],
  }
]).then(answers => {
  const { film, scrapers } = answers;
  //Start the browser and create a browser instance
  let browserInstance = browserObject.startBrowser();
  // Pass the browser instance to the scraper controller
  scraperController(browserInstance, film, scrapers)
});
