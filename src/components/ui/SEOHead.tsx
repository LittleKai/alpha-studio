import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { buildSeoMeta, type SeoLocale, SITE_URL } from '../../utils/seoMeta';

export interface SEOHeadProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  path?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  locale?: SeoLocale;
}

export default function SEOHead({ title, description, ogImage, ogType = 'website', path = '', noindex = false, jsonLd, locale }: SEOHeadProps) {
  const { language } = useTranslation();
  const meta = buildSeoMeta({ title, description, ogImage, ogType, path, noindex, jsonLd, locale: locale || language });

  useEffect(() => {
    document.documentElement.lang = locale || language;
  }, [language, locale]);

  return (
    <Helmet>
      <title>{meta.fullTitle}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={meta.robots} />
      <link rel="canonical" href={meta.url} />
      <meta property="og:title" content={meta.fullTitle} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:type" content={meta.ogType} />
      <meta property="og:site_name" content="Alpha Studio" />
      <meta property="og:locale" content={meta.ogLocale} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.fullTitle} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image} />
      {meta.jsonLdScripts.map((script, index) => (
        <script key={index} type="application/ld+json">{script}</script>
      ))}
    </Helmet>
  );
}

export { SITE_URL };
