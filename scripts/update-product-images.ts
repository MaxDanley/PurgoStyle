import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ Updating product images...');

  // Update each product with its new image
  const productUpdates = [
    { slug: 'bpc-157', image: '/products/bpc157.png' },
    { slug: 'tirzepatide', image: '/products/tirzepatide.png' },
    { slug: 'retatrutide', image: '/products/retatrutide.png' },
    { slug: 'glutathione', image: '/products/glutathione.png' },
    { slug: 'glow', image: '/products/glow.png' },
    { slug: 'tesamorelin', image: '/products/tesamorelin.png' },
    { slug: 'igf1lr3', image: '/products/igf1lr3.png' },
    { slug: 'mots-c', image: '/placeholder.svg' },
    { slug: 'bac-water', image: '/bac_final_product.png' },
    { slug: 'melatonin', image: '/placeholder.svg' },
  ];

  for (const update of productUpdates) {
    try {
      const product = await prisma.product.update({
        where: { slug: update.slug },
        data: { image: update.image },
      });
      console.log(`✅ Updated ${product.name} with image: ${update.image}`);
    } catch (error) {
      console.error(`❌ Failed to update ${update.slug}:`, error);
    }
  }

  console.log('🎉 Product image updates completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error updating product images:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
