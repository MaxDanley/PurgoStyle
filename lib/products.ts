/** Purgo Style: products are loaded from DB (seed-purgostyle). This file provides fallbacks and helpers. */

export interface ProductVariant {
  id: string;
  size: string;
  price: number;
  sku: string;
  stockCount: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  image: string;
  secondImage?: string;
  thirdImage?: string;
  featured: boolean;
  variants: ProductVariant[];
  researchAreas?: string[];
  chemicalProperties?: unknown;
}

export const products: Product[] = [];

export function getProductBySlug(_slug: string): Product | undefined {
  return undefined;
}

export function getProductSeo(product: { name: string; slug: string; category: string; description: string; variants?: { size: string }[] }) {
  const sizes = product.variants?.map((v) => v.size).filter(Boolean).slice(0, 3) || [];
  const sizePhrase = sizes.length ? ` ${sizes.join(" & ")}` : "";
  const title = `Buy ${product.name}${sizePhrase} | Purgo Style`;
  const description = `${product.name} – ${product.description.slice(0, 120)}. Arizona activewear. Purgo Style.`;
  return { title, description: description.slice(0, 160) };
}

export function getProductById(_id: string): Product | undefined {
  return undefined;
}

export function getFeaturedImage(_slug: string): string {
  return "/placeholder.svg";
}

export function getCrossedOutPrice(actualPrice: number): number {
  return Math.round((actualPrice / 0.7) * 100) / 100;
}
