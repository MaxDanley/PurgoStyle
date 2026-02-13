import { NextResponse } from "next/server";
import { getEstimatedPrice } from "@/lib/nowpayments";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const amount = parseFloat(searchParams.get("amount") || "0");
    const currencyFrom = searchParams.get("currency_from") || "usd";
    const currencyTo = searchParams.get("currency_to") || "";

    if (!currencyTo) {
      return NextResponse.json(
        { error: "Something went wrong. Please try again shortly or contact support" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Something went wrong. Please try again shortly or contact support" },
        { status: 400 }
      );
    }

    const estimatedAmount = await getEstimatedPrice(amount, currencyFrom, currencyTo);

    return NextResponse.json({
      success: true,
      estimatedAmount,
    });
  } catch (error: any) {
    console.error("Failed to get estimated price:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again shortly or contact support" },
      { status: 500 }
    );
  }
}

