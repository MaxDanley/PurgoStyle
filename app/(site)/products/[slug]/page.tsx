import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getProductBySlug, getProductSeo } from "@/lib/products";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductComingSoon from "@/components/ProductComingSoon";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering to get fresh stock data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          orderBy: {
            price: "asc",
          },
        },
      },
    });

    if (!product) {
      // Check if it's a coming soon product
      const fallbackProduct = getProductBySlug(slug);
      if (!fallbackProduct) {
        const productName = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/Ii/g, 'II')
          .replace(/Iii/g, 'III');
        
        return {
          title: `${productName} - Coming Soon | Summer Steeze`,
          description: `${productName} is coming soon to Summer Steeze. Explore our current selection of products.`,
          openGraph: {
            title: `${productName} - Coming Soon | Summer Steeze`,
            description: `${productName} is coming soon to Summer Steeze. Explore our current selection of products.`,
            type: "website",
            url: `https://www.summersteez.com/products/${slug}`,
          },
          alternates: {
            canonical: `https://www.summersteez.com/products/${slug}`,
          },
        };
      }
      
      return {
        title: "Product Not Found - Summer Steeze",
      };
    }

    const fallbackProduct = getProductBySlug(slug);
    const image = fallbackProduct?.image ?? product.image;
    const seo = getProductSeo({
      name: product.name,
      slug: product.slug,
      category: (product as { category?: string }).category ?? "Research Compounds",
      description: product.description || "",
      variants: (product as { variants?: { size: string }[] }).variants,
    });

    return {
      title: seo.title,
      description: seo.description,
      openGraph: {
        title: seo.title,
        description: seo.description,
        images: image ? [`https://www.summersteez.com${image}`] : [],
        type: "website",
        url: `https://www.summersteez.com/products/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title: seo.title,
        description: seo.description,
        images: image ? [`https://www.summersteez.com${image}`] : [],
      },
      alternates: {
        canonical: `https://www.summersteez.com/products/${slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Product - Summer Steeze",
    };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product: any = null;

  try {
    // Fetch product from database
    const dbProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          orderBy: {
            price: "asc",
          },
        },
      },
    });

    if (!dbProduct) {
      // Fallback to hardcoded data
      const fallbackProduct = getProductBySlug(slug);
      if (fallbackProduct) {
        product = fallbackProduct;
      } else {
        // Product doesn't exist - show coming soon page instead of 404
        // Extract product name from slug for display
        const productName = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/Ii/g, 'II')
          .replace(/Iii/g, 'III');
        
        return <ProductComingSoon productName={productName} slug={slug} />;
      }
    } else {
      // Transform to match expected format
      const fallbackProduct = getProductBySlug(slug);

      product = {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: dbProduct.slug,
        description: dbProduct.description,
        longDescription: fallbackProduct?.longDescription ?? dbProduct.description,
        category: dbProduct.category,
        image: fallbackProduct?.image ?? dbProduct.image,
        secondImage: fallbackProduct?.secondImage ?? null,
        thirdImage: fallbackProduct?.thirdImage ?? null,
        coaUrl: dbProduct.coaUrl,
        featured: dbProduct.featured,
        variants: dbProduct.variants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          price: variant.price,
          sku: variant.sku,
          stockCount: variant.stockCount,
        })),
        benefits: [],
        researchAreas: fallbackProduct?.researchAreas ?? [],
        chemicalProperties: fallbackProduct?.chemicalProperties ?? null,
      };
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        // Fallback to hardcoded data
    const fallbackProduct = getProductBySlug(slug);
    if (fallbackProduct) {
      product = fallbackProduct;
    } else {
      // Product doesn't exist - show coming soon page instead of 404
      const productName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/Ii/g, 'II')
        .replace(/Iii/g, 'III');
      
      return <ProductComingSoon productName={productName} slug={slug} />;
    }
  }

  if (!product) {
    // Final fallback - show coming soon
    const productName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/Ii/g, 'II')
      .replace(/Iii/g, 'III');
    
    return <ProductComingSoon productName={productName} slug={slug} />;
  }

  return <ProductDetailClient product={product} slug={slug} />;
}
