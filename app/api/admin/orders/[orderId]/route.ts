import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusChangeEmail, sendPaymentConfirmationEmail, sendOrderConfirmationEmail } from "@/lib/email";

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
    const { status, trackingNumber, note, cancellationReason, sendEmail = true } = await req.json();

    // Validate status is provided and is a valid OrderStatus
    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
    if (!status || typeof status !== "string" || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Get the current order to check old status and get customer email
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { email: true }
        },
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        shippingAddress: true
      }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate tracking number requirement for SHIPPED status
    if (status === "SHIPPED" && !trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required when changing status to SHIPPED" },
        { status: 400 }
      );
    }

    // Handle stock adjustments based on status changes
    const oldStatus = currentOrder.status;
    
    // If moving from non-processing to PROCESSING: decrease stock (skip backordered items)
    if (status === "PROCESSING" && oldStatus !== "PROCESSING") {
      for (const item of currentOrder.items) {
        // Skip stock decrement for backordered items
        if (item.isBackorder) {
          console.log(`⏳ Skipping stock decrement for backordered item ${item.variant.sku}`);
          continue;
        }
        
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockCount: {
              decrement: item.quantity
            }
          }
        });
        console.log(`✅ Decreased stock for ${item.variant.sku} by ${item.quantity}`);
      }
    }
    
    // If moving from PROCESSING to CANCELLED: restore stock (skip backordered items)
    if (status === "CANCELLED" && oldStatus === "PROCESSING") {
      for (const item of currentOrder.items) {
        // Skip stock restoration for backordered items (they never decreased stock)
        if (item.isBackorder) {
          console.log(`⏳ Skipping stock restoration for backordered item ${item.variant.sku}`);
          continue;
        }
        
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockCount: {
              increment: item.quantity
            }
          }
        });
        console.log(`✅ Restored stock for ${item.variant.sku} by ${item.quantity}`);
      }
    }

    // Prepare update data
    const statusNote = cancellationReason 
      ? cancellationReason 
      : (note || `Status updated to ${status}`);
    
    const updateData: any = {
      status,
      statusHistory: {
        create: {
          status,
          note: statusNote,
        },
      },
    };

    // If moving from PENDING to PROCESSING, also update paymentStatus to PAID
    if (oldStatus === "PENDING" && status === "PROCESSING") {
      updateData.paymentStatus = "PAID";
    }

    // Add tracking number and shipped date if status is SHIPPED
    if (status === "SHIPPED") {
      updateData.trackingNumber = trackingNumber;
      updateData.shippedAt = new Date();
    }

    // Add delivered date if status is DELIVERED
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: { email: true }
        },
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        shippingAddress: true
      }
    });

    // Get customer email (prefer order.email for guest orders, fallback to user.email)
    const customerEmail = (order as any).email || order.user?.email || currentOrder.user?.email || "";

    // Send "Thank you for your purchase" order confirmation when status changes to PROCESSING
    if (oldStatus === "PENDING" && status === "PROCESSING" && customerEmail) {
      try {
        const addr = order.shippingAddress;
        const orderDetailsForConfirmation = {
          items: order.items.map((item: any) => ({
            productName: item.product?.name || "Product",
            variantSize: item.variant?.size || "",
            quantity: item.quantity,
            price: item.price,
            isBackorder: item.isBackorder || false,
          })),
          shippingAddress: addr ? {
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country || "US",
          } : undefined,
          subtotal: order.subtotal,
          shippingInsurance: (order as any).shippingInsurance ?? 3.50,
          shippingCost: order.shippingCost,
          total: order.total,
          discountAmount: (order as any).discountAmount ?? 0,
        };
        await sendOrderConfirmationEmail(
          customerEmail,
          order.orderNumber,
          orderDetailsForConfirmation,
          (order as any).paymentMethod || "OTHER"
        );
        console.log(`✅ Order confirmation ("Thank you for your purchase") email sent for order ${order.orderNumber}`);
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }
      try {
        const paymentMethod = (order as any).paymentMethod || "OTHER";
        await sendPaymentConfirmationEmail(
          customerEmail,
          order.orderNumber,
          paymentMethod,
          {
            total: order.total,
            subtotal: order.subtotal,
            shippingInsurance: (order as any).shippingInsurance || 3.50,
            shipping: order.shippingCost,
            items: order.items.map((item: any) => ({
              productName: item.product?.name || "Product",
              variantSize: item.variant?.size || "",
              quantity: item.quantity,
              price: item.price,
              isBackorder: item.isBackorder || false,
            })),
          }
        );
        console.log(`✅ Payment confirmation email sent for order ${order.orderNumber}`);
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
      }
    }

    // Send email notification for status change (only if sendEmail is true)
    if (sendEmail) {
      try {
        await sendOrderStatusChangeEmail(
          customerEmail,
          order.orderNumber,
          currentOrder.status,
          status,
          trackingNumber,
          cancellationReason
        );
        console.log(`✅ Status change email sent for order ${order.orderNumber}`);
      } catch (emailError) {
        console.error("Failed to send status change email:", emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log(`⏭️ Skipping email notification for order ${order.orderNumber} (sendEmail=false)`);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

