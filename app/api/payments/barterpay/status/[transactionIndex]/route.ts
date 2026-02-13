import { NextResponse } from "next/server";
import { getBarterPayTransactionStatus } from "@/lib/barterpay";

/**
 * Get BarterPay transaction status by transaction index
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ transactionIndex: string }> }
) {
  try {
    const { transactionIndex } = await context.params;

    if (!transactionIndex) {
      return NextResponse.json(
        { error: "Something went wrong. Please try again shortly or contact support" },
        { status: 400 }
      );
    }

    const transaction = await getBarterPayTransactionStatus(transactionIndex);

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error("❌ Failed to get BarterPay transaction status:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again shortly or contact support" },
      { status: 500 }
    );
  }
}

