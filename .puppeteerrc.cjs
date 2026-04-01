/**
 * Puppeteer config — cache Chrome in project-local folder
 * so Vercel/CI builds reuse the download across runs.
 */
const { join } = require('path');

module.exports = {
    cacheDirectory: join(__dirname, '.puppeteer-cache'),
};
