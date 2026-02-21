import { MetadataRoute } from 'next';
import { FEATURES_DATA, BLOG_POSTS_DATA, USE_CASES_DATA, RESOURCES_DATA } from '@schoolerp/ui';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://schoolerp.com';

  // Static routes
  const staticRoutes = ['', '/features', '/pricing', '/about', '/contact', '/blog', '/use-cases', '/resources'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Blog routes
  const blogPosts = BLOG_POSTS_DATA.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Use Case routes
  const useCases = USE_CASES_DATA.map((uc) => ({
    url: `${baseUrl}/use-cases/${uc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Feature routes
  const features = FEATURES_DATA.map((feature) => ({
    url: `${baseUrl}/features/${feature.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Resource routes
  const resources = RESOURCES_DATA.map((res) => ({
    url: `${baseUrl}/resources/${res.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...features, ...useCases, ...blogPosts, ...resources];
}

