import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { items, shippingInfo, metadata } = await req.json();
    
    console.log('🧪 Manual order creation test:', { items, shippingInfo });
    
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shippingInsurance = 3.50; // Required shipping insurance
    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + shippingInsurance + shippingCost;

    // Generate order number
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create shipping address
    const shippingAddress = await prisma.address.create({
      data: {
        userId: metadata.userId || null,
        name: shippingInfo.name,
        street: shippingInfo.street,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country || "US",
        phone: shippingInfo.phone,
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: metadata.userId || null,
        orderNumber,
        status: "PROCESSING",
        subtotal,
        shippingInsurance,
        shippingCost,
        total,
        shippingAddressId: shippingAddress.id,
        paymentStatus: "PAID",
        statusHistory: {
          create: {
            status: "PROCESSING",
            note: "Order created manually for testing",
          },
        },
      },
    });

    // Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        },
      });
    }

    console.log('✅ Manual order created:', order.orderNumber);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
      },
    });
  } catch (error) {
    console.error('❌ Manual order creation failed:', error);
    return NextResponse.json(
      { error: "Failed to create order manually" },
      { status: 500 }
    );
  }
}
