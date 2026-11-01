import { SITE } from '@/constants/seo';
import { NOINDEX_PATHS } from '@/constants/routes';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: NOINDEX_PATHS,
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
