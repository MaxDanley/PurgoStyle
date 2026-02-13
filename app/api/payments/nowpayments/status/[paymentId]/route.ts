import { NextResponse } from "next/server";
import { getNOWPaymentsPaymentStatus } from "@/lib/nowpayments";

export async function GET(
  req: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await context.params;
    const paymentIdNum = parseInt(paymentId, 10);

    if (isNaN(paymentIdNum)) {
      return NextResponse.json(
        { error: "Something went wrong. Please try again shortly or contact support" },
        { status: 400 }
      );
    }

    const status = await getNOWPaymentsPaymentStatus(paymentIdNum);

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: status.payment_id,
        paymentStatus: status.payment_status,
        payAddress: status.pay_address,
        actuallyPaid: status.actually_paid,
        payAmount: status.pay_amount,
        payCurrency: status.pay_currency,
        priceAmount: status.price_amount,
        priceCurrency: status.price_currency,
        outcomeAmount: status.outcome_amount,
        outcomeCurrency: status.outcome_currency,
        orderId: status.order_id,
        createdAt: status.created_at,
        updatedAt: status.updated_at,
      },
    });
  } catch (error: any) {
    console.error("NOWPayments status check error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again shortly or contact support" },
      { status: 500 }
    );
  }
}

