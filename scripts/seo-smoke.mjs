import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getSitemapRoutes } from './prerender.mjs';

const response = await fetch('https://alpha-studio-backend.fly.dev/sitemap.xml');
assert.equal(response.status, 200);
const routes = getSitemapRoutes(await response.text());
let schemas = 0;
for (const route of routes) {
    const html = fs.readFileSync(path.join('dist', route === '/' ? 'index.html' : `${route}/index.html`), 'utf8');
    const head = html.slice(0, html.indexOf('</head>'));
    assert.equal((head.match(/<title\b/g) || []).length, 1, `${route}: title`);
    assert.equal((head.match(/name="description"/g) || []).length, 1, `${route}: description count`);
    assert.ok(head.match(/name="description"[^>]*content="([^"]+)"/)?.[1]?.trim(), `${route}: empty description`);
    assert.equal((head.match(/rel="canonical"/g) || []).length, 1, `${route}: canonical count`);
    assert.equal(head.match(/rel="canonical"[^>]*href="([^"]+)"/)?.[1], `https://giaiphapsangtao.com${route === '/' ? '' : route}`, `${route}: canonical`);
    assert.match(head, /name="robots"[^>]*content="index, follow"/, `${route}: indexable`);
    assert.match(html, /<h1\b/);
    const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    if (/^\/(?:news|services|about|studio\/ai-skills|studio\/event-library)\/[^/]+$/.test(route)) assert.ok(jsonLd.length, `${route}: missing JSON-LD`);
    for (const [, json] of jsonLd) {
        JSON.parse(json);
        schemas++;
    }
}
assert.equal(fs.readFileSync('dist/google5ffb428154593171.html', 'utf8').trim(), 'google-site-verification: google5ffb428154593171.html');
assert.match(fs.readFileSync('dist/404/index.html', 'utf8'), /name="robots" content="noindex, nofollow"/);
console.log(JSON.stringify({ status: 'PASS', pages: routes.length, validJsonLd: schemas, googleVerification: true }));
