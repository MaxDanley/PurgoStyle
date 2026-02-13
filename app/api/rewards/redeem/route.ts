import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redeemPointsFromUser, validatePointsRedemption, calculateMaxRedeemablePoints } from "@/lib/rewards";

// Redeem points for order discount
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { points, orderSubtotal } = await req.json();

    if (!points || !orderSubtotal) {
      return NextResponse.json(
        { error: "Points and order subtotal required" },
        { status: 400 }
      );
    }

    // Validate redemption
    const userPoints = await getUserPoints(session.user.id);
    const validation = validatePointsRedemption(points, userPoints, orderSubtotal);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Redeem points
    const success = await redeemPointsFromUser(
      session.user.id,
      points,
      undefined, // No order ID yet
      `Redeemed ${points} points for order discount`
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to redeem points" },
        { status: 500 }
      );
    }

    // Get updated balance
    const newBalance = await getUserPoints(session.user.id);
    const discountValue = points / 100; // 100 points = $1

    return NextResponse.json({
      success: true,
      pointsRedeemed: points,
      discountValue,
      newBalance,
    });

  } catch (error) {
    console.error("Error redeeming points:", error);
    return NextResponse.json(
      { error: "Failed to redeem points" },
      { status: 500 }
    );
  }
}

// Import getUserPoints function
async function getUserPoints(userId: string): Promise<number> {
  const { getUserPoints } = await import("@/lib/rewards");
  return getUserPoints(userId);
}
