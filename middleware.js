const SITE = 'https://giaiphapsangtao.com';
const STATIC_PAGES = new Set(['/', '/courses', '/about', '/news', '/services', '/studio', '/studio/ai-skills', '/studio/event-library', '/studio/vietyaku', '/studio/crm', '/studio/vocab', '/studio/generate', '/studio/edit', '/studio/crm/subscription', '/workflow', '/server', '/profile', '/profile/view', '/my-courses', '/wallet', '/admin', '/admin/courses']);
const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });
const notFound = () => new Response('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 | Alpha Studio</title><h1>404 — Không tìm thấy trang / Page not found</h1><p><a href="/services">Xem dịch vụ thiết kế / Design services</a></p></html>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });

export default async function middleware(request) {
    const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (/^\/(?:event-creative-city|co-loa-living-spiral|studio\/interior-design)(?:\/|$)/.test(pathname)) return next();
    if (STATIC_PAGES.has(pathname) || pathname === '/google5ffb428154593171.html' || /^\/(?:assets|vocab|crm|tinymce|vendor)(?:\/|$)/.test(pathname) || /^\/(?:students|partners|users)\/[^/]+$/.test(pathname) || /^\/workflow\/projects\/[^/]+$/.test(pathname)) return next();

    const legacy = pathname.match(/^\/studio\/skills(?:\/(.+))?$/);
    if (legacy) return Response.redirect(`${SITE}/studio/ai-skills${legacy[1] ? `/${legacy[1]}` : ''}`, 308);
    const match = pathname.match(/^\/(about|news|services|courses|studio\/ai-skills|studio\/event-library)\/([^/]+)$/);
    if (!match) return notFound();
    const [, group, slug] = match;
    const apiGroup = ['about', 'news', 'services'].includes(group) ? 'articles' : group.replace('studio/ai-skills', 'skills').replace('studio/event-library', 'event-library');
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

export const config = { matcher: '/((?!api/|assets/|vocab/|crm/|tinymce/|vendor/|.*\\.[^/]+$).*)' };
