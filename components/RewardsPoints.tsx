"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { calculatePointsEarned, calculatePointsValue, calculateMaxRedeemablePoints } from '@/lib/rewards-client';

interface RewardsPointsProps {
  subtotal: number;
  onPointsRedeemed?: (points: number, value: number) => void;
  className?: string;
}

export default function RewardsPoints({ subtotal, onPointsRedeemed, className = "" }: RewardsPointsProps) {
  const { data: session } = useSession();
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pointsEarned = calculatePointsEarned(subtotal);
  const pointsValue = calculatePointsValue(userPoints);
  const maxRedeemable = calculateMaxRedeemablePoints(userPoints, subtotal);
  const redemptionValue = calculatePointsValue(pointsToRedeem);

  // Fetch user points if logged in
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPoints();
    }
  }, [session]);

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('/api/user/points');
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const handleRedeemPoints = async () => {
    if (!session?.user?.id) {
      setError('Please log in to redeem points');
      return;
    }

    if (pointsToRedeem <= 0) {
      setError('Please enter a valid number of points');
      return;
    }

    if (pointsToRedeem > maxRedeemable) {
      setError(`Maximum redeemable points: ${maxRedeemable}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: pointsToRedeem,
          orderSubtotal: subtotal
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.newBalance);
        onPointsRedeemed?.(pointsToRedeem, redemptionValue);
        setPointsToRedeem(0);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to redeem points');
      }
    } catch {
      setError('Failed to redeem points');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest user - show login prompt
  if (!session) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-800">
              Earn {pointsEarned} rewards points with this order
            </p>
            <p className="text-xs text-purple-700">
              Sign in to start earning points
            </p>
          </div>
          <div className="flex space-x-2">
            <Link 
              href="/auth/signin" 
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in user - show points system
  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-800">
            Rewards Points
          </p>
          <p className="text-xs text-gray-600">
            {userPoints.toLocaleString()} pts • Worth ${pointsValue.toFixed(2)} • Earn +{pointsEarned} pts
          </p>
        </div>
        
        {/* Points Redemption */}
        {userPoints > 0 && maxRedeemable > 0 && (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max={maxRedeemable}
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(Math.min(parseInt(e.target.value) || 0, maxRedeemable))}
              className="w-16 text-xs border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
            <button
              onClick={handleRedeemPoints}
              disabled={isLoading || pointsToRedeem <= 0}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '...' : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {pointsToRedeem > 0 && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 rounded px-2 py-1">
          Redeeming {pointsToRedeem} points = ${redemptionValue.toFixed(2)} discount
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-100 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
