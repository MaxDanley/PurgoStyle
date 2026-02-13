import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPoints, calculateUserPointsInfo } from "@/lib/rewards";

// Get user's current points balance
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const points = await getUserPoints(session.user.id);
    
    return NextResponse.json({
      points,
      pointsValue: points / 100, // 100 points = $1
    });

  } catch (error) {
    console.error("Error fetching user points:", error);
    return NextResponse.json(
      { error: "Failed to fetch points" },
      { status: 500 }
    );
  }
}
