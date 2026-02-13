import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USPSAPI } from "@/lib/tracking";

// Get tracking information for an order
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    let trackingNumber = url.searchParams.get('trackingNumber');

    if (!orderId && !trackingNumber) {
      return NextResponse.json(
        { error: "Order ID or tracking number required" },
        { status: 400 }
      );
    }

    let order = null;
    if (orderId) {
      // Verify user owns this order
      order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
        },
        include: {
          user: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      if (!order.trackingNumber) {
        return NextResponse.json(
          { error: "No tracking number available" },
          { status: 404 }
        );
      }

      trackingNumber = order.trackingNumber;
    }

    // Ensure we have a tracking number
    if (!trackingNumber) {
      return NextResponse.json(
        { error: "No tracking number available" },
        { status: 400 }
      );
    }

    // Use USPS API (free, official)
    if (!process.env.USPS_CONSUMER_KEY || !process.env.USPS_CONSUMER_SECRET) {
      throw new Error("USPS API credentials not configured");
    }

    const uspsApi = new USPSAPI(
      process.env.USPS_CONSUMER_KEY,
      process.env.USPS_CONSUMER_SECRET
    );
    const trackingInfo = await uspsApi.trackPackage(trackingNumber);

    return NextResponse.json({
      trackingNumber,
      status: trackingInfo.status,
      summary: trackingInfo.summary,
      location: trackingInfo.location,
      lastUpdate: trackingInfo.date,
      order: order ? {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      } : null,
    });

  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { error: "Failed to get tracking information" },
      { status: 500 }
    );
  }
}

// Create tracking for an order (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { orderId, trackingNumber, carrierCode } = await req.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json(
        { error: "Order ID and tracking number required" },
        { status: 400 }
      );
    }

    // Update order with tracking number
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        status: "SHIPPED",
        shippedAt: new Date(),
        statusHistory: {
          create: {
            status: "SHIPPED",
            note: `Tracking number added: ${trackingNumber}`,
          },
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    // Tracking is handled by USPS API when queried

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        status: order.status,
      },
    });

  } catch (error) {
    console.error("Create tracking error:", error);
    return NextResponse.json(
      { error: "Failed to create tracking" },
      { status: 500 }
    );
  }
}
