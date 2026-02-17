import { MetadataRoute } from 'next';
import { products } from '@/lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.summersteez.com';

  // Static pages (no database required)
  const staticPages = [
    '',
    '/products',
    '/about',
    '/contact',
    '/research',
    '/faq',
    '/returns',
    '/shipping',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/cart',
    '/checkout',
    '/track-order',
    '/account',
    '/account/addresses',
    '/affiliate',
    '/affiliate/join',
    '/affiliate/signup',
    '/auth/signin',
    '/auth/register',
    '/auth/forgot-password',
    '/blog',
    '/blog/community',
    '/payment/success',
    '/payment/failure',
    '/unsubscribe',
  ];

  // Generate product pages from static product list
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Static page entries (no DB call — blog post URLs omitted to avoid requiring DB for sitemap)
  const staticPageEntries = staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page === '' ? 1.0 : page === '/products' ? 0.9 : 0.7,
  }));

  return [...staticPageEntries, ...productPages];
}
