import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { products } from "@/lib/products";

export async function POST() {
  try {
    console.log('🌱 Starting product seeding...');

    // Clear existing products and variants
    await prisma.orderItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    console.log('🧹 Cleared existing products');

    // Create products and variants
    for (const product of products) {
      console.log(`📦 Creating product: ${product.name}`);
      
      const createdProduct = await prisma.product.create({
        data: {
          id: product.id, // Use the string ID from products.ts
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          image: product.image,
          featured: product.featured,
          active: true,
        },
      });

      // Create variants
      for (const variant of product.variants) {
        await prisma.productVariant.create({
          data: {
            id: variant.id, // Use the string ID from products.ts
            productId: createdProduct.id,
            size: variant.size,
            price: variant.price,
            sku: variant.sku,
            stockCount: variant.stockCount,
            active: true,
          },
        });
        console.log(`  ✅ Created variant: ${variant.size} - $${variant.price}`);
      }
    }

    console.log('🎉 Product seeding completed successfully!');
    
    // Verify the seeding
    const productCount = await prisma.product.count();
    const variantCount = await prisma.productVariant.count();
    
    return NextResponse.json({
      success: true,
      message: `Created ${productCount} products and ${variantCount} variants`,
      productCount,
      variantCount,
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    return NextResponse.json(
      { error: "Failed to seed products" },
      { status: 500 }
    );
  }
}
