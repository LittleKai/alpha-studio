export const SITE_URL = 'https://giaiphapsangtao.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/alpha-logo-2.png`;

export type SeoLocale = 'vi' | 'en';

export interface SeoMetaInput {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  locale?: SeoLocale;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export interface SeoMetaOutput {
  fullTitle: string;
  description: string;
  url: string;
  image: string;
  ogType: 'website' | 'article';
  ogLocale: 'vi_VN' | 'en_US';
  robots: 'index, follow' | 'noindex, nofollow';
  jsonLdScripts: string[];
}

const normalizePath = (path = '') => {
  if (!path || path === '/') return '';
  return `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

export function buildSeoMeta(input: SeoMetaInput): SeoMetaOutput {
  const path = normalizePath(input.path);
  const fullTitle = /alpha studio/i.test(input.title) ? input.title : `${input.title} | Alpha Studio`;
  const jsonLd = input.jsonLd ? (Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd]) : [];
  return {
    fullTitle,
    description: input.description,
    url: `${SITE_URL}${path}`,
    image: input.ogImage || DEFAULT_OG_IMAGE,
    ogType: input.ogType || 'website',
    ogLocale: input.locale === 'en' ? 'en_US' : 'vi_VN',
    robots: input.noindex ? 'noindex, nofollow' : 'index, follow',
    jsonLdScripts: jsonLd.map((value) => JSON.stringify(value).replace(/</g, '\\u003c')),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${normalizePath(item.path) || '/'}`,
    })),
  };
}
