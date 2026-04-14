/**
 * Seed script: 10 PurgoLabs SummerSteeze products with S/M/L variants.
 * Prices: T-Shirts $100, Hoodies $250, Sweatpants $125, Shell Jacket $350.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-purgo-products.ts
 * Or: npx tsx prisma/seed-purgo-products.ts
 *
 * Uses upsert so re-running updates names and descriptions (SKUs preserved on variant update).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMAGE_BASE = "/PURGO STYLE LABS (1)";

const OVERSIZED_TEES =
  "Fit is intentionally oversized / overfit: dropped shoulder, wider body, and extra length compared to a classic retail tee. If you prefer a closer, standard tee silhouette, order one size down. S, M, and L are offered; when in doubt, compare to a tee you already own and size for the amount of drape you want.";

const OVERSIZED_TOPS =
  "Silhouette is relaxed with extra room through the chest and body—closer to streetwear / overfit than a slim athletic cut. Size down if you want less volume.";

const OVERSIZED_BOTTOMS =
  "Fit is relaxed through the seat and thigh with a fuller leg and ankle stack—size down if you want a trimmer sweatpant.";

const PRODUCTS = [
  {
    name: "Black Shell Jacket",
    slug: "black-shell-jacket",
    category: "Jackets",
    price: 350,
    image: `${IMAGE_BASE}/black_shell_cover_longsleave.png`,
    description: `A lightweight black shell layer built for wind and light weather. Clean, minimal face—no chest graphics or loud branding in the product story: it reads as a simple technical jacket. Full zip, stand collar, elasticated hem, and side pockets.

${OVERSIZED_TOPS}

Jacket body runs generous; sleeve and torso length are tuned for layering over hoodies or tees.

• Full zip / stand collar
• Elasticated hem, side pockets
• Composition: 100% nylon`,
    featured: true,
  },
  {
    name: "Black Sweatpants",
    slug: "black-sweatpants",
    category: "Sweatpants",
    price: 125,
    image: `${IMAGE_BASE}/black_sweatpants_plain.png`,
    description: `Essential black sweatpants in heavyweight brushed fleece. Elastic waist with contrast drawcords, elastic cuffs, and a straight relaxed leg—plain construction focused on comfort and daily wear.

${OVERSIZED_BOTTOMS}

Choose size for how much stack you want at the ankle and how relaxed you like the seat and thigh.

• Heavyweight fleece
• Elasticated waist & cuffs
• Composition: 100% cotton`,
    featured: false,
  },
  {
    name: "Black Oversized Hoodie",
    slug: "black-logo-hoodie",
    category: "Hoodies",
    price: 250,
    image: `${IMAGE_BASE}/black_sweatshirt_logo.png`,
    description: `Heavyweight black fleece hoodie with a cropped, boxy body and kangaroo pocket. Treated as a plain wardrobe hoodie in the catalog copy: emphasis is on fabric weight, silhouette, and everyday layering—not on graphics.

${OVERSIZED_TOPS}

Hoodie is intentionally voluminous; size down if you want less width through the body.

• Heavyweight fleece
• Kangaroo pocket
• Composition: 100% cotton`,
    featured: true,
  },
  {
    name: "Black Plain T-Shirt (Back)",
    slug: "black-logo-tshirt-back",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/black_tshirt_logo_back.png`,
    description: `Washed black plain tee in heavyweight cotton with a vintage wash. Catalog listing describes a clean, minimal shirt—no chest or back graphic story in the product copy. Ribbed crew neck, substantial hand feel.

${OVERSIZED_TEES}

• Vintage wash finish
• Ribbed crew neck
• Composition: 100% cotton`,
    featured: false,
  },
  {
    name: "Black Plain T-Shirt (Front)",
    slug: "black-logo-tshirt-front",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/black_tshirt_logo_front.png`,
    description: `Black plain tee cut from heavyweight cotton. Listing focuses on a simple, blank-forward tee: roomy through the chest and shoulder for an intentional overfit look.

${OVERSIZED_TEES}

• Ribbed crew neck
• Subtle woven label at hem (trim if you want a fully blank look)
• Composition: 100% cotton`,
    featured: false,
  },
  {
    name: "White Plain T-Shirt",
    slug: "white-tshirt-infinity-logo",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/Plain_white_tshirt_purgo_blue.png`,
    description: `White heavyweight cotton tee with a ribbed crew neck. Sold and described as a plain essential—oversized block fit for an easy, relaxed drape.

${OVERSIZED_TEES}

• Plain essential—simple wardrobe tee
• Woven label at hem
• Composition: 100% cotton`,
    featured: true,
  },
  {
    name: "Sand Plain T-Shirt (Front)",
    slug: "tan-logo-tshirt-front",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/tan_tshirt_logo_front.png`,
    description: `Sand / tan plain tee in premium heavyweight cotton. Designed as an oversized everyday shirt with extra body width and a relaxed shoulder line.

${OVERSIZED_TEES}

• Ribbed crew neck
• Composition: 100% cotton`,
    featured: false,
  },
  {
    name: "White Sweatpants",
    slug: "white-sweatpants",
    category: "Sweatpants",
    price: 125,
    image: `${IMAGE_BASE}/white_sweatpants_plain.png`,
    description: `Oatmeal marl sweatpants in brushed heavyweight fleece. Tonal drawcords, elastic waist and cuffs, and a wide relaxed leg—plain, staple sweatpants.

${OVERSIZED_BOTTOMS}

• Heavyweight fleece
• Elasticated waist & cuffs
• Composition: 100% cotton`,
    featured: false,
  },
  {
    name: "Oatmeal Oversized Hoodie",
    slug: "white-logo-hoodie",
    category: "Hoodies",
    price: 250,
    image: `${IMAGE_BASE}/white_sweatshirt_plain.png`,
    description: `Oatmeal marl heavyweight fleece hoodie with a cropped, boxy silhouette and kangaroo pocket. Positioned in copy as a plain, tonal hoodie—priority on fleece hand-feel and oversized proportion.

${OVERSIZED_TOPS}

• Metal eyelets at hood
• Composition: 100% cotton`,
    featured: false,
  },
  {
    name: "White Plain T-Shirt (Back)",
    slug: "white-logo-tshirt-back",
    category: "T-Shirts",
    price: 100,
    image: `${IMAGE_BASE}/white_tshirt_logo_back.png`,
    description: `White heavyweight cotton tee—plain catalog description with an oversized / overfit block. Ribbed crew neck; generous width and length for a relaxed streetwear proportion.

${OVERSIZED_TEES}

• Composition: 100% cotton`,
    featured: false,
  },
];

const SIZES = ["S", "M", "L"];

async function main() {
  console.log("Upserting 10 PurgoLabs SummerSteeze products with S/M/L variants...\n");

  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category,
        image: p.image,
        active: true,
        featured: p.featured,
      },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        image: p.image,
        featured: p.featured,
        active: true,
      },
    });

    for (const size of SIZES) {
      const sku = `PSL-${p.slug}-${size}`;
      await prisma.productVariant.upsert({
        where: { sku },
        create: {
          productId: product.id,
          size,
          price: p.price,
          stockCount: 99,
          sku,
          active: true,
        },
        update: {
          productId: product.id,
          size,
          price: p.price,
          active: true,
        },
      });
    }

    console.log(`Upserted: ${p.name} (${p.slug}) @ $${p.price} with S, M, L`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
