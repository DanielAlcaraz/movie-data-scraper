import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import path from 'path';
import levenshtein from 'js-levenshtein';
import ora from 'ora';
import downloadImage from '../../utils/files.js';

const scraperObject = {
  url: 'http://www.impawards.com',
  posterSize: 'xlg', // xxlg - xlg

  async acceptCookies(page) {
    // Wait for the cookies modal
    await page.waitForSelector('.qc-cmp2-summary-buttons');
    // Accept cookies
    const [cookiesButton] = await page.$x('//*[@id="qc-cmp2-ui"]/div[2]/div/button[2]');
    await cookiesButton.click();
  },

  async searchMovieByName(page) {
    await page.type('#myNavbar > form > div > input', this.movieName);
    const [moviesButton] = await page.$x('//*[@id="myNavbar"]/form/div/button');
    await moviesButton.click();
  },

  async selectMostAccurateMovie(page) {
    await page.waitForSelector('.col-sm-8');
    const links = await page.$$eval('div.col-sm-8 .row', (links) => {
      return links.map(el => {
        const element = el.querySelector('.col-sm-12 > h3 > a');
        if (element) {
          const { text, href } = element;
          return { text, href }
        } else {
          return null;
        }
      }).filter(el => el);
    });
    // Find the most accuracy: accuracy = 0 (perfect match)
    const urls = links.map(url => Object.assign({}, url, { accuracy: levenshtein(url.text, this.movieName) }));
    if (urls.length > 1) {
      urls.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
      if (urls[0].accuracy === urls[1].accuracy) {
        console.log(`${chalk.yellow('⚠️ ')} Items with the same accuracy`);
      }
    }
    // Navigate to the most accurate movie
    const mostAccurateMovie = urls.length ? urls[0] : null;
    return new Promise((resolve, reject) => resolve(mostAccurateMovie));
  },

  async getPosterFrom(page) {
    // Get correct size poster
    await page.waitForSelector('p.small');
    const posterSizeExist = await page.$$eval('p.small > a:nth-child(1)', (posters) => !!posters[0]);
    if (posterSizeExist) {
      const posterSizes = await page.$$eval('p.small a', (posters) => posters.map(link => link.href));
      const posterPage = posterSizes.find(sizeLink => sizeLink.search(`_${this.posterSize}`) > 0);
      // Get poster source
      await page.goto(posterPage);
      await page.waitForSelector('img.img-responsive');
      const posterURL = await page.$$eval('img.img-responsive', imgs => imgs[0].src);
      return new Promise((resolve, reject) => resolve(posterURL));
    } else {
      const smallPosterURL = await page.$$eval('p.small img', imgs => imgs[0].src);
      return new Promise((resolve, reject) => resolve(smallPosterURL));
    }
  },
  
  downloadPoster(posterIndex, posterURL) {
    const index = posterIndex +1;
    const posterName = `${this.movieName.replace(/\s/g, '-').toLowerCase()}-${index < 10 ? '0' + index.toString() : index}`;
    const fileExtensionPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi;
    const extension = posterURL.match(fileExtensionPattern);

    const dir = `./movies/${this.movieName}/posters`;
    if (!existsSync(dir)){
      mkdirSync(dir, { recursive: true });
    }
    const localPath = path.join(process.cwd(), dir + '/' +posterName + extension);
    return downloadImage(posterURL, localPath);
  },

  async scraper(browser, movieName) {
    this.movieName = movieName;
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    // Navigate to the selected page
    await page.goto(this.url);
    await this.acceptCookies(page);
    // Search movie name
    await this.searchMovieByName(page);
    // Select the most accurate movie
    const mostAccurateMovie = await this.selectMostAccurateMovie(page);
    if (mostAccurateMovie) {
      this.movieName = mostAccurateMovie.text;
      await page.goto(mostAccurateMovie.href);
      // Select all posters
      const picturesLink = await page.$$eval('#altdesigns a', (links) => links.map(link => link.href));
      // Download first poster
      const spinner = ora(chalk.blue(`Downloading posters... `) + '📦').start();
      const firstPosterURL = await this.getPosterFrom(page);
      await this.downloadPoster(0, firstPosterURL);
      // Download each poster
      for (let index = 0; index < picturesLink.length; index++) {
        const posterHomePage = picturesLink[index];
        await page.goto(posterHomePage);
        // Download poster
        const posterURL = await this.getPosterFrom(page);
        await this.downloadPoster(index +1, posterURL);
        // Give some time to the webpage before the next download
        await page.waitForTimeout(1000);
      }
  
      spinner.stop();
      console.log(chalk.green('Impawards: ') + '✅');
    } else {
      console.log(`${chalk.yellow('⚠️ ')} Cannot find movie with name: ${chalk.underline(this.movieName)}`);
    }
  },
}

export { scraperObject };
export default scraperObject;
