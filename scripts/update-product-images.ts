import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ Updating product images...');

  // Update each product with its new image
  const productUpdates = [
    { slug: 'bpc-157', image: '/bpc_final_product.png' },
    { slug: 'tirzepatide', image: '/glp2_final_product.png' },
    { slug: 'retatrutide', image: '/glp3_final_product.png' },
    { slug: 'glutathione', image: '/gluta_final_product.png' },
    { slug: 'glow', image: '/glow_final_product.png' },
    { slug: 'tesamorelin', image: '/tesa_final_product.png' },
    { slug: 'igf1lr3', image: '/lgf_final_product.png' },
    { slug: 'mots-c', image: '/motsc_final_product.png' },
    { slug: 'bac-water', image: '/bac_final_product.png' },
    { slug: 'melatonin', image: '/mela_final_product.png' },
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
