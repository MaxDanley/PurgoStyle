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
      { slugs: ['bpc-157'], image: '/bpc_final_product.png' },
      { slugs: ['glp-2-trz', 'tirzepatide'], image: '/glp2_final_product.png' },
      { slugs: ['glp-3-rt', 'retatrutide'], image: '/glp3_final_product.png' },
      { slugs: ['glutathione'], image: '/gluta_final_product.png' },
      { slugs: ['glow'], image: '/glow_final_product.png' },
      { slugs: ['tesamorelin'], image: '/tesa_final_product.png' },
      { slugs: ['igf1lr3'], image: '/lgf_final_product.png' },
      { slugs: ['mots-c'], image: '/motsc_final_product.png' },
      { slugs: ['bac-water'], image: '/bac_final_product.png' },
      { slugs: ['melatonin'], image: '/mela_final_product.png' },
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
