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
const PREVIEW_PORT = 4174;

// ─── Fetch dynamic routes from backend ──────────────────────────────────────

async function getDynamicRoutes() {
    // ponytail: HTML snapshots need a rebuild after publishing; use SSR/ISR if content must update without deployment.
    const response = await fetch(new URL('/sitemap.xml', BACKEND), { signal: AbortSignal.timeout(60000), headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error(`Sitemap discovery failed: HTTP ${response.status}`);
    return getSitemapRoutes(await response.text());
}

export function getSitemapRoutes(xml) {
    const routes = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(([, value]) => {
        const url = new URL(value.trim());
        const decoded = decodeURIComponent(url.pathname);
        if (url.origin !== 'https://giaiphapsangtao.com' || url.search || url.hash || decoded.includes('\\') || decoded.split('/').some(part => part === '..' || part === '.')) throw new Error(`Invalid sitemap URL: ${value}`);
        return url.pathname.replace(/\/+$/, '') || '/';
    });
    if (!routes.length) throw new Error('Sitemap has no canonical routes');
    return [...new Set(routes)];
}

// ─── Save rendered HTML ──────────────────────────────────────────────────────

function saveHtml(html, route) {
    const normalized = route === '/' ? '/index.html' : `${route}/index.html`;
    const filePath = path.join(DIST, normalized);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, dedupeSeoHead(html), 'utf-8');
}

export function dedupeSeoHead(html) {
    const headEnd = html.indexOf('</head>');
    if (headEnd < 0) return html;
    const head = html.slice(0, headEnd);
    const tail = html.slice(headEnd);
    const selectors = [
        { regex: /<title>[\s\S]*?<\/title>/gi, key: () => 'title' },
        { regex: /<meta\s+[^>]*name="description"[^>]*>/gi, key: () => 'description' },
        { regex: /<meta\s+[^>]*property="(og:[^"]+)"[^>]*>/gi, key: (match) => match[1] },
        { regex: /<meta\s+[^>]*name="(twitter:[^"]+)"[^>]*>/gi, key: (match) => match[1] },
        { regex: /<meta\s+[^>]*name="robots"[^>]*>/gi, key: () => 'robots' },
        { regex: /<link\s+[^>]*rel="canonical"[^>]*>/gi, key: () => 'canonical' },
    ];
    let normalizedHead = head;
    for (const { regex, key } of selectors) {
        const matches = [...normalizedHead.matchAll(regex)];
        const grouped = new Map();
        matches.forEach((match) => {
            const group = key(match);
            const list = grouped.get(group) || [];
            list.push(match);
            grouped.set(group, list);
        });
        const remove = [];
        for (const [group, groupMatches] of grouped) {
            if (groupMatches.length <= 1) continue;
            let keepIndex = groupMatches.length - 1;

            remove.push(...groupMatches.filter((_, index) => index !== keepIndex));
        }
        for (const match of remove.sort((a, b) => b.index - a.index)) {
            normalizedHead = normalizedHead.slice(0, match.index) + normalizedHead.slice(match.index + match[0].length);
        }
    }
    return normalizedHead + tail;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    if (!fs.existsSync(DIST)) {
        console.error('[prerender] dist/ not found — run vite build first');
        process.exit(1);
    }

    // 1. Collect routes
    const staticRoutes = ['/404'];
    const dynamicRoutes = await getDynamicRoutes();
    
    const allRoutes = [...new Set([...staticRoutes, ...dynamicRoutes])];
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

    let cursor = 0;
    const apiResponses = new Map();
    try {
        await Promise.all(Array.from({ length: 4 }, async () => {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', async req => {
                if (['font', 'image', 'media'].includes(req.resourceType()) || !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) req.abort();
                else if (req.method() === 'OPTIONS' && req.url().startsWith(`${BACKEND}/`)) await req.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'content-type, authorization' } });
                else if (req.method() === 'GET' && req.url().startsWith(`${BACKEND}/`)) {
                    // Fetch public build data once, including StrictMode's duplicate requests.
                    try {
                        if (!apiResponses.has(req.url())) apiResponses.set(req.url(), fetch(req.url(), { signal: AbortSignal.timeout(20000) }).then(async response => {
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            return { status: response.status, contentType: response.headers.get('content-type') || 'application/json', body: Buffer.from(await response.arrayBuffer()), headers: { 'access-control-allow-origin': '*' } };
                        }));
                        await req.respond(await apiResponses.get(req.url()));
                    } catch (error) {
                        apiResponses.delete(req.url());
                        console.error(`[prerender] API ${new URL(req.url()).pathname}: ${error.message}`);
                        await req.respond({ status: 502, body: '{}', headers: { 'access-control-allow-origin': '*' } });
                    }
                }
                else req.continue();
            });
            while (cursor < allRoutes.length) {
                const route = allRoutes[cursor++];
                try {
                    const isSkill = route.startsWith('/studio/ai-skills/');
                    await page.goto(`http://localhost:${PREVIEW_PORT}${route}`, { waitUntil: isSkill ? 'domcontentloaded' : 'networkidle0', timeout: 30000 });
                    await page.waitForFunction(expected => {
                        const canonical = document.querySelector('link[rel="canonical"]');
                        return canonical && new URL(canonical.href).pathname.replace(/\/+$/, '') === expected.replace(/\/+$/, '') && document.querySelector('h1')?.textContent?.trim();
                    }, { timeout: 30000, polling: 100 }, route);
                    saveHtml(await page.content(), route);
                    success++;
                    if (success % 100 === 0 || !isSkill) console.log(`[prerender] ✓ ${route} (${success}/${allRoutes.length})`);
                } catch (err) {
                    console.warn(`[prerender] ✗ ${route} — ${err.message}`);
                    failed++;
                }
            }
            await page.close();
        }));
    } finally {
        await browser.close();
        server.httpServer.close();
    }

    console.log(`\n[prerender] Done — ${success} succeeded, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    main().catch(err => {
        console.error('[prerender] Fatal:', err);
        process.exit(1);
    });
}
