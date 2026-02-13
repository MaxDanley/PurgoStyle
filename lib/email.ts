import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;

const getResend = () => {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set - emails will not be sent");
      // Return a mock instance for build time
      return null;
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

const fromEmail = process.env.EMAIL_FROM || "noreply@purgostyle.com";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.purgostyle.com";
const supportEmail = process.env.SUPPORT_EMAIL || "support@purgostyle.com";

// Shopify-style email template wrapper
function getEmailWrapper(content: string, orderNumber?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purgo Style Labs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e5e5e5;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="font-size: 24px; font-weight: 400; color: #333333;">
                    Purgo Style Labs
                  </td>
                  ${orderNumber ? `
                  <td style="text-align: right; font-size: 14px; color: #999999;">
                    ORDER ${orderNumber}
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.5;">
                If you have any questions, reply to this email or contact us at<br>
                <a href="mailto:support@purgostyle.com" style="color: #1a73e8; text-decoration: none;">support@purgostyle.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Helper to render order items in Shopify style
function renderOrderItems(items: any[]) {
  return items.map((item: any) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="width: 60px; vertical-align: top;">
              <div style="width: 50px; height: 50px; background-color: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #999; font-size: 20px;">📦</span>
              </div>
            </td>
            <td style="vertical-align: top; padding-left: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #333333;">
                ${item.productName} × ${item.quantity}
                ${item.isBackorder ? '<span style="color: #f59e0b; font-size: 12px; margin-left: 8px;">[BACKORDER]</span>' : ''}
              </p>
              <p style="margin: 0; font-size: 13px; color: #666666;">
                ${item.variantSize}
              </p>
            </td>
            <td style="text-align: right; vertical-align: top; white-space: nowrap;">
              <p style="margin: 0; font-size: 14px; color: #333333;">
                $${(item.quantity * item.price).toFixed(2)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');
}

// Helper to render financial summary
function renderFinancialSummary(orderDetails: any) {
  const discountAmount = orderDetails.discountAmount || 0;
  const shippingInsurance = orderDetails.shippingInsurance || orderDetails.tax || 3.50;
  const shipping = orderDetails.shipping || orderDetails.shippingCost || 0;
  
  return `
    <table role="presentation" style="width: 100%; margin-top: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Subtotal</td>
        <td style="padding: 8px 0; font-size: 14px; color: #333333; text-align: right;">$${orderDetails.subtotal.toFixed(2)}</td>
      </tr>
      ${discountAmount > 0 ? `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
          Discount
          ${orderDetails.discountCode ? `<br><span style="font-size: 12px; color: #999;">🏷️ ${orderDetails.discountCode}</span>` : ''}
        </td>
        <td style="padding: 8px 0; font-size: 14px; color: #16a34a; text-align: right;">-$${discountAmount.toFixed(2)}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Shipping Insurance</td>
        <td style="padding: 8px 0; font-size: 14px; color: #333333; text-align: right;">$${shippingInsurance.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
          Shipping
          ${shipping === 0 ? '<br><span style="font-size: 12px; color: #16a34a;">🎉 FREE SHIPPING</span>' : ''}
        </td>
        <td style="padding: 8px 0; font-size: 14px; color: #333333; text-align: right;">
          ${shipping === 0 ? '<span style="color: #16a34a;">Free</span>' : `$${shipping.toFixed(2)}`}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e5e5e5;"></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 18px; font-weight: 600; color: #333333;">Total</td>
        <td style="padding: 8px 0; font-size: 18px; font-weight: 600; color: #333333; text-align: right;">$${orderDetails.total.toFixed(2)} USD</td>
      </tr>
      ${discountAmount > 0 || shipping === 0 ? `
      <tr>
        <td colspan="2" style="text-align: right; padding-top: 4px;">
          <span style="font-size: 13px; color: #16a34a;">You saved $${(discountAmount + (shipping === 0 ? 10 : 0)).toFixed(2)}</span>
        </td>
      </tr>
      ` : ''}
    </table>
  `;
}

// Helper to render shipping address
function renderShippingAddress(address: any) {
  if (!address) return '';
  return `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333333;">Customer information</h3>
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="vertical-align: top; width: 50%; padding-right: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #333333;">Shipping address</p>
            <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
              ${address.name}<br>
              ${address.street}<br>
              ${address.city}, ${address.state} ${address.zipCode}<br>
              ${address.country || 'United States'}
            </p>
          </td>
          <td style="vertical-align: top; width: 50%; padding-left: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #333333;">Shipping method</p>
            <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
              USPS Priority Mail
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Generic send function with Omnisend priority and Resend fallback
export async function sendEmail({
  to,
  subject,
  html,
  from = fromEmail,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.error("❌ Resend not configured (no API key)");
    throw new Error("Email service not configured");
  }
  await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
  console.log(`✅ Email sent via Resend to ${to}`);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    await sendEmail({
      to: email,
      subject: "Reset Your Password - Purgo Style Labs",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">Reset Your Password</h2>
          <p>You requested to reset your password for your Purgo Style Labs account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Purgo Style Labs</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  orderDetails: any,
  paymentMethod?: string
) {
  // Backorder notice
  const hasBackorder = orderDetails.items && orderDetails.items.some((item: any) => item.isBackorder);
  const backorderNotice = hasBackorder ? `
    <div style="margin-top: 20px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #92400e;">⏳ Backorder Notice</p>
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        Some items are on backorder and will ship within ~2 weeks. You'll receive a separate tracking email.
      </p>
    </div>
  ` : '';

  const content = `
    <!-- Thank you message -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      Thank you for your purchase!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      We're getting your order ready to be shipped. We will notify you when it has been sent.
    </p>
    
    <!-- CTA Buttons -->
    <table role="presentation" style="margin-bottom: 32px;">
      <tr>
        <td>
          <a href="${baseUrl}/track-order" style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
            View your order
          </a>
        </td>
        <td style="padding-left: 16px;">
          <span style="color: #666666;">or</span>
          <a href="${baseUrl}/products" style="color: #1a73e8; text-decoration: none; margin-left: 8px; font-size: 14px;">
            Visit our store
          </a>
        </td>
      </tr>
    </table>
    
    ${backorderNotice}
    
    <!-- Order Summary -->
    <div style="margin-top: 32px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #333333;">
        Order summary
      </h2>
      <table role="presentation" style="width: 100%;">
        ${renderOrderItems(orderDetails.items)}
      </table>
      
      ${renderFinancialSummary(orderDetails)}
    </div>
    
    ${renderShippingAddress(orderDetails.shippingAddress)}
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Order #${orderNumber} confirmed - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    throw error;
  }
}

export async function sendShippingNotificationEmail(
  email: string,
  orderNumber: string,
  trackingNumber: string
) {
  const content = `
    <!-- Shipped message -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      Your order is on the way!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      Great news! Your order has been shipped and is on its way to you.
    </p>
    
    <!-- Tracking Box -->
    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">Tracking number</p>
      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #333333; font-family: monospace;">
        ${trackingNumber}
      </p>
      <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}" 
         style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
        Track your shipment
      </a>
    </div>
    
    <!-- Delivery estimate -->
    <div style="padding: 20px; background-color: #f8f8f8; border-radius: 8px;">
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #666666;">Estimated delivery</p>
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #333333;">3-5 business days</p>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #666666;">Carrier</p>
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #333333;">USPS Priority Mail</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- CTA -->
    <div style="margin-top: 24px; text-align: center;">
      <a href="${baseUrl}/track-order" style="color: #1a73e8; text-decoration: none; font-size: 14px;">
        View order details →
      </a>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Your order #${orderNumber} has shipped - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send shipping notification email:", error);
    throw error;
  }
}

export async function sendOrderStatusChangeEmail(
  email: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
  trackingNumber?: string,
  cancellationReason?: string
) {
  const statusConfig: Record<string, { title: string; message: string; color: string; bgColor: string; icon: string }> = {
    "PENDING": { 
      title: "Order Received", 
      message: "We've received your order and are preparing it for processing.", 
      color: "#92400e",
      bgColor: "#fef3c7",
      icon: "📋"
    },
    "PROCESSING": { 
      title: "Order Processing", 
      message: "Your order is being prepared for shipment. You'll receive tracking information soon.", 
      color: "#1e40af",
      bgColor: "#dbeafe",
      icon: "⚙️"
    },
    "SHIPPED": { 
      title: "Order Shipped!", 
      message: "Your order has been shipped and is on its way to you.", 
      color: "#166534",
      bgColor: "#dcfce7",
      icon: "📦"
    },
    "DELIVERED": { 
      title: "Order Delivered", 
      message: "Your order has been successfully delivered. We hope you love your purchase!", 
      color: "#166534",
      bgColor: "#dcfce7",
      icon: "✅"
    },
    "CANCELLED": { 
      title: "Order Cancelled", 
      message: "Your order has been cancelled.", 
      color: "#991b1b",
      bgColor: "#fee2e2",
      icon: "❌"
    },
    "REFUNDED": { 
      title: "Order Refunded", 
      message: "Your order has been refunded. Please allow 5-10 business days for the refund to appear.", 
      color: "#6b21a8",
      bgColor: "#f3e8ff",
      icon: "💰"
    },
  };

  const status = statusConfig[newStatus] || { 
    title: "Order Update", 
    message: "There's been an update to your order.", 
    color: "#374151",
    bgColor: "#f3f4f6",
    icon: "ℹ️"
  };

  const trackingSection = trackingNumber ? `
    <div style="margin-top: 24px; padding: 20px; background-color: #f0fdf4; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">Tracking number</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333333; font-family: monospace;">
        ${trackingNumber}
      </p>
      <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}" 
         style="display: inline-block; padding: 10px 20px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px;">
        Track your shipment
      </a>
    </div>
  ` : '';

  const cancellationSection = cancellationReason && (newStatus === "CANCELLED" || newStatus === "REFUNDED") ? `
    <div style="margin-top: 20px; padding: 16px; background-color: #fef2f2; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #991b1b;">Reason</p>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d; white-space: pre-wrap;">${cancellationReason}</p>
    </div>
  ` : '';

  const content = `
    <!-- Status Update Header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      ${status.icon} ${status.title}
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      We have an update on your order.
    </p>
    
    <!-- Status Box -->
    <div style="padding: 24px; background-color: ${status.bgColor}; border-radius: 8px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%;">
        <tr>
          <td>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${status.color};">${newStatus}</p>
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: ${status.color}; line-height: 1.5;">
        ${status.message}
      </p>
    </div>
    
    ${trackingSection}
    ${cancellationSection}
    
    ${newStatus === "DELIVERED" ? `
    <!-- Google Review Request -->
    <div style="margin-top: 32px; padding: 24px; background-color: #f0fdf4; border-radius: 8px; border: 2px solid #16a34a;">
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #166534;">Love your order? Share your experience!</h3>
        <p style="margin: 0; font-size: 14px; color: #166534;">Leave us a review on Google</p>
      </div>
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="display: inline-flex; align-items: center; gap: 4px; margin-bottom: 12px;">
          <svg style="width: 20px; height: 20px; color: #16a34a;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <svg style="width: 20px; height: 20px; color: #16a34a;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <svg style="width: 20px; height: 20px; color: #16a34a;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <svg style="width: 20px; height: 20px; color: #16a34a;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <svg style="width: 20px; height: 20px; color: #16a34a;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="https://share.google/kCQYHyMGyamt5M1yj" 
           target="_blank" 
           rel="noopener noreferrer"
           style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Write a Review on Google
        </a>
      </div>
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="margin-top: 24px;">
      <a href="${baseUrl}/track-order" style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
        View order details
      </a>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Order #${orderNumber} - ${status.title} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send order status change email:", error);
    throw error;
  }
}

export async function sendPaymentConfirmationEmail(
  email: string,
  orderNumber: string,
  paymentMethod: string,
  orderDetails: any
) {
  const paymentMethodNames: Record<string, string> = {
    "CRYPTO": "Cryptocurrency",
    "ZELLE": "Zelle",
    "VENMO": "Venmo",
    "BARTERPAY": "BarterPay",
    "EDEBIT": "Bank Transfer (eDebit)",
  };
  const paymentMethodName = paymentMethodNames[paymentMethod] || paymentMethod;

  // Normalize items to have consistent property names
  const normalizedItems = orderDetails.items?.map((item: any) => ({
    productName: item.productName || item.product?.name,
    variantSize: item.variantSize || item.variant?.size,
    quantity: item.quantity,
    price: item.price,
    isBackorder: item.isBackorder,
  })) || [];

  const content = `
    <!-- Payment confirmed header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      ✓ Payment confirmed!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      We've received your payment. Your order is now being processed.
    </p>
    
    <!-- Payment details box -->
    <div style="padding: 24px; background-color: #f0fdf4; border-radius: 8px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding-bottom: 12px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Payment Method</p>
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #166534;">${paymentMethodName}</p>
          </td>
          <td style="padding-bottom: 12px; text-align: right;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534;">$${orderDetails.total.toFixed(2)}</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Status notice -->
    <div style="padding: 16px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>Status: Processing</strong> — We're preparing your order for shipment. You'll receive tracking information soon.
      </p>
    </div>
    
    ${normalizedItems.length > 0 ? `
    <!-- Order Summary -->
    <div style="margin-top: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #333333;">
        Order summary
      </h2>
      <table role="presentation" style="width: 100%;">
        ${renderOrderItems(normalizedItems)}
      </table>
      
      ${renderFinancialSummary(orderDetails)}
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="margin-top: 24px;">
      <a href="${baseUrl}/track-order" style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
        View order details
      </a>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Payment received for order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
    throw error;
  }
}

export async function sendTrackingUpdateEmail(
  email: string,
  orderNumber: string,
  trackingNumber: string,
  status: string,
  lastEvent: string,
  lastLocation: string,
  lastTime: string
) {
  const statusConfig: Record<string, { title: string; icon: string; bgColor: string; color: string }> = {
    "Delivered": { title: "Package delivered!", icon: "✅", bgColor: "#dcfce7", color: "#166534" },
    "InTransit": { title: "Package in transit", icon: "🚚", bgColor: "#dbeafe", color: "#1e40af" },
    "OutForDelivery": { title: "Out for delivery!", icon: "📬", bgColor: "#fef3c7", color: "#92400e" },
    "Exception": { title: "Delivery update", icon: "⚠️", bgColor: "#fee2e2", color: "#991b1b" },
    "PickUp": { title: "Ready for pickup", icon: "📦", bgColor: "#f3e8ff", color: "#6b21a8" },
  };

  const statusInfo = statusConfig[status] || { title: "Tracking update", icon: "📍", bgColor: "#f3f4f6", color: "#374151" };

  const content = `
    <!-- Status header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      ${statusInfo.icon} ${statusInfo.title}
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      Here's the latest update on your shipment.
    </p>
    
    <!-- Status box -->
    <div style="padding: 24px; background-color: ${statusInfo.bgColor}; border-radius: 8px; margin-bottom: 24px;">
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Latest Event</p>
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: ${statusInfo.color};">${lastEvent}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
            <p style="margin: 0; font-size: 14px; color: #333333;">${lastLocation}</p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Time</p>
            <p style="margin: 0; font-size: 14px; color: #333333;">${lastTime}</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Tracking number -->
    <div style="padding: 20px; background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">Tracking number</p>
      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #333333; font-family: monospace;">
        ${trackingNumber}
      </p>
    </div>
    
    <!-- CTA -->
    <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}" 
       style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
      Track on USPS
    </a>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `${statusInfo.icon} ${statusInfo.title} - Order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send tracking update email:", error);
  }
}

export async function sendTrackingNumberUpdateEmail(
  email: string,
  orderNumber: string,
  trackingNumber: string
) {
  const content = `
    <!-- Header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      📦 Tracking number updated
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      The tracking information for your order has been updated.
    </p>
    
    <!-- Tracking box -->
    <div style="padding: 24px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">New tracking number</p>
      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e40af; font-family: monospace;">
        ${trackingNumber}
      </p>
      <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}" 
         style="display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
        Track your shipment
      </a>
    </div>
    
    <!-- Note -->
    <div style="padding: 16px; background-color: #f8f8f8; border-radius: 8px;">
      <p style="margin: 0; font-size: 13px; color: #666666;">
        Tracking information may take up to 24 hours to appear in the carrier's system.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Tracking updated for order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send tracking number update email:", error);
    throw error;
  }
}

