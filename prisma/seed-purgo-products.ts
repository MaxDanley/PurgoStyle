/**
 * Seed script: 10 Purgo Style Labs products with S/M/L variants.
 * Prices: T-Shirts $100, Hoodies $250, Sweatpants $125, Shell Jacket $350.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-purgo-products.ts
 * Or: npx tsx prisma/seed-purgo-products.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMAGE_BASE = "/PURGO STYLE LABS";

const PRODUCTS = [
  {
    name: "Black Shell Jacket",
    slug: "black-shell-jacket",
    category: "Jackets",
    price: 350,
    image: `${IMAGE_BASE}/black_shell_cover_longsleave.png`,
    description: `Introducing the Purgo Style Labs Shell Jacket in Black. Crafted from lightweight shell fabric, this jacket features a full zip closure with an elasticated hem for a clean, contemporary silhouette. The chest displays the Purgo Style Labs wordmark in a subtle tonal print, with additional branding to the left cuff. The jacket delivers a relaxed, oversized fit with a stand collar and side pockets.

Purgo Style Labs Shell Jacket
Black
Oversized Fit
Full Zip Closure
Elasticated Hem
Purgo Style Labs Chest Branding
Cuff Branding Detail

Composition: 100% Nylon`,
    featured: true,
  },
  {
    name: "Black Sweatpants",
    slug: "black-sweatpants",
    category: "Sweatpants",
    price: 125,
    image: `${IMAGE_BASE}/black_sweatpants_plain.png`,
    description: `Introducing the Purgo Style Labs Essential Sweatpants in Black. Built from heavyweight brushed fleece, these sweatpants feature an elasticated waistband with contrast white drawcords and elasticated cuffs at the ankle for a relaxed yet structured look. A small woven label sits at the left hip. Designed for everyday comfort with a wide, straight leg silhouette.

Purgo Style Labs Essential Sweatpants
Black
Relaxed Fit
Heavyweight Fleece
Contrast White Drawcords
Elasticated Waist & Cuffs
Woven Label Detail

Composition: 100% Cotton`,
    featured: false,
  },
  {
    name: "Black Logo Hoodie",
    slug: "black-logo-hoodie",
    category: "Hoodies",
    price: 250,
    image: `${IMAGE_BASE}/black_sweatshirt_logo.png`,
    description: `Introducing the Purgo Style Labs Logo Hoodie in Black. Constructed from premium heavyweight fleece, this hoodie features a boxy, cropped oversized silhouette with a kangaroo pocket and the Purgo Style Labs wordmark printed across the chest. Additional branding sits on the hood and at the lower left cuff. Finished with a woven tab on the pocket and metal eyelets at the hood.

Purgo Style Labs Logo Hoodie
Black
Oversized Cropped Fit
Heavyweight Fleece
Kangaroo Pocket
Hood & Chest Branding
Woven Tab Detail

Composition: 100% Cotton`,
    featured: true,
  },
  {
    name: "Black Logo T-Shirt (Back)",
    slug: "black-logo-tshirt-back",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/black_tshirt_logo_back.png`,
    description: `Introducing the Purgo Style Labs Logo T-Shirt in Washed Black — back view. Cut from premium heavyweight cotton with a vintage washed finish, this t-shirt features the Purgo Style Labs wordmark and infinity symbol on the upper back in a sky blue print. The oversized, boxy fit drops at the shoulder for a relaxed silhouette.

Purgo Style Labs Logo T-Shirt
Washed Black
Oversized Fit
Sky Blue Back Print
Infinity Symbol Graphic
Vintage Wash Finish

Composition: 100% Cotton`,
    featured: false,
  },
  {
    name: "Black Logo T-Shirt (Front)",
    slug: "black-logo-tshirt-front",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/black_tshirt_logo_front.png`,
    description: `Introducing the Purgo Style Labs Logo T-Shirt in Black — front view. Crafted from premium heavyweight cotton, this t-shirt showcases the Purgo Style Labs wordmark and infinity symbol to the left chest in sky blue. The oversized, boxy fit features a ribbed crew neck and a woven label at the hem. A small branded tag sits at the left sleeve.

Purgo Style Labs Logo T-Shirt
Black
Oversized Fit
Sky Blue Chest Print
Infinity Symbol Graphic
Woven Hem Label
Sleeve Tag Detail

Composition: 100% Cotton`,
    featured: false,
  },
  {
    name: "White T-Shirt — Infinity Logo",
    slug: "white-tshirt-infinity-logo",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/Plain_white_tshirt_purgo_blue.png`,
    description: `Introducing the Purgo Style Labs Essentials T-Shirt in White. Made from premium heavyweight cotton, this minimal t-shirt features the Purgo Style Labs infinity symbol in sky blue on the right chest for a clean, understated look. The oversized boxy fit sits with a ribbed crew neck and a woven label at the lower hem.

Purgo Style Labs Essentials T-Shirt
White
Oversized Fit
Sky Blue Infinity Symbol
Minimal Branding
Woven Hem Label

Composition: 100% Cotton`,
    featured: true,
  },
  {
    name: "Tan Logo T-Shirt (Front)",
    slug: "tan-logo-tshirt-front",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/tan_tshirt_logo_front.png`,
    description: `Introducing the Purgo Style Labs Logo T-Shirt in Sand. Cut from premium heavyweight cotton, this t-shirt features the Purgo Style Labs wordmark and infinity symbol centered on the chest in sky blue. The relaxed, boxy oversized fit includes a ribbed crew neck, a branded tag at the left sleeve, and a woven label at the hem.

Purgo Style Labs Logo T-Shirt
Sand
Oversized Fit
Sky Blue Chest Print
Infinity Symbol Graphic
Sleeve Tag & Hem Label

Composition: 100% Cotton`,
    featured: false,
  },
  {
    name: "White Sweatpants",
    slug: "white-sweatpants",
    category: "Sweatpants",
    price: 125,
    image: `${IMAGE_BASE}/white_sweatpants_plain.png`,
    description: `Introducing the Purgo Style Labs Essential Sweatpants in Oatmeal Marl. Built from heavyweight brushed fleece, these sweatpants feature an elasticated waistband with tonal drawcords and elasticated cuffs at the ankle. A small woven label sits at the left hip. Designed with a wide, relaxed leg for effortless everyday wear.

Purgo Style Labs Essential Sweatpants
Oatmeal Marl
Relaxed Fit
Heavyweight Fleece
Tonal Drawcords
Elasticated Waist & Cuffs
Woven Label Detail

Composition: 100% Cotton`,
    featured: false,
  },
  {
    name: "White Logo Hoodie",
    slug: "white-logo-hoodie",
    category: "Hoodies",
    price: 250,
    image: `${IMAGE_BASE}/white_sweatshirt_plain.png`,
    description: `Introducing the Purgo Style Labs Logo Hoodie in Oatmeal Marl. Constructed from premium heavyweight fleece, this hoodie features a boxy, cropped oversized silhouette with a kangaroo pocket and the Purgo Style Labs wordmark with infinity symbol in sky blue across the chest. Finished with metal eyelets at the hood and a woven tab on the pocket.

Purgo Style Labs Logo Hoodie
Oatmeal Marl
Oversized Cropped Fit
Heavyweight Fleece
Sky Blue Chest Print
Kangaroo Pocket
Woven Tab Detail

Composition: 100% Cotton`,
    featured: false,
  },
  {
    name: "White Logo T-Shirt (Back)",
    slug: "white-logo-tshirt-back",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/white_tshirt_logo_back.png`,
    description: `Introducing the Purgo Style Labs Logo T-Shirt in White — back view. Crafted from premium heavyweight cotton, this t-shirt features the Purgo Style Labs wordmark and infinity symbol centered on the upper back in sky blue. The oversized, boxy fit delivers a relaxed, contemporary silhouette.

Purgo Style Labs Logo T-Shirt
White
Oversized Fit
Sky Blue Back Print
Infinity Symbol Graphic

Composition: 100% Cotton`,
    featured: false,
  },
];

const SIZES = ["S", "M", "L"];

async function main() {
  console.log("Seeding 10 Purgo Style Labs products with S/M/L variants...\n");

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`Product "${p.name}" (${p.slug}) already exists, skipping.`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        image: p.image,
        active: true,
        featured: p.featured,
      },
    });

    for (const size of SIZES) {
      const sku = `PSL-${p.slug}-${size}`;
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          size,
          price: p.price,
          stockCount: 99,
          sku,
          active: true,
        },
      });
    }

    console.log(`Created: ${p.name} (${p.slug}) @ $${p.price} with S, M, L`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
