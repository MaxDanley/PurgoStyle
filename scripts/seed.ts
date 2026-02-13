import { PrismaClient } from '@prisma/client';
import { products } from '../lib/products';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  console.log('📦 Seeding products...');

  // Seed products
  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        image: product.image,
        featured: product.featured,
        variants: {
          create: product.variants.map((variant) => ({
            size: variant.size,
            price: variant.price,
            sku: variant.sku,
            stockCount: variant.stockCount,
          })),
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created ${products.length} products`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

