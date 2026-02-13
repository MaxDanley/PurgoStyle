import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.summersteeze.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/api/',
          '/checkout/',
          '/order-confirmation/',
          '/auth/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/api/',
          '/checkout/',
          '/order-confirmation/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
