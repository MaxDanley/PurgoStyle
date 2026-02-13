import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendShippingNotificationEmail, sendTrackingNumberUpdateEmail } from "@/lib/email";

// POST to add initial tracking and set status to SHIPPED
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    const { trackingNumber } = await req.json();

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
      },
    });

    // Send email notification
    try {
      // Get email from order.email (for guest orders) or user.email
      const customerEmail = (order as any).email || order.user?.email;
      if (customerEmail) {
        await sendShippingNotificationEmail(
          customerEmail,
          order.orderNumber,
          trackingNumber
        );
      } else {
        console.warn(`⚠️ No email found for order ${order.orderNumber} - skipping shipping notification email`);
      }
    } catch (emailError) {
      console.error("Failed to send shipping email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to add tracking:", error);
    return NextResponse.json(
      { error: "Failed to add tracking number" },
      { status: 500 }
    );
  }
}

// PATCH to update existing tracking number
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    const { trackingNumber } = await req.json();

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        statusHistory: {
          create: {
            status: "SHIPPED", // Keep as SHIPPED usually, or use current status if available (but simplistic here)
            note: `Tracking number updated to: ${trackingNumber}`,
          },
        },
      },
      include: {
        user: true,
      },
    });

    // Send update email notification
    try {
      // Get email from order.email (for guest orders) or user.email
      const customerEmail = (order as any).email || order.user?.email;
      if (customerEmail) {
        await sendTrackingNumberUpdateEmail(
          customerEmail,
          order.orderNumber,
          trackingNumber
        );
      } else {
        console.warn(`⚠️ No email found for order ${order.orderNumber} - skipping tracking update email`);
      }
    } catch (emailError) {
      console.error("Failed to send tracking update email:", emailError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to update tracking:", error);
    return NextResponse.json(
      { error: "Failed to update tracking number" },
      { status: 500 }
    );
  }
}
