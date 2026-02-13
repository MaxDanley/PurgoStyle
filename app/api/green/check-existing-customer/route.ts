import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerInformation } from "@/lib/green";

/**
 * Check if user has an existing Green customer account
 * SECURITY: Only returns bank account info for authenticated users (userId required)
 * Guest users will always create a new customer to prevent impersonation
 * POST /api/green/check-existing-customer
 */
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    // SECURITY: Only allow authenticated users to see their bank account info
    // Guest users cannot access another person's bank info by using their email
    if (!userId) {
      return NextResponse.json({
        success: true,
        hasExistingCustomer: false,
        requiresAuth: true, // Indicate that authentication is required
      });
    }

    // Find previous Green eDebit orders for this authenticated user
    // According to Green API docs: "if your system already securely authenticates this customer 
    // and you securely store the Payor_ID in your system"
    const previousOrder = await prisma.order.findFirst({
      where: {
        userId, // Only check for authenticated users
        paymentMethod: "EDEBIT",
        greenPayorId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        greenPayorId: true,
      },
    });

    if (!previousOrder?.greenPayorId) {
      return NextResponse.json({
        success: true,
        hasExistingCustomer: false,
      });
    }

    // Fetch customer info from Green to check if bank account is registered
    try {
      // Validate greenPayorId before using it
      const payorId = previousOrder.greenPayorId;
      if (!payorId || typeof payorId !== 'string' || payorId.trim() === '' || payorId === 'string') {
        return NextResponse.json({
          success: true,
          hasExistingCustomer: false,
        });
      }

      const customerInfo = await getCustomerInformation(payorId);
      
      return NextResponse.json({
        success: true,
        hasExistingCustomer: true,
        payorId: payorId, // Use validated payorId
        customer: customerInfo,
        hasBankAccount: !!(customerInfo.RoutingNumber && customerInfo.AccountNumber),
      });
    } catch (error: any) {
      // If we can't fetch customer info, they might not exist anymore
      return NextResponse.json({
        success: true,
        hasExistingCustomer: false,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Sorry, something went wrong. please contact support or try again later" },
      { status: 500 }
    );
  }
}