export async function sendOrderNotificationToSupport(
  orderNumber: string,
  orderDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    shippingInsurance?: number;
    tax?: number; // Deprecated - kept for backward compatibility
    shippingCost: number;
    total: number;
    items: Array<{
      productName: string;
      variantSize: string;
      quantity: number;
      price: number;
    }>;
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone?: string;
    };
    userId?: string;
    isGuest: boolean;
  }
) {
  const paymentMethodName = orderDetails.paymentMethod === "CRYPTO" ? "Cryptocurrency" 
    : orderDetails.paymentMethod === "ZELLE" ? "Zelle"
    : orderDetails.paymentMethod === "VENMO" ? "Venmo"
    : orderDetails.paymentMethod === "CREDIT_CARD" ? "Credit/Debit Card"
    : orderDetails.paymentMethod === "BARTERPAY" ? "BarterPay" 
    : orderDetails.paymentMethod === "STRIPE" ? "Credit/Debit Card (Legacy)"
    : orderDetails.paymentMethod;

  const paymentStatusText = orderDetails.paymentStatus === "PENDING" 
    ? `<span style="color: #f59e0b; font-weight: bold;">PENDING - Payment not yet received</span>`
    : `<span style="color: #10b981; font-weight: bold;">PAID - Payment received</span>`;

  try {
    await sendEmail({
      to: "support@purgostyle.com",
      subject: `New Order Received: #${orderNumber} - ${paymentStatusText.includes("PENDING") ? "PENDING PAYMENT" : "PAID"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #1890ff;">New Order Received</h2>
          <p>A new order has been placed on the website.</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #1890ff; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">Order Information</h3>
            <p style="font-size: 16px; margin: 8px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="font-size: 16px; margin: 8px 0;"><strong>Payment Method:</strong> ${paymentMethodName}</p>
            <p style="font-size: 16px; margin: 8px 0;"><strong>Payment Status:</strong> ${paymentStatusText}</p>
            <p style="font-size: 16px; margin: 8px 0;"><strong>Customer Type:</strong> ${orderDetails.isGuest ? "Guest" : "Registered User"}</p>
            ${orderDetails.userId ? `<p style="font-size: 16px; margin: 8px 0;"><strong>User ID:</strong> ${orderDetails.userId}</p>` : ''}
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Contact Information</h3>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${orderDetails.customerName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${orderDetails.customerEmail}">${orderDetails.customerEmail}</a></p>
            ${orderDetails.customerPhone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> <a href="tel:${orderDetails.customerPhone}">${orderDetails.customerPhone}</a></p>` : ''}
            ${orderDetails.shippingAddress.phone && orderDetails.shippingAddress.phone !== orderDetails.customerPhone ? `<p style="margin: 8px 0;"><strong>Shipping Phone:</strong> <a href="tel:${orderDetails.shippingAddress.phone}">${orderDetails.shippingAddress.phone}</a></p>` : ''}
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Items</h3>
            ${orderDetails.items.map((item) => `
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
                <strong>${item.productName}</strong> (${item.variantSize})<br>
                Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}
              </div>
            `).join('')}
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
            <div style="font-size: 16px;">
              <div>Subtotal: $${orderDetails.subtotal.toFixed(2)}</div>
              <div>Shipping Insurance: $${(orderDetails.shippingInsurance || orderDetails.tax || 3.50).toFixed(2)}</div>
              <div>Shipping: $${orderDetails.shippingCost.toFixed(2)}</div>
              <div style="font-weight: bold; font-size: 18px; margin-top: 10px;">
                Total: $${orderDetails.total.toFixed(2)}
              </div>
            </div>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Shipping Address</h3>
            <p style="margin: 4px 0;">${orderDetails.shippingAddress.name}</p>
            <p style="margin: 4px 0;">${orderDetails.shippingAddress.street}</p>
            <p style="margin: 4px 0;">${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.zipCode}</p>
            <p style="margin: 4px 0;">${orderDetails.shippingAddress.country}</p>
            ${orderDetails.shippingAddress.phone ? `<p style="margin: 4px 0;">Phone: ${orderDetails.shippingAddress.phone}</p>` : ''}
          </div>

          ${orderDetails.paymentStatus === "PENDING" ? `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #d97706;">⚠️ Action Required</h3>
            <p style="color: #92400e; font-weight: bold;">This order is pending payment. Payment link has been sent to customer via email.</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>This is an automated notification from the Purgo Style Labs website.</p>
            <p>Order details can be viewed in the admin panel.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order notification email to support:", error);
    // Don't throw - we don't want to fail order creation if email fails
  }
}

export async function sendAffiliatePayoutRequestEmail(details: {
  affiliateName: string;
  affiliateEmail: string;
  discountCode: string;
  amount: number;
  requestId: string;
}) {
  const { affiliateName, affiliateEmail, discountCode, amount, requestId } = details;
  try {
    await sendEmail({
      to: "support@purgostyle.com",
      subject: `Affiliate Payout Request: ${affiliateName} ($${amount.toFixed(2)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0e7490;">Affiliate Payout Request</h2>
          <p>An affiliate has requested a payout. Process and mark as paid in the admin dashboard.</p>
          <div style="background-color: #f0f9ff; border-left: 4px solid #0e7490; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Affiliate:</strong> ${affiliateName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${affiliateEmail}">${affiliateEmail}</a></p>
            <p style="margin: 0 0 8px 0;"><strong>Discount code:</strong> ${discountCode}</p>
            <p style="margin: 0; font-size: 18px;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Request ID: ${requestId}. Open the admin panel → Affiliates → Payout requests to mark as paid.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send affiliate payout request email:", error);
    throw error;
  }
}

export async function sendDiscountCodeRequestNotification(email: string) {

  try {
    await sendEmail({
      to: supportEmail,
      subject: `🎟️ New Discount Code Request - ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 40px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #0e7490; font-size: 24px; margin-top: 0;">New Discount Code Request</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              A customer has requested a 10% discount code from the homepage popup.
            </p>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0e7490; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                <strong>Customer Email:</strong><br>
                <a href="mailto:${email}" style="color: #0e7490; text-decoration: none; font-size: 18px;">${email}</a>
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              The discount code has been automatically generated and sent to the customer via email.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from the Purgo Style Labs website.</p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send discount code request notification to support:", error);
    // Don't throw - we don't want to fail the signup if this email fails
  }
}

export async function sendAccountCreationNotification(
  email: string,
  name: string,
  phone?: string
) {

  try {
    await sendEmail({
      to: supportEmail,
      subject: `👤 New Account Created - ${email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 40px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #0e7490; font-size: 24px; margin-top: 0;">New Account Created</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              A new user account has been created on the website.
            </p>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0e7490; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 8px 0; color: #374151; font-size: 16px;">
                <strong>Name:</strong><br>
                ${name}
              </p>
              <p style="margin: 8px 0; color: #374151; font-size: 16px;">
                <strong>Email:</strong><br>
                <a href="mailto:${email}" style="color: #0e7490; text-decoration: none;">${email}</a>
              </p>
              ${phone ? `
              <p style="margin: 8px 0; color: #374151; font-size: 16px;">
                <strong>Phone:</strong><br>
                <a href="tel:${phone}" style="color: #0e7490; text-decoration: none;">${phone}</a>
              </p>
              ` : ''}
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              The account has been successfully created and the user can now sign in.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from the Purgo Style Labs website.</p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send account creation notification to support:", error);
    // Don't throw - we don't want to fail account creation if this email fails
  }
}

export async function sendDiscountCodeRetargetingEmail(email: string, discountCode: string) {
  try {
    await sendEmail({
      to: email,
      subject: "Don't forget your 10% discount code! 🎁",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 40px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0e7490; font-size: 32px; margin: 0;">Your Discount Code Awaits! 🎉</h1>
            </div>
              
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hi there!<br><br>
              We noticed you requested a discount code but haven't used it yet. Your 10% off code is still waiting for you!
            </p>

            <div style="background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: white; font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">YOUR DISCOUNT CODE</p>
              <div style="background-color: white; border-radius: 6px; padding: 20px; margin: 15px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #0e7490; margin: 0; letter-spacing: 2px;">
                  ${discountCode}
                </p>
              </div>
              <p style="color: white; font-size: 16px; margin: 10px 0 0 0;">
                Get 10% off your first order
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://www.purgostyle.com/products" 
                 style="display: inline-block; background-color: #0e7490; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Shop Now
              </a>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0e7490; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">
                <strong>How to use:</strong><br>
                1. Add products to your cart<br>
                2. Go to checkout<br>
                3. Enter the code above in the discount field<br>
                4. Enjoy 10% off your order! 🎁
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              Questions? Reply to this email or visit our <a href="https://www.purgostyle.com/contact" style="color: #0e7490; text-decoration: none;">contact page</a>.
            </p>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
              Purgo Style Labs<br>
              <a href="https://www.purgostyle.com/unsubscribe?email=${encodeURIComponent(email)}" 
                 style="color: #0e7490; text-decoration: underline;">
                Manage your email preferences</a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send discount code retargeting email:", error);
    throw error;
  }
}

export async function sendZellePaymentInstructions(
  email: string,
  orderNumber: string,
  total: number,
  orderDetails: {
    items: Array<{
      productName: string;
      variantSize: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    shippingInsurance: number;
    shippingCost: number;
  }
) {
  const content = `
    <!-- Header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      Complete your payment
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      Thank you for your order! Please complete your Zelle payment to proceed.
    </p>
    
    <!-- Action required notice -->
    <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏱️ Action required:</strong> Please complete payment within 24 hours to avoid order cancellation.
      </p>
    </div>
    
    <!-- Payment amount box -->
    <div style="padding: 32px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1e40af;">$${total.toFixed(2)}</p>
    </div>
    
    <!-- Payment instructions -->
    <div style="padding: 24px; background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #333333;">
        Payment Instructions
      </h2>
      
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Send to</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a73e8; font-family: monospace;">orders@purgostyle.com</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Memo (Required)</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #92400e;">purgo style labs</p>
            <p style="margin: 0; font-size: 12px; color: #92400e;">⚠️ Do not mention product names in the memo.</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Order Summary -->
    <div style="margin-top: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #333333;">
        Order summary
      </h2>
      <table role="presentation" style="width: 100%;">
        ${renderOrderItems(orderDetails.items)}
      </table>
      
      ${renderFinancialSummary({ ...orderDetails, total, shipping: orderDetails.shippingCost })}
    </div>
    
    <!-- What's next -->
    <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>What's next?</strong> Once we confirm your payment, we'll process your order and send you tracking information.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Complete your payment - Order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send Zelle payment instructions email:", error);
    throw error;
  }
}

export async function sendVenmoPaymentInstructions(
  email: string,
  orderNumber: string,
  total: number,
  orderDetails: {
    items: Array<{
      productName: string;
      variantSize: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    shippingInsurance: number;
    shippingCost: number;
  }
) {
  const venmoLink = `https://venmo.com/purgolabs?txn=pay&amount=${total.toFixed(2)}&note=Online+Goods`;
  const qrCodeUrl = `${baseUrl}/zelle_qr.png`;

  const content = `
    <!-- Header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      Complete your payment
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      Thank you for your order! Please complete your Venmo payment to proceed.
    </p>
    
    <!-- Action required notice -->
    <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏱️ Action required:</strong> Please complete payment within 24 hours to avoid order cancellation.
      </p>
    </div>
    
    <!-- Payment amount box -->
    <div style="padding: 32px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #008CFF;">$${total.toFixed(2)}</p>
    </div>
    
    <!-- Payment instructions -->
    <div style="padding: 24px; background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #333333;">
        Payment Instructions
      </h2>
      
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding-bottom: 16px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #666666;">Scan QR Code to Pay</p>
            <img src="${qrCodeUrl}" alt="Venmo QR Code" style="max-width: 200px; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 16px;">
            <br>
            <a href="${venmoLink}" style="display: inline-block; padding: 12px 24px; background-color: #008CFF; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Pay with Venmo
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 16px; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Venmo Profile</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #008CFF; font-family: monospace;">@purgolabs</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Note</p>
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #333333;">Online Goods</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Order Summary -->
    <div style="margin-top: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #333333;">
        Order summary
      </h2>
      <table role="presentation" style="width: 100%;">
        ${renderOrderItems(orderDetails.items)}
      </table>
      
      ${renderFinancialSummary({ ...orderDetails, total, shipping: orderDetails.shippingCost })}
    </div>
    
    <!-- What's next -->
    <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>What's next?</strong> Once we confirm your payment, we'll process your order and send you tracking information.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Complete your payment - Order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send Venmo payment instructions email:", error);
    throw error;
  }
}

export async function sendCreditCardPaymentInstructions(
  email: string,
  orderNumber: string,
  total: number,
  orderDetails: {
    items: Array<{
      productName: string;
      variantSize: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    shippingInsurance: number;
    shippingCost: number;
  }
) {
  const paymentLink = "https://square.link/u/uRYagWpU";

  const content = `
    <!-- Header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      Complete your payment
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      Thank you for your order! Please complete your Credit/Debit Card payment to proceed.
    </p>
    
    <!-- Action required notice -->
    <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏱️ Action required:</strong> Please complete payment within 24 hours to avoid order cancellation.
      </p>
    </div>
    
    <!-- Payment amount box -->
    <div style="padding: 32px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1e40af;">$${total.toFixed(2)}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #ef4444; font-weight: 600;">
        ⚠️ IMPORTANT: You must enter this EXACT amount.
      </p>
    </div>
    
    <!-- Payment instructions -->
    <div style="padding: 24px; background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #333333;">
        Payment Instructions
      </h2>
      
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #333333; line-height: 1.6;">
        1. Click the button below to open the secure payment page.<br>
        2. Enter the <strong>exact order total ($${total.toFixed(2)})</strong>.<br>
        3. Complete the payment with your Credit or Debit card.
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${paymentLink}" style="display: inline-block; padding: 16px 32px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
          Make Payment Now
        </a>
      </div>

      <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
        Or copy and paste this link: <br>
        <a href="${paymentLink}" style="color: #1a73e8;">${paymentLink}</a>
      </p>
    </div>
    
    <!-- Order Summary -->
    <div style="margin-top: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #333333;">
        Order summary
      </h2>
      <table role="presentation" style="width: 100%;">
        ${renderOrderItems(orderDetails.items)}
      </table>
      
      ${renderFinancialSummary({ ...orderDetails, total, shipping: orderDetails.shippingCost })}
    </div>
    
    <!-- What's next -->
    <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>What's next?</strong> Once we confirm your payment, we'll process your order and send you tracking information.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Complete your payment - Order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send Credit Card payment instructions email:", error);
    throw error;
  }
}

export async function sendCryptoPaymentInstructions(
  email: string,
  orderNumber: string,
  total: number,
  cryptoAddress: string,
  cryptoAmount: number,
  cryptoCurrency: string,
  orderDetails: {
    items: Array<{
      productName: string;
      variantSize: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    shippingInsurance: number;
    shippingCost: number;
  }
) {
  const content = `
    <!-- Header -->
    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #333333;">
      Complete your crypto payment
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 1.5;">
      Thank you for your order! Please send your cryptocurrency payment to proceed.
    </p>
    
    <!-- Action required notice -->
    <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏱️ Action required:</strong> Please complete payment within 24 hours to avoid order cancellation.
      </p>
    </div>
    
    <!-- Payment amount box -->
    <div style="padding: 32px; background-color: #f3e8ff; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Send Exactly</p>
      <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #6b21a8;">
        ${cryptoAmount.toFixed(8)} ${cryptoCurrency.toUpperCase()}
      </p>
      <p style="margin: 0; font-size: 14px; color: #666666;">≈ $${total.toFixed(2)} USD</p>
    </div>
    
    <!-- Wallet address -->
    <div style="padding: 24px; background-color: #f8f8f8; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Wallet Address</p>
      <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 500; color: #333333; font-family: monospace; word-break: break-all; background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e5e5e5;">
        ${cryptoAddress}
      </p>
      <p style="margin: 0; font-size: 12px; color: #991b1b;">
        ⚠️ Double-check the address before sending. Crypto transactions cannot be reversed.
      </p>
    </div>
    
    <!-- Important notice -->
    <div style="padding: 16px; background-color: #dbeafe; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>Important:</strong> Send the exact amount shown. Different amounts may delay payment confirmation.
      </p>
    </div>
    
    <!-- Order Summary -->
    <div style="margin-top: 24px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #333333;">
        Order summary
      </h2>
      <table role="presentation" style="width: 100%;">
        ${renderOrderItems(orderDetails.items)}
      </table>
      
      ${renderFinancialSummary({ ...orderDetails, total, shipping: orderDetails.shippingCost })}
    </div>
    
    <!-- What's next -->
    <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>What's next?</strong> Once your payment is confirmed on the blockchain, we'll automatically process your order and send you tracking information.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `Complete your payment - Order #${orderNumber} - Purgo Style Labs`,
      html: getEmailWrapper(content, `#${orderNumber}`),
    });
  } catch (error) {
    console.error("Failed to send crypto payment instructions email:", error);
    throw error;
  }
}

export async function sendPaymentReminderEmail(
  email: string,
  orderNumber: string,
  total: number,
  paymentMethod: "CREDIT_CARD",
  paymentDetails?: Record<string, never>
) {
  const paymentLink = "https://square.link/u/uRYagWpU";

  const paymentInstructions = `
    <div style="padding: 32px; background-color: #dbeafe; border-radius: 8px; margin: 15px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
      <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1e40af;">$${total.toFixed(2)}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #ef4444; font-weight: 600;">
        ⚠️ IMPORTANT: You must enter this EXACT amount.
      </p>
    </div>

    <div style="padding: 24px; background-color: #f8f8f8; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #333333; line-height: 1.6;">
        1. Click the button below to open the secure payment page.<br>
        2. Enter the <strong>exact order total ($${total.toFixed(2)})</strong>.<br>
        3. Complete the payment with your Credit or Debit card.
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${paymentLink}" style="display: inline-block; padding: 16px 32px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
          Make Payment Now
        </a>
      </div>

      <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
        Or copy and paste this link: <br>
        <a href="${paymentLink}" style="color: #1a73e8;">${paymentLink}</a>
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `⏰ Reminder: Complete Your Payment - Order #${orderNumber} - Purgo Style Labs`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Payment Reminder</h2>
          <p>This is a friendly reminder that your order <strong>#${orderNumber}</strong> is still awaiting payment.</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #d97706;">⏰ Time Sensitive</h3>
            <p style="color: #92400e; font-weight: bold; font-size: 16px; margin: 10px 0;">
              Your order will be automatically cancelled if payment is not received within the next 12 hours.
            </p>
            <p style="color: #92400e; margin-top: 10px;">
              Please complete your payment now to ensure your order is processed.
            </p>
          </div>

          <div style="background-color: #f0f9ff; border-left: 4px solid #1890ff; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">Payment Instructions</h3>
            
            <div style="text-align: center; padding: 20px; background-color: white; border-radius: 8px; margin: 15px 0;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Amount to send</p>
              <p style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 10px 0;">
                $${total.toFixed(2)}
              </p>
            </div>

            ${paymentInstructions}
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">Need Help?</h3>
            <p style="color: #1e40af; line-height: 1.6;">
              If you've already sent your payment, please allow a few minutes for it to process. 
              If you're experiencing any issues, please contact our support team immediately.
            </p>
            <p style="color: #1e40af; margin-top: 10px;">
              <strong>Support:</strong> <a href="mailto:support@purgostyle.com" style="color: #1890ff;">support@purgostyle.com</a>
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Purgo Style Labs</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send payment reminder email:", error);
    throw error;
  }
}

// Send affiliate program invitation email (Shopify-style)
export async function sendAffiliateInviteEmail(email: string, inviteUrl: string) {
  // Inline SVG icons for email (since React Icons don't work in emails)
  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  
  const content = `
    <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: #333333;">
      You're Invited!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #666666; line-height: 1.6;">
      We'd like to invite you to join the Purgo Style Labs Affiliate Program. Earn commissions on every sale you refer!
    </p>
    
    <!-- Highlight Box -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px;">
        Earn Up To
      </p>
      <p style="margin: 0; font-size: 48px; font-weight: 700; color: #ffffff;">
        15%
      </p>
      <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
        Commission on Every Sale
      </p>
    </div>
    
    <!-- Benefits -->
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333333;">
        What You'll Get:
      </h3>
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
            ${checkIcon} 15% commission on all referred sales
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
            ${checkIcon} Your own unique discount code to share
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
            ${checkIcon} QR code for easy sharing at events
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
            ${checkIcon} Real-time performance dashboard
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #4b5563;">
            ${checkIcon} 30-day cookie tracking for all referrals
          </td>
        </tr>
      </table>
    </div>
    
    <!-- CTA Button -->
    <table role="presentation" style="margin: 32px 0;">
      <tr>
        <td>
          <a href="${inviteUrl}" 
             style="display: inline-block; padding: 16px 32px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
            Accept Invitation
          </a>
        </td>
        <td style="padding-left: 16px;">
          <span style="color: #666666;">or</span>
          <a href="${baseUrl}" style="color: #1a73e8; text-decoration: none; margin-left: 8px; font-size: 14px;">
            Visit our store
          </a>
        </td>
      </tr>
    </table>
    
    <!-- How it Works -->
    <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333333;">
        How It Works:
      </h3>
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding: 12px 0; vertical-align: top; width: 40px;">
            <div style="width: 28px; height: 28px; background-color: #1a73e8; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600;">1</div>
          </td>
          <td style="padding: 12px 0 12px 12px; vertical-align: top;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #333333;">Accept this invitation</p>
            <p style="margin: 0; font-size: 13px; color: #666666;">Create an account or sign in to get started</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top; width: 40px;">
            <div style="width: 28px; height: 28px; background-color: #1a73e8; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600;">2</div>
          </td>
          <td style="padding: 12px 0 12px 12px; vertical-align: top;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #333333;">Share your code or QR</p>
            <p style="margin: 0; font-size: 13px; color: #666666;">Use your unique affiliate link, code, or QR to refer customers</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top; width: 40px;">
            <div style="width: 28px; height: 28px; background-color: #1a73e8; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; font-weight: 600;">3</div>
          </td>
          <td style="padding: 12px 0 12px 12px; vertical-align: top;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #333333;">Earn commissions</p>
            <p style="margin: 0; font-size: 13px; color: #666666;">Track your earnings in real-time on your dashboard</p>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #999999;">
      This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
    </p>
  `;

  try {
    await sendEmail({
      to: email,
      subject: "You're Invited to Join the Purgo Style Labs Affiliate Program",
      html: getEmailWrapper(content),
    });
  } catch (error) {
    console.error("Failed to send affiliate invite email:", error);
    throw error;
  }
}
