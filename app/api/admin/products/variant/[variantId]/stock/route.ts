import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ variantId: string }> }
) {
  try {
    const session = await auth();
    const { variantId } = await context.params;

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant ID is required" },
        { status: 400 }
      );
    }

    const { stockCount } = await request.json();

    if (stockCount === undefined || stockCount < 0) {
      return NextResponse.json(
        { error: "Invalid stock count" },
        { status: 400 }
      );
    }

    // Get current stock before updating
    const currentVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    const oldStockCount = currentVariant?.stockCount || 0;
    const newStockCount = parseInt(stockCount);

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stockCount: newStockCount },
    });

    // If stock went from 0 to > 0, send notifications
    if (oldStockCount === 0 && newStockCount > 0) {
      // Send notifications asynchronously (don't wait)
      sendStockNotificationEmails(variantId).catch(console.error);
    }

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}

async function sendStockNotificationEmails(variantId: string) {
  try {
    // Get variant with product info
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) return;

    // Get all pending notifications for this variant
    const notifications = await prisma.stockNotification.findMany({
      where: {
        variantId,
        notified: false,
      },
    });

    if (notifications.length === 0) return;

    console.log(`Sending stock notifications to ${notifications.length} users...`);

    const productName = `${variant.product.name} (${variant.size})`;

    for (const notification of notifications) {
      try {
        await sendEmail({
          from: "Summer Steeze <noreply@summersteez.com>",
          to: notification.email,
          subject: `${productName} is back in stock!`,
          html: `
            <h1>Great news! ${productName} is back in stock</h1>
            <p>Hi there,</p>
            <p>We wanted to let you know that <strong>${productName}</strong> is now available again at Summer Steeze!</p>
            <p>Hurry - limited stock available!</p>
            <a href="https://www.summersteez.com/products/${variant.product.slug}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Shop Now
            </a>
            <p>Best regards,<br>The Summer Steeze Team</p>
          `,
        });

        // Mark as notified
        await prisma.stockNotification.update({
          where: { id: notification.id },
          data: { notified: true },
        });

        console.log(`✅ Sent notification to ${notification.email}`);
      } catch (error) {
        console.error(`Failed to send notification to ${notification.email}:`, error);
      }
    }
  } catch (error) {
    console.error("Error sending stock notifications:", error);
  }
}
