/** Summer Steeze: products are loaded from DB. This file provides fallbacks and helpers. */

/** Remove any Purgo / Purgolabs / peptide references from displayed text. Use for all user-facing product names and descriptions. */
export function sanitizeBrandText(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\bPurgo\s*Style\s*Labs\b/gi, "Summer Steeze")
    .replace(/\bPurgolabs\b/gi, "Summer Steeze")
    .replace(/\bPurgo\b/g, "")
    .replace(/\bpeptides?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

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
  const name = sanitizeBrandText(product.name);
  const desc = sanitizeBrandText(product.description);
  const sizes = product.variants?.map((v) => v.size).filter(Boolean).slice(0, 3) || [];
  const sizePhrase = sizes.length ? ` ${sizes.join(" & ")}` : "";
  const title = `Buy ${name}${sizePhrase} | Summer Steeze`;
  const description = `${name} – ${desc.slice(0, 120)}. Arizona activewear. Summer Steeze.`;
  return { title, description: description.slice(0, 160) };
}

export function getProductById(_id: string): Product | undefined {
  return undefined;
}

export function getFeaturedImage(_slug: string): string {
  return "/placeholder.svg";
}

/** Map product slug to secondary image (hover) from /secondary_pictures/ */
const SECONDARY_IMAGES: Record<string, string> = {
  "black-logo-hoodie": "/secondary_pictures/black_logo_hoodie_2.png",
  "black-logo-tshirt": "/secondary_pictures/black_logo_tshirt_black_2.png",
  "black-shell-jacket": "/secondary_pictures/black_shell_jacket_2.png",
  "black-sweatpants": "/secondary_pictures/black_sweatpants_2.png",
  "black-t-logo-font": "/secondary_pictures/black_t_logo_font_2.png",
  "white-logo-t": "/secondary_pictures/white_logo_t_2_back.png",
  "white-sweats": "/secondary_pictures/white_sweats_2.png",
  "white-sweatshirt": "/secondary_pictures/white_sweatshirt_2.png",
  "white-t-font-infinity": "/secondary_pictures/white_t_font_2_infinity.png",
};

export function getSecondaryImageUrl(slug: string): string | null {
  return SECONDARY_IMAGES[slug] ?? null;
}

/** All secondary image paths for home page triple section */
export const SECONDARY_PICTURES_FOR_HOME = [
  "/secondary_pictures/white_sweatshirt_2.png",
  "/secondary_pictures/black_logo_hoodie_2.png",
  "/secondary_pictures/white_sweats_2.png",
];

export function getCrossedOutPrice(actualPrice: number): number {
  return Math.round((actualPrice / 0.7) * 100) / 100;
}
