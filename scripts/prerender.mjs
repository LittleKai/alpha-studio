/**
 * Prerender script — captures fully-rendered HTML for public pages
 * using Puppeteer + Vite preview server.
 *
 * Usage:
 *   npm run build      → vite build only (fast deploy)
 *   npm run build:seo  → vite build + prerender (full SEO)
 */

import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import { preview } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BACKEND = process.env.VITE_API_URL || 'https://alpha-studio-backend.fly.dev/api';
const PREVIEW_PORT = 4173;

// ─── Fetch dynamic routes from backend ──────────────────────────────────────

async function getDynamicRoutes() {
    const routes = [];
    try {
        const [coursesRes, aboutRes, servicesRes] = await Promise.all([
            fetch(`${BACKEND}/courses?status=published&limit=200&sort=-createdAt`),
            fetch(`${BACKEND}/articles?category=about&limit=100`),
            fetch(`${BACKEND}/articles?category=services&limit=100`)
        ]);

        if (coursesRes.ok) {
            const data = await coursesRes.json();
            (data.data || []).forEach(c => c.slug && routes.push(`/courses/${c.slug}`));
        }
        if (aboutRes.ok) {
            const data = await aboutRes.json();
            (data.data || []).forEach(a => a.slug && routes.push(`/about/${a.slug}`));
        }
        if (servicesRes.ok) {
            const data = await servicesRes.json();
            (data.data || []).forEach(a => a.slug && routes.push(`/services/${a.slug}`));
        }

        console.log(`[prerender] Fetched ${routes.length} dynamic routes from backend`);
    } catch (err) {
        console.warn(`[prerender] Could not fetch dynamic routes: ${err.message}`);
    }
    return routes;
}

// ─── Save rendered HTML ──────────────────────────────────────────────────────

function saveHtml(html, route) {
    const normalized = route === '/' ? '/index.html' : `${route}/index.html`;
    const filePath = path.join(DIST, normalized);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html, 'utf-8');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    if (!fs.existsSync(DIST)) {
        console.error('[prerender] dist/ not found — run vite build first');
        process.exit(1);
    }

    // 1. Collect routes
    const staticRoutes = ['/', '/courses', '/about', '/services'];
    const dynamicRoutes = await getDynamicRoutes();
    const allRoutes = [...staticRoutes, ...dynamicRoutes];
    console.log(`[prerender] ${allRoutes.length} routes to prerender`);

    // 2. Start Vite preview server
    const server = await preview({
        root: ROOT,
        preview: {
            port: PREVIEW_PORT,
            strictPort: true,
        }
    });
    console.log(`[prerender] Preview server started at http://localhost:${PREVIEW_PORT}`);

    // 3. Launch Puppeteer — use @sparticuz/chromium on Vercel/CI, bundled Chrome locally
    let browser;
    if (process.env.VERCEL || process.env.CI) {
        const chromium = await import('@sparticuz/chromium');
        browser = await puppeteerCore.launch({
            args: chromium.default.args,
            defaultViewport: chromium.default.defaultViewport,
            executablePath: await chromium.default.executablePath(),
            headless: chromium.default.headless,
        });
    } else {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
    }

    let success = 0;
    let failed = 0;

    for (const route of allRoutes) {
        try {
            const page = await browser.newPage();

            // Block fonts/images/media to speed up rendering
            await page.setRequestInterception(true);
            page.on('request', req => {
                if (['font', 'image', 'media'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(`http://localhost:${PREVIEW_PORT}${route}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Extra wait for React async renders
            await new Promise(r => setTimeout(r, 300));

            const html = await page.content();
            saveHtml(html, route);
            await page.close();

            console.log(`[prerender] ✓ ${route}`);
            success++;
        } catch (err) {
            console.warn(`[prerender] ✗ ${route} — ${err.message}`);
            failed++;
        }
    }

    await browser.close();
    server.httpServer.close();

    console.log(`\n[prerender] Done — ${success} succeeded, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('[prerender] Fatal:', err);
    process.exit(1);
});
