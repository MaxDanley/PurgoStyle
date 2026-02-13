import { NextResponse } from "next/server";
import { getAvailableCurrencies } from "@/lib/nowpayments";

export async function GET() {
  try {
    const currencies = await getAvailableCurrencies();
    return NextResponse.json({
      success: true,
      currencies,
    });
  } catch (error: any) {
    console.error("Failed to fetch currencies:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch currencies" },
      { status: 500 }
    );
  }
}

