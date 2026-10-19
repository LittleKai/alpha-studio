import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dedupeSeoHead } from './prerender.mjs';

test('dedupeSeoHead keeps the rendered Helmet tags and removes static duplicates', () => {
    const html = '<head><title>Alpha Studio — AI Academy &amp; Training Hub</title><title>Rendered</title><meta name="description" content="fallback"><meta name="description" content="rendered"><meta property="og:title" content="fallback title"><meta property="og:title" content="rendered title"><meta property="og:description" content="rendered description"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="rendered twitter title"><link rel="canonical" href="https://example.test/"><link rel="canonical" href="https://example.test/page"></head>';
    const result = dedupeSeoHead(html);
    assert.equal((result.match(/<title>/g) || []).length, 1);
    assert.match(result, /<title>Rendered<\/title>/);
    assert.equal((result.match(/name="description"/g) || []).length, 1);
    assert.match(result, /content="rendered"/);
    assert.match(result, /property="og:title" content="rendered title"/);
    assert.match(result, /property="og:description" content="rendered description"/);
    assert.match(result, /name="twitter:card" content="summary"/);
    assert.match(result, /name="twitter:title" content="rendered twitter title"/);
    assert.match(result, /href="https:\/\/example\.test\/page"/);
});

test('retired URL rules return 410 while preserving landing video paths', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    const goneRoutes = config.routes.filter((route) => route.status === 410);
    for (const path of ['/event-creative-city', '/event-creative-city/', '/co-loa-living-spiral', '/studio/interior-design', '/studio/interior-design/project-1']) {
        assert.ok(goneRoutes.some((route) => new RegExp(route.src).test(path)), path);
    }
    for (const path of ['/event-creative-city/vid/neon/L0.mp4', '/event-creative-city/vid/living-storyboard/L6.mp4', '/studio/event-library']) {
        assert.ok(!goneRoutes.some((route) => new RegExp(route.src).test(path)), path);
    }
});
