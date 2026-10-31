import { SITE } from '@/constants/seo';
import { SITEMAP_PATHS } from '@/constants/routes';

export default function sitemap() {
  const lastModified = new Date();
  return SITEMAP_PATHS.map((path) => ({
    url: path === '/' ? SITE.url : `${SITE.url}${path}`,
    lastModified,
  }));
}
