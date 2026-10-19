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
        const [coursesRes, aboutRes, servicesRes, newsRes] = await Promise.all([
            fetch(`${BACKEND}/courses?status=published&limit=200&sort=-createdAt`),
            fetch(`${BACKEND}/articles?category=about&limit=100`),
            fetch(`${BACKEND}/articles?category=services&limit=100`),
            fetch(`${BACKEND}/articles?category=news&limit=100`)
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
        if (newsRes.ok) {
            const data = await newsRes.json();
            (data.data || []).forEach(a => a.slug && routes.push(`/news/${a.slug}`));
        }

        for (let page = 1; page <= 100; page += 1) {
            const response = await fetch(`${BACKEND}/event-library?page=${page}&limit=60`);
            if (!response.ok) break;
            const data = await response.json();
            const items = data.data?.items || data.data || [];
            items.forEach(item => item.slug && routes.push(`/studio/event-library/${item.slug}`));
            if (items.length < 60 || page >= (data.pagination?.pages || page)) break;
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
            if (group === 'title') {
                const dynamicIndex = groupMatches.findIndex((match) => !match[0].includes('Alpha Studio — AI Academy &amp; Training Hub'));
                if (dynamicIndex >= 0) keepIndex = dynamicIndex;
            }
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
    const staticRoutes = ['/', '/courses', '/about', '/services', '/news', '/studio', '/studio/ai-skills', '/studio/event-library', '/studio/vietyaku', '/studio/crm', '/studio/vocab'];
    const dynamicRoutes = await getDynamicRoutes();
    
    // Add local skills database slugs to dynamic routes
    try {
        const skillsPath = path.join(ROOT, 'public', 'data', 'skills.json');
        if (fs.existsSync(skillsPath)) {
            const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf-8'));
            // Prerender first 30 dynamic skill routes + firecrawl
            const selectedSkills = skills.slice(0, 30);
            if (!selectedSkills.some(s => s.slug === 'firecrawl')) {
                const firecrawlSkill = skills.find(s => s.slug === 'firecrawl');
                if (firecrawlSkill) selectedSkills.push(firecrawlSkill);
            }
            selectedSkills.forEach(s => {
                if (s.slug) {
                    dynamicRoutes.push(`/studio/ai-skills/${s.slug}`);
                }
            });
            console.log(`[prerender] Added ${selectedSkills.length} dynamic skill routes from skills.json`);
        }
    } catch (err) {
        console.warn(`[prerender] Could not load local skills database: ${err.message}`);
    }

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
            args: [...chromium.default.args, '--disable-web-security'],
            defaultViewport: chromium.default.defaultViewport,
            executablePath: await chromium.default.executablePath(),
            headless: chromium.default.headless,
        });
    } else {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
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

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    main().catch(err => {
        console.error('[prerender] Fatal:', err);
        process.exit(1);
    });
}
