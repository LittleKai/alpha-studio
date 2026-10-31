import { describe, expect, it } from 'vitest';
import { buildBreadcrumbJsonLd, buildSeoMeta, SITE_URL } from './seoMeta';
import * as seo from './seoMeta';

it('derives a readable description from article content without scripts or markup', () => {
  expect(seo).toHaveProperty('buildSeoDescription');
  const describe = (seo as any).buildSeoDescription;
  expect(describe('', '<p>Thiết kế &amp; dựng 3D.</p><script>ignore()</script>', 'Fallback')).toBe('Thiết kế & dựng 3D.');
  expect(describe('  Mô tả riêng.  ', '<p>Body</p>', 'Fallback')).toBe('Mô tả riêng.');
  expect(describe('', '<p>&nbsp;</p>', 'Fallback')).toBe('Fallback');
  expect(describe('', '<p>' + 'Thiết kế '.repeat(80) + '</p>', 'Fallback').length).toBeLessThanOrEqual(170);
});

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

  it('keeps metadata nonempty when imported content has no description', () => {
    expect(buildSeoMeta({ title: 'Coach Freem', description: '   ' }).description).toBe('Coach Freem');
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

import { STUDIO_TOOLS } from '../components/studio/StudioToolTile';

it('registers ledStudio tool in STUDIO_TOOLS pointing to /studio/led-studio', () => {
  const tool = STUDIO_TOOLS.find(t => t.key === ('ledStudio' as any));
  expect(tool).toBeDefined();
  expect(tool?.to).toBe('/studio/led-studio');
});
