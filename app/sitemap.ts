import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/site-metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    '',
    '/pre-launch',
    '/size-guide',
    '/korean-pants',
    '/baggy-linen-pants',
    '/product/korean-pants',
    '/product/linen-pants',
    '/shop',
    '/about',
  ];

  const priorities: Record<string, number> = {
    '': 1.0,
    '/pre-launch': 1.0,
    '/size-guide': 0.7,
    '/korean-pants': 0.9,
    '/baggy-linen-pants': 0.9,
    '/product/korean-pants': 0.9,
    '/product/linen-pants': 0.9,
    '/shop': 0.8,
    '/about': 0.5,
  };

  const frequencies: Record<string, MetadataRoute.Sitemap[number]['changeFrequency']> = {
    '': 'daily',
    '/pre-launch': 'daily',
    '/size-guide': 'monthly',
    '/korean-pants': 'weekly',
    '/baggy-linen-pants': 'weekly',
    '/product/korean-pants': 'weekly',
    '/product/linen-pants': 'weekly',
    '/shop': 'weekly',
    '/about': 'monthly',
  };

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: frequencies[path] ?? 'weekly',
    priority: priorities[path] ?? 0.5,
  }));
}
