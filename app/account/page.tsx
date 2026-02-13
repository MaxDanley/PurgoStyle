"use client";

export const dynamic = "force-dynamic";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import TrackingComponent from "@/components/TrackingComponent";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, { status: string; loading: boolean }>>({});
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  
  // Order filtering state
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  
  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfilePhone, setSavingProfilePhone] = useState(false);
  const [hasProfilePhone, setHasProfilePhone] = useState(false);
  const [editingProfilePhone, setEditingProfilePhone] = useState(false);

  // Fetch user points
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchOrders();
      loadAddresses();
      fetchUserPoints();
      const phone = (((session.user as any)?.phone as string) || "").toString();
      setProfilePhone(phone);
      setHasProfilePhone(!!phone);
      setEditingProfilePhone(false);
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
      toast.error("Failed to load addresses");
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const url = editingAddress ? `/api/addresses/${editingAddress.id}` : "/api/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingAddress ? "Address updated successfully" : "Address added successfully");
        resetForm();
        loadAddresses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || "",
    });
  };

  const handleDeleteAddress = (address: Address) => {
    setDeletingAddress(address);
    setShowDeleteModal(true);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddress) return;

    try {
      const response = await fetch(`/api/addresses/${deletingAddress.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Address deleted successfully");
        loadAddresses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    } finally {
      setShowDeleteModal(false);
      setDeletingAddress(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      phone: "",
    });
    setEditingAddress(null);
    setShowAddForm(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Helper functions for order filtering
  const getActiveOrders = () => {
    return orders.filter(order => 
      order.status === 'PENDING' || 
      order.status === 'PROCESSING' || 
      order.status === 'SHIPPED'
    );
  };

  const getCompletedOrders = () => {
    return orders.filter(order => 
      order.status === 'DELIVERED' || 
      order.status === 'CANCELLED'
    );
  };

  const getDisplayedOrders = () => {
    const activeOrders = getActiveOrders();
    const completedOrders = getCompletedOrders();
    
    if (showCompletedOrders) {
      return completedOrders;
    }
    
    if (showAllOrders) {
      return activeOrders;
    }
    
    // Show only first 3 active orders by default
    return activeOrders.slice(0, 3);
  };

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your orders and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-primary-600">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{session.user?.name}</h2>
                <p className="text-sm text-gray-600">{session.user?.email}</p>
                <div className="mt-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Phone: </span>
                      <span>
                        {hasProfilePhone && profilePhone
                          ? profilePhone
                          : "Not added"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProfilePhone((prev) => !prev)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {hasProfilePhone ? "Edit" : "Add"}
                    </button>
                  </div>
                  {editingProfilePhone && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!profilePhone.trim()) return;
                        setSavingProfilePhone(true);
                        try {
                          const res = await fetch("/api/user/profile", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone: profilePhone }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            toast.error(data.error || "Failed to update phone");
                          } else {
                            toast.success("Phone number updated");
                            setHasProfilePhone(true);
                            setEditingProfilePhone(false);
                          }
                        } catch {
                          toast.error("Failed to update phone");
                        } finally {
                          setSavingProfilePhone(false);
                        }
                      }}
                      className="mt-3 space-y-2"
                    >
                      <input
                        type="tel"
                        required
                        value={profilePhone}
                        onChange={(e) =>
                          setProfilePhone(e.target.value.replace(/[^0-9()\-+ ]/g, ""))
                        }
                        className="input-field text-xs"
                        placeholder="(555) 123-4567"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={savingProfilePhone}
                          className="flex-1 btn-primary text-xs py-1.5"
                        >
                          {savingProfilePhone ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Reset to last known value from state and close
                            setEditingProfilePhone(false);
                          }}
                          className="flex-1 btn-secondary text-xs py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                
                {/* Rewards Points Display */}
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-purple-800">Rewards Points</div>
                      <div className="text-xs text-purple-600">Earn 1 point per $1 spent</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {userPoints.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        Worth ${(userPoints / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'addresses' 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Addresses
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showCompletedOrders ? 'Completed Orders' : 'Active Orders'}
                  </h2>
                  {!showCompletedOrders && (
                    <div className="flex space-x-3">
                      {getCompletedOrders().length > 0 && (
                        <button
                          onClick={() => setShowCompletedOrders(true)}
                          className="btn-secondary text-sm"
                        >
                          View Completed ({getCompletedOrders().length})
                        </button>
                      )}
                    </div>
                  )}
                  {showCompletedOrders && (
                    <button
                      onClick={() => setShowCompletedOrders(false)}
                      className="btn-secondary text-sm"
                    >
                      Back to Active Orders
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                    <Link href="/products" className="btn-primary">
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div>
                    {getDisplayedOrders().length === 0 ? (
                      <div className="card p-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {showCompletedOrders ? 'No Completed Orders' : 'No Active Orders'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {showCompletedOrders 
                            ? 'You don\'t have any completed orders yet' 
                            : 'All your orders are still being processed'
                          }
                        </p>
                        {showCompletedOrders && (
                          <button
                            onClick={() => setShowCompletedOrders(false)}
                            className="btn-primary"
                          >
                            View Active Orders
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getDisplayedOrders().map((order) => (
                          <div key={order.id} className="card p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  Order #{order.orderNumber}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="mt-2 md:mt-0">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                              <div className="space-y-3">
                                {order.items.map((item: any) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.product.name} ({item.variant.size})
                                      </p>
                                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-gray-900">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                  Total: <span className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Check Payment Status Button for Pending Crypto Orders */}
                              {order.status === "PENDING" && 
                               order.paymentMethod === "CRYPTO" && 
                               order.cryptoPaymentId && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={async () => {
                                        setPaymentStatuses(prev => ({
                                          ...prev,
                                          [order.id]: { status: "", loading: true }
                                        }));
                                        try {
                                          const response = await fetch(`/api/payments/nowpayments/status/${order.cryptoPaymentId}`);
                                          if (response.ok) {
                                            const data = await response.json();
                                            const paymentStatus = data.payment?.payment_status || "pending";
                                            setPaymentStatuses(prev => ({
                                              ...prev,
                                              [order.id]: { status: paymentStatus, loading: false }
                                            }));
                                            
                                            if (paymentStatus === "finished" || paymentStatus === "confirmed") {
                                              toast.success("Payment confirmed! Your order will be processed shortly.");
                                              // Refresh orders to get updated status
                                              setTimeout(() => fetchOrders(), 2000);
                                            }
                                          } else {
                                            setPaymentStatuses(prev => ({
                                              ...prev,
                                              [order.id]: { status: "Error checking status", loading: false }
                                            }));
                                            toast.error("Something went wrong. Please try again shortly or contact support");
                                          }
                                        } catch {
                                          setPaymentStatuses(prev => ({
                                            ...prev,
                                            [order.id]: { status: "Error", loading: false }
                                          }));
                                          toast.error("Something went wrong. Please try again shortly or contact support");
                                        }
                                      }}
                                      disabled={paymentStatuses[order.id]?.loading}
                                      className="px-3 py-1.5 text-xs btn-secondary whitespace-nowrap"
                                    >
                                      {paymentStatuses[order.id]?.loading ? "Checking..." : "Check Crypto Payment Status"}
                                    </button>
                                    {paymentStatuses[order.id]?.status && (
                                      <div className="flex-1 text-sm text-gray-600">
                                        <span className="font-medium">Status: </span>
                                        <span className={`${
                                          paymentStatuses[order.id].status === "finished" || paymentStatuses[order.id].status === "confirmed"
                                            ? "text-green-600 font-semibold"
                                            : paymentStatuses[order.id].status === "waiting" || paymentStatuses[order.id].status === "confirming" || paymentStatuses[order.id].status === "pending"
                                            ? "text-yellow-600"
                                            : paymentStatuses[order.id].status === "failed" || paymentStatuses[order.id].status === "expired"
                                            ? "text-red-600"
                                            : "text-gray-600"
                                        }`}>
                                          {(paymentStatuses[order.id].status === "waiting" || paymentStatuses[order.id].status === "confirming" || paymentStatuses[order.id].status === "pending")
                                            ? "Payment pending, we have not received your payment yet"
                                            : paymentStatuses[order.id].status.charAt(0).toUpperCase() + paymentStatuses[order.id].status.slice(1).replace(/_/g, " ")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Enhanced Tracking Component */}
                              <div className="mt-4">
                                <TrackingComponent 
                                  orderId={order.id} 
                                  trackingNumber={order.trackingNumber} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show More Button for Active Orders */}
                        {!showCompletedOrders && !showAllOrders && getActiveOrders().length > 3 && (
                          <div className="text-center pt-4">
                            <button
                              onClick={() => setShowAllOrders(true)}
                              className="btn-secondary"
                            >
                              Show More Active Orders ({getActiveOrders().length - 3} more)
                            </button>
                          </div>
                        )}

                        {/* Show Less Button */}
                        {!showCompletedOrders && showAllOrders && getActiveOrders().length > 3 && (
                          <div className="text-center pt-4">
                            <button
                              onClick={() => setShowAllOrders(false)}
                              className="btn-secondary"
                            >
                              Show Less
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setShowAddForm(true);
                      setFormData({
                        name: "",
                        street: "",
                        city: "",
                        state: "",
                        zipCode: "",
                        country: "US",
                        phone: "",
                      });
                    }}
                    className="btn-primary"
                  >
                    Add New Address
                  </button>
                </div>

                {/* Saved Addresses List */}
                {addresses.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Addresses</h3>
                    <p className="text-gray-600 mb-6">Add your first address to speed up checkout</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {addresses.map((address) => (
                      <div key={address.id} className="card p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-gray-900">{address.name}</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-gray-600 text-sm space-y-1">
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          {address.phone && <p>{address.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Address Form */}
                {showAddForm && !editingAddress && (
                  <div className="card p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="input-field"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          className="input-field"
                          placeholder="123 Main St"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="input-field"
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                            className="input-field"
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            className="input-field"
                            placeholder="10001"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={isAdding}
                          className="btn-primary"
                        >
                          {isAdding ? "Adding..." : "Add Address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit Address Form */}
                {editingAddress && (
                  <div className="card p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Edit Address</h3>
                      <button
                        onClick={() => {
                          setEditingAddress(null);
                          setFormData({
                            name: "",
                            street: "",
                            city: "",
                            state: "",
                            zipCode: "",
                            country: "US",
                            phone: "",
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="input-field"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          className="input-field"
                          placeholder="123 Main St"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="input-field"
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                            className="input-field"
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            className="input-field"
                            placeholder="10001"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={isAdding}
                          className="btn-primary"
                        >
                          {isAdding ? "Updating..." : "Update Address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(null);
                            setFormData({
                              name: "",
                              street: "",
                              city: "",
                              state: "",
                              zipCode: "",
                              country: "US",
                              phone: "",
                            });
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Address</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="font-medium text-gray-900">{deletingAddress.name}</p>
                <p className="text-gray-600 text-sm">{deletingAddress.street}</p>
                <p className="text-gray-600 text-sm">
                  {deletingAddress.city}, {deletingAddress.state} {deletingAddress.zipCode}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={confirmDeleteAddress}
                  className="btn-primary bg-red-600 hover:bg-red-700 flex-1"
                >
                  Delete Address
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingAddress(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

