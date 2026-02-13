"use client";

import { useState, useEffect } from "react";

interface TrackingEvent {
  status: string;
  location: string;
  date: string;
  time: string;
  timestamp: string;
}

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  summary: string;
  location: string;
  lastUpdate: string;
  events: TrackingEvent[];
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

interface TrackingComponentProps {
  orderId: string;
  trackingNumber?: string;
}

export default function TrackingComponent({ orderId, trackingNumber }: TrackingComponentProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingInfo = async () => {
    if (!trackingNumber) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tracking?trackingNumber=${trackingNumber}&orderId=${orderId}`);
      const data = await response.json();

      if (response.ok) {
        setTrackingInfo(data);
      } else {
        setError(data.error || "Failed to load tracking information");
      }
    } catch {
      setError("Failed to load tracking information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackingNumber) {
      fetchTrackingInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNumber, orderId]);

  if (!trackingNumber) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Tracking Information</h3>
        <p className="text-gray-600">No tracking number available yet.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Tracking Information</h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading tracking information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">Tracking Information</h3>
        <p className="text-red-600 mb-3">{error}</p>
        <button
          onClick={fetchTrackingInfo}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!trackingInfo) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Tracking Information</h3>
        <p className="text-gray-600">Unable to load tracking information.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in transit":
      case "out for delivery":
        return "bg-blue-100 text-blue-800";
      case "exception":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tracking Information</h3>
        <button
          onClick={fetchTrackingInfo}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {/* Tracking Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tracking Number
          </label>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-100 px-3 py-2 rounded font-mono text-sm">
              {trackingInfo.trackingNumber}
            </code>
            <a
              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingInfo.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Track on USPS
            </a>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Status
          </label>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(trackingInfo.status)}`}>
            {trackingInfo.status}
          </span>
        </div>

        {/* Summary */}
        {trackingInfo.summary && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latest Update
            </label>
            <p className="text-gray-900">{trackingInfo.summary}</p>
          </div>
        )}

        {/* Location */}
        {trackingInfo.location && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <p className="text-gray-900">{trackingInfo.location}</p>
          </div>
        )}

        {/* Last Update */}
        {trackingInfo.lastUpdate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Update
            </label>
            <p className="text-gray-900">{new Date(trackingInfo.lastUpdate).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Tracking Events Timeline */}
      {trackingInfo.events && trackingInfo.events.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Tracking History</h4>
          <div className="space-y-3">
            {trackingInfo.events.map((event, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  {index < trackingInfo.events.length - 1 && (
                    <div className="w-px h-8 bg-gray-300 ml-1.5 mt-1"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.status}</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                  <p className="text-xs text-gray-500">
                    {event.date} {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Delivery */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Estimated Delivery</h4>
        <p className="text-blue-800 text-sm">
          Packages typically arrive within 3-5 business days after shipping.
          You'll receive email updates as your package moves through the delivery process.
        </p>
      </div>
    </div>
  );
}
