import { MetadataRoute } from 'next';
import { products } from '@/lib/products';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.summersteez.com';

  // Published blog posts (for SEO; existing posts stay as-is)
  let blogPostEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    blogPostEntries = posts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // If DB unavailable at build time, sitemap still works without blog URLs
  }

  // Static pages
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

  const staticPageEntries = staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page === '' ? 1.0 : page === '/products' ? 0.9 : page === '/blog' ? 0.8 : 0.7,
  }));

  return [...staticPageEntries, ...productPages, ...blogPostEntries];
}
