import { NextResponse } from "next/server";
import { calculateShipping, validateShippingAddress } from "@/lib/shipping";

// Calculate shipping costs based on address
export async function POST(req: Request) {
  try {
    const { address, subtotal } = await req.json();

    if (!address || subtotal === undefined) {
      return NextResponse.json(
        { error: "Address and subtotal required" },
        { status: 400 }
      );
    }

    // Validate address
    if (!validateShippingAddress(address)) {
      return NextResponse.json(
        { error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Calculate shipping
    const shippingCalculation = calculateShipping(address, subtotal);

    return NextResponse.json({
      success: true,
      ...shippingCalculation
    });

  } catch (error) {
    console.error("Error calculating shipping:", error);
    return NextResponse.json(
      { error: "Failed to calculate shipping" },
      { status: 500 }
    );
  }
}
