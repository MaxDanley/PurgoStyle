import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { items, shippingAddressId, subtotal, shippingInsurance, shippingCost, total } = await req.json();

    // Generate order number
    const orderNumber = `PL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Retrieve attribution data from cookies
    const cookieStore = await cookies();
    const attributionCookie = cookieStore.get("purgo_attribution");
    const initialReferrerCookie = cookieStore.get("purgo_initial_referrer");
    
    let attributionData: any = {};
    if (attributionCookie) {
      try {
        attributionData = JSON.parse(attributionCookie.value);
      } catch {
        // Ignore parsing errors
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: (session.user as any).id,
        orderNumber,
        status: "PENDING",
        subtotal,
        shippingInsurance: shippingInsurance || 3.50,
        shippingCost,
        total,
        shippingAddressId,
        paymentStatus: "PAID",
        
        // Add attribution
        attributionSource: attributionData.source,
        attributionMedium: attributionData.medium,
        attributionCampaign: attributionData.campaign,
        attributionContent: attributionData.content,
        attributionTerm: attributionData.term,
        initialReferrer: initialReferrerCookie?.value,

        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        statusHistory: {
          create: {
            status: "PENDING",
            note: "Order placed",
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(_req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: (session.user as any).id,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Include payment method and crypto payment info in response
    const ordersWithPaymentInfo = orders.map(order => ({
      ...order,
      paymentMethod: (order as any).paymentMethod || "OTHER",
      cryptoPaymentId: (order as any).cryptoPaymentId || null,
      cryptoPaymentStatus: (order as any).cryptoPaymentStatus || null,
      paymentStatus: (order as any).paymentStatus || "PENDING",
    }));

    return NextResponse.json({ orders: ordersWithPaymentInfo });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

