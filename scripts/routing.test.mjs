import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('unknown pages return 404; public detail URLs verify existence and fail safely', async () => {
    const { default: middleware } = await import('../middleware.js');
    const request = path => new Request(`https://giaiphapsangtao.com${path}`);
    const original = globalThis.fetch;
    try {
        assert.equal((await middleware(request('/does-not-exist'))).status, 404);
        assert.equal((await middleware(request('/event-creative-city'))).headers.get('x-middleware-next'), '1');
        assert.equal((await middleware(request('/studio/skills/firecrawl'))).status, 308);
        assert.equal((await middleware(request('/studio/led-studio'))).headers.get('x-middleware-next'), '1');
        assert.equal((await middleware(request('/studio/led-studio?share=abc123'))).headers.get('x-middleware-next'), '1');
        assert.equal((await middleware(request('/led-studio'))).headers.get('x-middleware-next'), '1');
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/index.html?share=1', { headers: { 'sec-fetch-dest': 'document' } }))).status, 307);
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', { headers: { 'sec-fetch-dest': 'document' } }))).status, 403);
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', { headers: { 'sec-fetch-site': 'cross-site' } }))).status, 403);
        assert.equal((await middleware(request('/workflow/projects/123'))).headers.get('x-middleware-next'), '1');
        assert.equal((await middleware(request('/google5ffb428154593171.html'))).headers.get('x-middleware-next'), '1');

        const appRoutes = [...readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)]
            .map(([, route]) => route)
            .filter((route) => route.startsWith('/') && !route.includes(':') && !route.includes('*'));
        for (const route of appRoutes) {
            const res = await middleware(request(route));
            if (route === '/studio/skills') assert.equal(res.status, 308, route);
            else assert.equal(res.headers.get('x-middleware-next'), '1', `App route ${route} must be allowed by middleware.js`);
        }
        globalThis.fetch = async () => new Response('{}', { status: 404 });
        assert.equal((await middleware(request('/services/missing'))).status, 404);
        globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: { slug: 'real', category: 'services' } }));
        assert.equal((await middleware(request('/services/real'))).headers.get('x-middleware-next'), '1');
        assert.equal((await middleware(request('/news/real'))).status, 404);
        globalThis.fetch = async () => { throw new Error('offline'); };
        assert.equal((await middleware(request('/services/real'))).status, 503);
    } finally {
        globalThis.fetch = original;
    }
});

test('Google verification file is copied verbatim into the deploy artifact source', () => {
    assert.equal(readFileSync(new URL('../public/google5ffb428154593171.html', import.meta.url), 'utf8').trim(), 'google-site-verification: google5ffb428154593171.html');
});

test('Vercel serves the Vite artifact and runs the page existence middleware', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    assert.equal(config.outputDirectory, 'dist');
    assert.equal(config.proxy.entrypoint, 'middleware.js');
});
