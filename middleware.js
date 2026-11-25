const SITE = 'https://giaiphapsangtao.com';
const STATIC_PAGES = new Set(['/', '/courses', '/about', '/news', '/services', '/contact', '/lien-he', '/studio', '/studio/event-library', '/studio/vietyaku', '/studio/crm', '/studio/vocab', '/studio/led-studio', '/studio/generate', '/studio/edit', '/studio/crm/subscription', '/workflow', '/server', '/profile', '/profile/view', '/my-courses', '/wallet', '/admin', '/admin/courses']);
const LED_SUBRESOURCE_DESTS = new Set(['script', 'style', 'empty', 'image', 'worker']);

const next = (extraHeaders = {}) => new Response(null, { headers: { 'x-middleware-next': '1', ...extraHeaders } });
const forbiddenLed = () => new Response('Forbidden', {
    status: 403,
    headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, noarchive, nosnippet'
    }
});
const notFound = () => new Response('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 | Alpha Studio</title><h1>404 — Không tìm thấy trang / Page not found</h1><p><a href="/services">Xem dịch vụ thiết kế / Design services</a></p></html>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });

let cachedKeySecret = '';
let cachedHmacKeyPromise = null;

function getHmacKey(secret) {
    if (secret === cachedKeySecret && cachedHmacKeyPromise) return cachedHmacKeyPromise;
    cachedKeySecret = secret;
    cachedHmacKeyPromise = globalThis.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );
    return cachedHmacKeyPromise;
}

function decodeBase64UrlBytes(str) {
    const pad = '='.repeat((4 - (str.length % 4)) % 4);
    const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function extractCookieValue(cookieHeader, name) {
    if (!cookieHeader) return '';
    for (const part of cookieHeader.split(';')) {
        const eq = part.indexOf('=');
        if (eq < 0) continue;
        if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
    }
    return '';
}

async function verifyEdgeTicket(rawTicket, secret) {
    if (!secret) return { ok: false, reason: 'missing_secret' };
    if (!rawTicket || typeof rawTicket !== 'string') return { ok: false, reason: 'missing_cookie' };
    const parts = rawTicket.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1] || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
        return { ok: false, reason: 'invalid_format' };
    }
    try {
        const key = await getHmacKey(secret);
        const sigBytes = decodeBase64UrlBytes(parts[1]);
        const msgBytes = new TextEncoder().encode(parts[0]);
        const validSig = await globalThis.crypto.subtle.verify('HMAC', key, sigBytes, msgBytes);
        if (!validSig) return { ok: false, reason: 'bad_signature' };
        const payload = JSON.parse(new TextDecoder().decode(decodeBase64UrlBytes(parts[0])));
        if (!payload || payload.v !== 1 || !payload.sub || !Number.isFinite(payload.exp)) {
            return { ok: false, reason: 'invalid_payload' };
        }
        if (Date.now() >= payload.exp) return { ok: false, reason: 'expired' };
        return { ok: true, payload };
    } catch {
        return { ok: false, reason: 'parse_error' };
    }
}

function safeNormalizedPath(rawPathname) {
    let decoded = rawPathname;
    try {
        decoded = decodeURIComponent(rawPathname);
    } catch {
        return null;
    }
    return decoded.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
}

export default async function middleware(request) {
    const url = new URL(request.url);
    const pathname = safeNormalizedPath(url.pathname);
    if (!pathname) return forbiddenLed();

    if (/^\/led-studio(?:\/|$)/i.test(pathname)) {
        const gateMode = String((typeof process !== 'undefined' && process.env?.LUMI_STUDIO_GATE) || 'enforce').toLowerCase();
        if (gateMode === 'off') return next();

        const dest = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
        const site = (request.headers.get('sec-fetch-site') || '').toLowerCase();
        const isEntryDoc = pathname === '/led-studio' || pathname === '/led-studio/index.html';

        if (dest === 'document' && isEntryDoc) {
            return new Response(null, {
                status: 307,
                headers: {
                    location: `${SITE}/studio/led-studio${url.search}`,
                    'cache-control': 'no-store',
                    'x-robots-tag': 'noindex, noarchive, nosnippet'
                }
            });
        }

        const headersValid = site === 'same-origin' && (isEntryDoc ? dest === 'iframe' : LED_SUBRESOURCE_DESTS.has(dest));
        if (!headersValid) {
            return gateMode === 'report' ? next({ 'x-lumi-gate-report': `bad_sec_fetch:${site || 'none'}:${dest || 'none'}` }) : forbiddenLed();
        }

        const secret = String((typeof process !== 'undefined' && process.env?.LUMI_STUDIO_TICKET_SECRET) || '').trim();
        const rawTicket = extractCookieValue(request.headers.get('cookie') || '', 'lumi_studio_ticket');
        const verified = await verifyEdgeTicket(rawTicket, secret);
        if (!verified.ok) {
            return gateMode === 'report' ? next({ 'x-lumi-gate-report': `ticket_${verified.reason}` }) : forbiddenLed();
        }
        return next();
    }

    if (/^\/(?:event-creative-city|co-loa-living-spiral|studio\/interior-design|studio\/(?:ai-)?skills)(?:\/|$)/.test(pathname)) return next();
    if (STATIC_PAGES.has(pathname) || pathname === '/google5ffb428154593171.html' || /^\/(?:assets|vocab|crm|tinymce|vendor)(?:\/|$)/.test(pathname) || /^\/(?:students|partners|users)\/[^/]+$/.test(pathname) || /^\/workflow\/projects\/[^/]+$/.test(pathname)) return next();

    const match = pathname.match(/^\/(about|news|services|courses|studio\/event-library)\/([^/]+)$/);
    if (!match) return notFound();
    const [, group, slug] = match;
    const apiGroup = ['about', 'news', 'services'].includes(group) ? 'articles' : group.replace('studio/event-library', 'event-library');
    try {
        const response = await fetch(`https://alpha-studio-backend.fly.dev/api/${apiGroup}/${slug}`, { signal: AbortSignal.timeout(8000) });
        if (response.status === 404) return notFound();
        if (!response.ok) throw new Error('Content API unavailable');
        const { success, data } = await response.json();
        if (!success || !data || (apiGroup === 'articles' && data.category !== group)) return notFound();
        return next();
    } catch {
        return new Response('Temporarily unavailable', { status: 503, headers: { 'retry-after': '60', 'x-robots-tag': 'noindex' } });
    }
}

export const config = {
    matcher: [
        '/led-studio',
        '/led-studio/:path*',
        '/((?!api/|assets/|vocab/|crm/|led-studio/|tinymce/|vendor/|.*\\.[^/]+$).*)'
    ]
};
