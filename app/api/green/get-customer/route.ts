import { NextResponse } from "next/server";
import { getCustomerInformation } from "@/lib/green";

/**
 * Get customer information from Green system
 * POST /api/green/get-customer
 */
export async function POST(req: Request) {
  try {
    const { payorId } = await req.json();

    if (!payorId) {
      return NextResponse.json(
        { error: "Payor_ID is required" },
        { status: 400 }
      );
    }

    const customerInfo = await getCustomerInformation(payorId);

    return NextResponse.json({
      success: true,
      customer: customerInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Sorry, something went wrong. please contact support or try again later" },
      { status: 500 }
    );
  }
}

