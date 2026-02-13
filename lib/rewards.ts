// Rewards points system utilities
import { prisma } from './prisma';
import { 
  calculatePointsEarned, 
  calculatePointsValue, 
  calculateMaxRedeemablePoints,
  validatePointsRedemption,
  formatPoints,
  formatPointsValue
} from './rewards-client';

export interface PointsTransaction {
  userId: string;
  orderId?: string;
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED';
  description: string;
}

export interface PointsRedemption {
  userId: string;
  pointsToRedeem: number;
  orderSubtotal: number;
}

export interface PointsCalculation {
  availablePoints: number;
  pointsValue: number;
  maxRedeemable: number;
  pointsEarned: number;
}

// Re-export client utilities for server-side use
export { 
  calculatePointsEarned, 
  calculatePointsValue, 
  calculateMaxRedeemablePoints,
  validatePointsRedemption,
  formatPoints,
  formatPointsValue
};

// Get user's current points balance
export async function getUserPoints(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rewardsPoints: true }
    });
    return user?.rewardsPoints || 0;
  } catch (error) {
    console.error('Error fetching user points:', error);
    return 0;
  }
}

// Add points to user account
export async function addPointsToUser(
  userId: string,
  points: number,
  orderId?: string,
  description?: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Update user's points balance
      await tx.user.update({
        where: { id: userId },
        data: {
          rewardsPoints: {
            increment: points
          }
        }
      });

      // Create points history record
      await tx.pointsHistory.create({
        data: {
          userId,
          orderId,
          points,
          type: 'EARNED',
          description: description || `Earned ${points} points from order`
        }
      });
    });

    return true;
  } catch (error) {
    console.error('Error adding points to user:', error);
    return false;
  }
}

// Redeem points from user account
export async function redeemPointsFromUser(
  userId: string,
  points: number,
  orderId?: string,
  description?: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Check if user has enough points
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { rewardsPoints: true }
      });

      if (!user || user.rewardsPoints < points) {
        throw new Error('Insufficient points');
      }

      // Update user's points balance
      await tx.user.update({
        where: { id: userId },
        data: {
          rewardsPoints: {
            decrement: points
          }
        }
      });

      // Create points history record
      await tx.pointsHistory.create({
        data: {
          userId,
          orderId,
          points: -points, // Negative for redemption
          type: 'REDEEMED',
          description: description || `Redeemed ${points} points`
        }
      });
    });

    return true;
  } catch (error) {
    console.error('Error redeeming points from user:', error);
    return false;
  }
}

// Get user's points history
export async function getUserPointsHistory(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const history = await prisma.pointsHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true
          }
        }
      }
    });

    return history;
  } catch (error) {
    console.error('Error fetching points history:', error);
    return [];
  }
}

// Calculate comprehensive points information for user
export async function calculateUserPointsInfo(
  userId: string,
  orderSubtotal: number
): Promise<PointsCalculation> {
  try {
    const availablePoints = await getUserPoints(userId);
    const pointsValue = calculatePointsValue(availablePoints);
    const maxRedeemable = calculateMaxRedeemablePoints(availablePoints, orderSubtotal);
    const pointsEarned = calculatePointsEarned(orderSubtotal);

    return {
      availablePoints,
      pointsValue,
      maxRedeemable,
      pointsEarned
    };
  } catch (error) {
    console.error('Error calculating points info:', error);
    return {
      availablePoints: 0,
      pointsValue: 0,
      maxRedeemable: 0,
      pointsEarned: 0
    };
  }
}

