import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log('🖼️ Updating product images...');

    // Update each product with its new image
    // Handle both old slugs (tirzepatide/retatrutide) and new slugs (glp-2-trz/glp-3-rt)
    const productUpdates = [
      { slugs: ['bpc-157'], image: '/products/bpc157.png' },
      { slugs: ['glp-2-trz', 'tirzepatide'], image: '/products/tirzepatide.png' },
      { slugs: ['glp-3-rt', 'retatrutide'], image: '/products/retatrutide.png' },
      { slugs: ['glutathione'], image: '/products/glutathione.png' },
      { slugs: ['glow'], image: '/products/glow.png' },
      { slugs: ['tesamorelin'], image: '/products/tesamorelin.png' },
      { slugs: ['igf1lr3'], image: '/products/igf1lr3.png' },
      { slugs: ['mots-c'], image: '/placeholder.svg' },
      { slugs: ['bac-water'], image: '/bac_final_product.png' },
      { slugs: ['melatonin'], image: '/placeholder.svg' },
    ];

    const results = [];
    for (const update of productUpdates) {
      let updated = false;
      for (const slug of update.slugs) {
        try {
          const product = await prisma.product.update({
            where: { slug },
            data: { image: update.image },
          });
          results.push({ success: true, product: product.name, slug, image: update.image });
          console.log(`✅ Updated ${product.name} (${slug}) with image: ${update.image}`);
          updated = true;
          break; // Successfully updated, move to next product
        } catch (error) {
          // Try next slug if this one doesn't exist
          continue;
        }
      }
      if (!updated) {
        results.push({ success: false, slugs: update.slugs, error: 'Product not found with any of the provided slugs' });
        console.error(`❌ Failed to update product with slugs: ${update.slugs.join(', ')}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product images updated',
      results
    });

  } catch (error) {
    console.error('Error updating product images:', error);
    return NextResponse.json(
      { error: "Failed to update product images" },
      { status: 500 }
    );
  }
}
