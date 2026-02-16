"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DesignData {
  shirtColor: string;
  size: string;
  quantity: number;
  elements: unknown[];
}

export default function CustomDesignOrderPage() {
  const router = useRouter();
  const [design, setDesign] = useState<DesignData | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("custom_design");
    if (!raw) {
      router.replace("/custom-design/studio");
      return;
    }
    try {
      setDesign(JSON.parse(raw) as DesignData);
    } catch {
      router.replace("/custom-design/studio");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!design) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingInfo: form,
          design: {
            shirtColor: design.shirtColor,
            size: design.size,
            quantity: design.quantity,
            elements: design.elements,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not create order. Please try again.");
        return;
      }
      sessionStorage.removeItem("custom_design");
      toast.success("Redirecting to secure payment…");
      window.location.href = data.redirectUrl || `/order-confirmation?order=${data.orderNumber}`;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (design === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete your custom order</h1>
        <p className="text-gray-600 mb-8">
          Custom tee — Size {design.size}, Qty {design.quantity}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" required value={form.name} onChange={handleChange} className="input-field" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="input-field" placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street address *</label>
            <input name="street" required value={form.street} onChange={handleChange} className="input-field" placeholder="123 Main St" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc.</label>
            <input name="apartment" value={form.apartment} onChange={handleChange} className="input-field" placeholder="Apt 4" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input name="city" required value={form.city} onChange={handleChange} className="input-field" placeholder="Phoenix" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input name="state" required value={form.state} onChange={handleChange} className="input-field" placeholder="AZ" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP code *</label>
            <input name="zipCode" required value={form.zipCode} onChange={handleChange} className="input-field" placeholder="85001" />
          </div>
          <input name="country" type="hidden" value={form.country} />

          <div className="flex gap-4 pt-4">
            <Link href="/custom-design/studio" className="btn-secondary flex-1 text-center">
              Back to design
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-50">
              {isSubmitting ? "Submitting…" : "Place custom order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
