import { MetadataRoute } from 'next';
import { products } from '@/lib/products';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.purgolabs.com';

  // Static pages
  const staticPages = [
    '',
    '/products',
    '/about',
    '/contact',
    '/research',
    '/faq',
    '/guide/buy-peptides-online',
    '/returns',
    '/shipping',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/lab-reports',
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

  // Generate product pages
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch published blog posts
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const publishedPosts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    blogPosts = publishedPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Fetch PSEO pages (comparison + peptide) for interlinking discovery
  let pseoPages: MetadataRoute.Sitemap = [];
  try {
    const pseo = await prisma.pSEOPage.findMany({
      where: { published: true },
      select: { type: true, slug: true, updatedAt: true },
    });
    pseoPages = pseo.map((p) => ({
      url: `${baseUrl}${p.type === 'COMPARISON' ? '/compare' : '/peptides'}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching PSEO pages for sitemap:', error);
  }

  // Generate static page entries (higher priority for key pages helps sitelink signals)
  const staticPageEntries = staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page === '' ? 1.0 : page === '/products' ? 0.9 : 0.7,
  }));

  // Combine all pages
  return [...staticPageEntries, ...productPages, ...blogPosts, ...pseoPages];
}
