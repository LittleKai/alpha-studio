import { describe, expect, it } from 'vitest';
import { buildBreadcrumbJsonLd, buildSeoMeta, SITE_URL } from './seoMeta';

describe('buildSeoMeta', () => {
  it('normalizes canonical URL, appends brand suffix, and defaults to index, follow', () => {
    const meta = buildSeoMeta({
      title: 'Khóa học AI Thực Chiến',
      description: 'Học AI từ cơ bản đến nâng cao.',
      path: '/courses',
    });
    expect(meta.fullTitle).toBe('Khóa học AI Thực Chiến | Alpha Studio');
    expect(meta.url).toBe(`${SITE_URL}/courses`);
    expect(meta.robots).toBe('index, follow');
    expect(meta.ogLocale).toBe('vi_VN');
  });

  it('sets noindex, nofollow when noindex=true', () => {
    const meta = buildSeoMeta({
      title: '404 Not Found',
      description: 'Not found',
      path: '/404',
      noindex: true,
    });
    expect(meta.robots).toBe('noindex, nofollow');
  });

  it('normalizes single or array jsonLd into array of JSON strings', () => {
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: 'Trang chủ', path: '/' },
      { name: 'Dịch vụ', path: '/services' },
    ]);
    const meta = buildSeoMeta({
      title: 'Alpha Studio — AI Academy',
      description: 'Desc',
      path: '/services',
      jsonLd: [breadcrumb],
    });
    expect(meta.jsonLdScripts).toHaveLength(1);
    expect(JSON.parse(meta.jsonLdScripts[0])['@type']).toBe('BreadcrumbList');
  });

  it('keeps user content inside JSON-LD when saved as HTML', () => {
    const headline = '</script><script>alert(1)</script>';
    const meta = buildSeoMeta({ title: 'Example', description: '', jsonLd: { headline } });
    expect(meta.jsonLdScripts[0]).not.toContain('<');
    expect(JSON.parse(meta.jsonLdScripts[0]).headline).toBe(headline);
  });
});
