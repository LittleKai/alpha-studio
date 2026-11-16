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
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/index.html?share=1', { headers: { 'sec-fetch-dest': 'document' } }))).status, 307);
        assert.equal((await middleware(request('/led-studio'))).status, 403);
        assert.equal((await middleware(request('/led-studio/js/lumi-studio.min.js'))).status, 403);
        assert.equal((await middleware(request('/%6Ced-studio/js/lumi-studio.min.js'))).status, 403);
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', { headers: { 'sec-fetch-dest': 'document' } }))).status, 403);
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', { headers: { 'sec-fetch-site': 'cross-site' } }))).status, 403);
        assert.equal((await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', { headers: { 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'script' } }))).status, 403);
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

    const fsIdx = config.routes.findIndex(r => r.handle === 'filesystem');
    const ticketProxyIdx = config.routes.findIndex(r => r.src === '^/api/led-studio/session-ticket$');
    const postFs404Idx = config.routes.findIndex(r => r.src === '^/led-studio(?:/.*)?$' && r.status === 404);
    const spaIdx = config.routes.findIndex(r => r.src === '/(.*)' && r.dest === '/');

    assert.ok(ticketProxyIdx > 0 && ticketProxyIdx < fsIdx, 'Same-origin session-ticket rewrite must precede filesystem handler');
    assert.ok(postFs404Idx > fsIdx && postFs404Idx < spaIdx, 'Missing /led-studio/* paths must return 404 after filesystem before SPA fallback');
    assert.equal(config.routes[postFs404Idx].headers?.['cache-control'], 'no-store');

    const catchAllLed = config.routes.find(r => r.src === '^/led-studio/(.*)$');
    assert.match(String(catchAllLed?.headers?.['content-security-policy'] || ''), /frame-ancestors 'self'/);

    const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
    assert.match(robots, /^Allow:\s*\/studio\/led-studio$/m, '/studio/led-studio must stay indexable for SEO');
    assert.match(robots, /^Disallow:\s*\/led-studio$/m);
    assert.match(robots, /^Disallow:\s*\/led-studio\/$/m);
    assert.doesNotMatch(robots, /^Disallow:\s*\/studio\/led-studio/m);
});

test('Tier 1: middleware enforces /led-studio/:path* matcher, Sec-Fetch allowlist, and cross-repo HMAC cookie vector', async () => {
    const mod = await import('../middleware.js');
    const { default: middleware, config: mwConfig } = mod;
    assert.ok(mwConfig.matcher.includes('/led-studio/:path*'), 'Matcher must cover /led-studio/:path*');

    const origSecret = process.env.LUMI_STUDIO_TICKET_SECRET;
    const origGate = process.env.LUMI_STUDIO_GATE;
    process.env.LUMI_STUDIO_TICKET_SECRET = 'test-only-lumi-ticket-secret-32b!!';
    delete process.env.LUMI_STUDIO_GATE;

    // Exact cross-repo test vector signed by alpha-studio-backend signLumiStudioTicket (exp: 2100-01-01T00:15:00.000Z)
    const validTicket = 'eyJ2IjoxLCJzdWIiOiJ1c2VyX3ZlY3Rvcl8xIiwibW9kZSI6InVzZXIiLCJpYXQiOjQxMDI0NDQ4MDAwMDAsImV4cCI6NDEwMjQ0NTcwMDAwMH0.jdo7d62RRY14OyfqW1MqIB3-g76xBbRgf7lc-jDm6-Q';
    const expiredTicket = 'eyJ2IjoxLCJzdWIiOiJ1c2VyX3ZlY3Rvcl8xIiwibW9kZSI6InVzZXIiLCJpYXQiOjEwMDAwMDAsImV4cCI6MTkwMDAwMH0.bad_or_expired';

    try {
        // Valid iframe entry with valid HMAC ticket
        const okIframe = await middleware(new Request('https://giaiphapsangtao.com/led-studio/index.html', {
            headers: {
                'sec-fetch-site': 'same-origin',
                'sec-fetch-dest': 'iframe',
                cookie: `other=1; lumi_studio_ticket=${validTicket}`
            }
        }));
        assert.equal(okIframe.headers.get('x-middleware-next'), '1');

        // Valid subresource destinations (script, style, empty, image, worker) with valid HMAC ticket
        for (const [subPath, dest] of [
            ['/led-studio/js/lumi-studio.min.js', 'script'],
            ['/led-studio/css/lumi-studio.min.css', 'style'],
            ['/led-studio/assets/pilot/audio_line_array_01.glb', 'empty'],
            ['/led-studio/led-studio-logo.webp', 'image'],
            ['/led-studio/js/vendor/mediabunny-1.65.0.js', 'worker']
        ]) {
            const res = await middleware(new Request(`https://giaiphapsangtao.com${subPath}`, {
                headers: {
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-dest': dest,
                    cookie: `lumi_studio_ticket=${validTicket}`
                }
            }));
            assert.equal(res.headers.get('x-middleware-next'), '1', `Expected ${subPath} (${dest}) to pass`);
        }

        // Tampered or expired ticket -> 403 no-store
        const tampered = validTicket.slice(0, -2) + 'ZZ';
        const badSigRes = await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', {
            headers: {
                'sec-fetch-site': 'same-origin',
                'sec-fetch-dest': 'script',
                cookie: `lumi_studio_ticket=${tampered}`
            }
        }));
        assert.equal(badSigRes.status, 403);
        assert.equal(badSigRes.headers.get('cache-control'), 'no-store');

        const expRes = await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', {
            headers: {
                'sec-fetch-site': 'same-origin',
                'sec-fetch-dest': 'script',
                cookie: `lumi_studio_ticket=${expiredTicket}`
            }
        }));
        assert.equal(expRes.status, 403);

        // Missing secret in enforce mode -> fail-closed 403
        delete process.env.LUMI_STUDIO_TICKET_SECRET;
        const missingSecretRes = await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', {
            headers: {
                'sec-fetch-site': 'same-origin',
                'sec-fetch-dest': 'script',
                cookie: `lumi_studio_ticket=${validTicket}`
            }
        }));
        assert.equal(missingSecretRes.status, 403);

        // Staged rollout LUMI_STUDIO_GATE=report allows request with diagnostic header
        process.env.LUMI_STUDIO_GATE = 'report';
        const reportRes = await middleware(new Request('https://giaiphapsangtao.com/led-studio/js/lumi-studio.min.js', {
            headers: { 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'script' }
        }));
        assert.equal(reportRes.headers.get('x-middleware-next'), '1');
        assert.ok(reportRes.headers.get('x-lumi-gate-report'));
    } finally {
        if (origSecret === undefined) delete process.env.LUMI_STUDIO_TICKET_SECRET;
        else process.env.LUMI_STUDIO_TICKET_SECRET = origSecret;
        if (origGate === undefined) delete process.env.LUMI_STUDIO_GATE;
        else process.env.LUMI_STUDIO_GATE = origGate;
    }
});
