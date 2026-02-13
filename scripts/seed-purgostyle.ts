/**
 * Seed Summer Steeze store with t-shirt and activewear products.
 * Prices match the CSV list; each product has S, M, L variants.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCTS: { name: string; slug: string; description: string; category: string; image: string; price: number }[] = [
  { name: "Desert Basic Tee", slug: "desert-basic-tee", description: "Lightweight cotton tee. Arizona essential.", category: "Tees", image: "/placeholder.svg", price: 8 },
  { name: "Arizona Sunset Tee", slug: "arizona-sunset-tee", description: "Soft tee in sunset hues.", category: "Tees", image: "/placeholder.svg", price: 24.99 },
  { name: "Cactus Crew", slug: "cactus-crew", description: "Comfortable crew neck.", category: "Tees", image: "/placeholder.svg", price: 29.99 },
  { name: "Monsoon Tee", slug: "monsoon-tee", description: "Breathable summer tee.", category: "Tees", image: "/placeholder.svg", price: 33.99 },
  { name: "Mesa Tank", slug: "mesa-tank", description: "Performance tank.", category: "Tanks", image: "/placeholder.svg", price: 34.99 },
  { name: "Highline Tee", slug: "highline-tee", description: "Everyday premium tee.", category: "Tees", image: "/placeholder.svg", price: 39.99 },
  { name: "Summit Tee", slug: "summit-tee", description: "Active lifestyle tee.", category: "Tees", image: "/placeholder.svg", price: 49.99 },
  { name: "Canyon Tee", slug: "canyon-tee", description: "Bold design tee.", category: "Tees", image: "/placeholder.svg", price: 54.99 },
  { name: "Summer Steeze Classic Tee", slug: "purgo-classic-tee", description: "Signature Summer Steeze tee.", category: "Tees", image: "/placeholder.svg", price: 59.99 },
  { name: "Desert Wind Hoodie", slug: "desert-wind-hoodie", description: "Lightweight hoodie.", category: "Hoodies", image: "/placeholder.svg", price: 69.99 },
  { name: "Sunrise Hoodie", slug: "sunrise-hoodie", description: "Cozy pullover.", category: "Hoodies", image: "/placeholder.svg", price: 74.99 },
  { name: "Peak Performance Hoodie", slug: "peak-performance-hoodie", description: "Training hoodie.", category: "Hoodies", image: "/placeholder.svg", price: 89.99 },
  { name: "Summer Steeze Premium Hoodie", slug: "purgo-premium-hoodie", description: "Premium heavyweight hoodie.", category: "Hoodies", image: "/placeholder.svg", price: 104.99 },
  { name: "Glow Tee", slug: "glow-tee", description: "Standout design.", category: "Tees", image: "/placeholder.svg", price: 114.99 },
  { name: "Ridge Hoodie", slug: "ridge-hoodie", description: "Rugged style hoodie.", category: "Hoodies", image: "/placeholder.svg", price: 124.99 },
  { name: "KLOW Hoodie", slug: "klow-hoodie", description: "Premium oversized hoodie.", category: "Hoodies", image: "/placeholder.svg", price: 154.99 },
];

const SIZES = ["Small", "Medium", "Large"];

async function main() {
  for (const p of PRODUCTS) {
    const slug = p.slug;
    const existing = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
    if (existing) {
      console.log(`Skip (exists): ${p.name}`);
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
        featured: p.price <= 39.99,
        variants: {
          create: SIZES.map((size, i) => ({
            size,
            price: p.price,
            sku: `PS-${p.slug.toUpperCase().replace(/-/g, "")}-${size.charAt(0)}`,
            stockCount: 50,
            active: true,
          })),
        },
      },
    });
    console.log(`Created: ${product.name} (${SIZES.length} variants)`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
