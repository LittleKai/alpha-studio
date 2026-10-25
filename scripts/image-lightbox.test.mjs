import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

// Run against a production preview: node scripts/image-lightbox.test.mjs [base URL]
const base = process.argv[2] || 'http://localhost:4173';
const route = '/services/dung-nha-pho-tan-co-dien-tu-ho-so-cad-den-mo-hinh-sketchup-mv8bryvd';
const image = 'img[src*="qb560teujjr8mc0q7kff"]';
const preview = '[class~="z-[60]"]';
const browser = await puppeteer.launch({ headless: true });

try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewport(viewport);
        // Serve the artifact at its deployed origin: the live API rejects localhost CORS.
        await page.setRequestInterception(true);
        page.on('request', async request => {
            const url = new URL(request.url());
            if (url.origin !== 'https://giaiphapsangtao.com') return request.continue();
            try {
                const response = await fetch(base + url.pathname + url.search);
                await request.respond({ status: response.status, contentType: response.headers.get('content-type') || 'application/octet-stream', body: Buffer.from(await response.arrayBuffer()) });
            } catch {
                await request.abort();
            }
        });
        await page.goto('https://giaiphapsangtao.com' + route, { waitUntil: 'networkidle2' });
        await page.waitForSelector(image);
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, viewport.width > 600 ? 'light' : 'dark');
        await page.click(image);
        await page.waitForFunction(selector => {
            const img = document.querySelector(`${selector} img`);
            return img?.complete && img.naturalWidth > 0 && img.closest('[aria-busy]')?.getAttribute('aria-busy') === 'false';
        }, {}, preview);

        const measure = () => page.$eval(`${preview} img`, img => {
            const { top, left, right, bottom, width, height } = img.getBoundingClientRect();
            return { top, left, right, bottom, width, height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
        });
        const fitted = await measure();
        console.log({ viewport, fitted });
        assert(fitted.top >= 0 && fitted.bottom <= viewport.height, 'Preview must show the entire tall image vertically');
        assert(fitted.left >= 0 && fitted.right <= viewport.width, 'Preview must fit horizontally');
        assert(Math.abs(fitted.width / fitted.height - fitted.naturalWidth / fitted.naturalHeight) < 0.01, 'Image proportions must be preserved');
        const screenshot = join(tmpdir(), `alpha-lightbox-${viewport.width}.png`);
        await page.screenshot({ path: screenshot });
        console.log({ screenshot });

        await page.click(`${preview} img`);
        const zoomed = await measure();
        assert(zoomed.height > fitted.height, 'Clicking the fitted image must zoom in');
        const scroll = await page.$eval(`${preview} [aria-busy]`, el => {
            el.scrollTop = el.scrollHeight;
            return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight };
        });
        assert(scroll.max > 0 && scroll.top > 0, 'The enlarged image must be scrollable');

        await page.keyboard.press('Space');
        assert.equal((await measure()).height, fitted.height, 'Space must restore the fitted image');
        await page.keyboard.press('Enter');
        assert((await measure()).height > fitted.height, 'Enter must zoom in');
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(selector => {
            const img = document.querySelector(`${selector} img`);
            return img?.complete && !img.src.includes('qb560teujjr8mc0q7kff') && img.closest('[aria-busy]')?.getAttribute('aria-busy') === 'false' && img.closest('button')?.getAttribute('aria-pressed') === 'false';
        }, {}, preview);
        const next = await measure();
        assert(next.top >= 0 && next.bottom <= viewport.height, 'Navigating must reset zoom to fit');
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(selector => {
            const img = document.querySelector(`${selector} img`);
            return img?.complete && img.src.includes('qb560teujjr8mc0q7kff') && img.closest('[aria-busy]')?.getAttribute('aria-busy') === 'false';
        }, {}, preview);
        assert.equal((await measure()).height, fitted.height);
        await page.keyboard.press('Escape');
        assert.equal(await page.$(preview), null, 'Escape must close the preview');
        assert.equal(await page.evaluate(() => document.body.style.overflow), '', 'Closing must restore page scrolling');
        await page.click(image);
        await page.waitForSelector(`${preview} img`);
        assert.equal((await measure()).height, fitted.height, 'Reopening must start fitted');
        await page.click(`${preview} button[aria-label="Đóng"]`);
        assert.equal(await page.$(preview), null, 'Close button must close the preview');
        assert.deepEqual(errors, [], 'The page must not produce runtime errors');
        await page.close();
    }
    console.log('Image lightbox desktop/mobile checks passed');
} finally {
    await browser.close();
}
