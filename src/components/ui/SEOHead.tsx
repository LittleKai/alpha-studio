import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://giaiphapsangtao.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/alpha-logo-2.png`;

interface SEOHeadProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonLd?: Record<string, any>;
}

export default function SEOHead({ title, description, ogImage, ogType = 'website', path = '', jsonLd }: SEOHeadProps) {
  const url = `${SITE_URL}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const fullTitle = title.includes('Alpha Studio') ? title : `${title} | Alpha Studio`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="vi" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Alpha Studio" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export { SITE_URL };
