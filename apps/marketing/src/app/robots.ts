import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/book-demo/', '/admin/', '/api/'],
    },
    sitemap: 'https://schoolerp.com/sitemap.xml',
  };
}
