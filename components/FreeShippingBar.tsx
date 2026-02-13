"use client";

import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';

interface FreeShippingBarProps {
  subtotal: number;
  className?: string;
}

export default function FreeShippingBar({ subtotal, className = "" }: FreeShippingBarProps) {
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercentage = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const isFreeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (isFreeShippingEligible) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Free shipping unlocked!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900">
          Add ${remainingForFreeShipping.toFixed(2)} or more for free shipping
        </p>
        <p className="text-xs text-gray-600">
          Spend ${FREE_SHIPPING_THRESHOLD} total to unlock free shipping on your entire order
        </p>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Progress Indicators */}
        <div className="flex justify-between mt-1">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-600">${FREE_SHIPPING_THRESHOLD}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
