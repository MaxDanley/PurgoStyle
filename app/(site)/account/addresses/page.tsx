"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

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

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    loadAddresses();
  }, [session, status, router]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        loadAddresses();
      } else {
        toast.error("Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (address: Address) => {
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

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Address deleted successfully");
        loadAddresses();
      } else {
        toast.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container-custom max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/account" 
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Account
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="text-gray-600 mt-2">Manage your shipping addresses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add/Edit Address Form */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="btn-primary flex-1"
                >
                  {isAdding ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                </button>
                
                {editingAddress && (
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
                )}
              </div>
            </form>
          </div>

          {/* Saved Addresses List */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Addresses</h2>
            
            {addresses.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No saved addresses yet. Add your first address above.
              </p>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{address.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {address.street}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        {address.phone && (
                          <p className="text-gray-600 text-sm">{address.phone}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(address)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
