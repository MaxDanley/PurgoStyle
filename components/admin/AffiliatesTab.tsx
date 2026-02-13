"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { FiSmartphone, FiEdit2, FiXCircle, FiCheckCircle } from "react-icons/fi";

interface Affiliate {
  id: string;
  userId: string;
  discountCode: string;
  commissionRate: number;
  isActive: boolean;
  totalSales: number;
  totalOrders: number;
  totalCommission: number;
  pendingCommission: number;
  createdAt: string;
  // Discount settings
  discountPercentage: number;
  freeShipping: boolean;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  minOrderAmount: number | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    orders: number;
    clicks: number;
  };
  clickStats: {
    total: number;
    qrScans: number;
    linkClicks: number;
    discountCodeUses: number;
    uniqueQrScans: number;
  };
  qrScansList: Array<{
    id: string;
    createdAt: string;
    city: string | null;
    state: string | null;
    country: string | null;
    isUnique: boolean;
  }>;
}

interface PendingInvite {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

interface PayoutRequest {
  id: string;
  affiliateId: string;
  amount: number;
  status: string;
  requestedAt: string;
  paidAt: string | null;
  affiliate: {
    discountCode: string;
    user: { id: string; name: string | null; email: string };
  };
}

export default function AffiliatesTab() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [editForm, setEditForm] = useState({
    discountCode: "",
    commissionRate: 15,
    discountPercentage: 30,
    freeShipping: true,
    usageLimit: "" as string | number,
    usageCount: 0,
    expiresAt: "",
    minOrderAmount: "" as string | number,
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; code: string; affiliateName: string } | null>(null);
  const [showScansModal, setShowScansModal] = useState(false);
  const [selectedAffiliateScans, setSelectedAffiliateScans] = useState<Affiliate | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.purgolabs.com";

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setIsLoading(true);
      const [affRes, payRes] = await Promise.all([
        fetch("/api/admin/affiliates"),
        fetch("/api/admin/affiliates/payout-requests"),
      ]);
      if (!affRes.ok) throw new Error("Failed to fetch affiliates");
      const data = await affRes.json();
      setAffiliates(data.affiliates || []);
      setPendingInvites(data.pendingInvites || []);
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayoutRequests(payData.payoutRequests || []);
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      toast.error("Failed to load affiliates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPayoutPaid = async (requestId: string) => {
    setMarkingPaidId(requestId);
    try {
      const res = await fetch(`/api/admin/affiliates/payout-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as paid");
      toast.success("Payout marked as paid");
      fetchAffiliates();
    } catch (e: any) {
      toast.error(e.message || "Failed to mark as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSendingInvite(true);
    try {
      const response = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send invite");

      toast.success("Invite sent successfully!");
      setInviteEmail("");
      fetchAffiliates();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invite");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleUpdateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAffiliate) return;

    try {
      const response = await fetch(`/api/admin/affiliates/${editingAffiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update affiliate");

      toast.success("Affiliate updated successfully!");
      setEditingAffiliate(null);
      fetchAffiliates();
    } catch (error: any) {
      toast.error(error.message || "Failed to update affiliate");
    }
  };

  const handleToggleActive = async (affiliate: Affiliate) => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !affiliate.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update affiliate");

      toast.success(`Affiliate ${affiliate.isActive ? "deactivated" : "activated"}`);
      fetchAffiliates();
    } catch (error) {
      toast.error("Failed to update affiliate status");
    }
  };

  const generateQRCode = async (affiliate: Affiliate) => {
    const referralUrl = `${baseUrl}?ref=${affiliate.discountCode}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(referralUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCodeData({
        url: qrDataUrl,
        code: affiliate.discountCode,
        affiliateName: affiliate.user.name || affiliate.user.email,
      });
      setShowQRModal(true);
    } catch (error) {
      toast.error("Failed to generate QR code");
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;
    const link = document.createElement("a");
    link.download = `purgo-labs-affiliate-${qrCodeData.code}.png`;
    link.href = qrCodeData.url;
    link.click();
  };

  const openEditModal = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setEditForm({
      discountCode: affiliate.discountCode,
      commissionRate: affiliate.commissionRate,
      discountPercentage: affiliate.discountPercentage || 30,
      freeShipping: affiliate.freeShipping ?? true,
      usageLimit: affiliate.usageLimit ?? "",
      usageCount: affiliate.usageCount || 0,
      expiresAt: affiliate.expiresAt ? new Date(affiliate.expiresAt).toISOString().split("T")[0] : "",
      minOrderAmount: affiliate.minOrderAmount ?? "",
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading affiliates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payout Requests */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payout Requests</h2>
        <p className="text-sm text-gray-600 mb-4">
          When an affiliate requests a payout, they are emailed and support receives an email. Pay them manually, then mark as paid below.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No payout requests yet.
                  </td>
                </tr>
              ) : (
                payoutRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {req.affiliate.user.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <a href={`mailto:${req.affiliate.user.email}`} className="text-cyan-600 hover:underline">
                        {req.affiliate.user.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{req.affiliate.discountCode}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${req.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(req.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          req.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleMarkPayoutPaid(req.id)}
                          disabled={markingPaidId === req.id}
                          className="text-sm font-medium text-cyan-600 hover:text-cyan-800 disabled:opacity-50"
                        >
                          {markingPaidId === req.id ? "Updating..." : "Mark as paid"}
                        </button>
                      )}
                      {req.status === "PAID" && req.paidAt && (
                        <span className="text-xs text-gray-500">
                          Paid {new Date(req.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Invite Section */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Invite New Affiliate</h2>
        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="input-field flex-1"
            required
          />
          <button
            type="submit"
            disabled={isSendingInvite}
            className="btn-primary whitespace-nowrap"
          >
            {isSendingInvite ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Invites</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInvites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{invite.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Affiliates List */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Active Affiliates ({affiliates.length})
        </h2>

        {affiliates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No affiliates yet. Send an invite to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Scans</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Code Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Earned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {affiliates.map((affiliate) => {
                  const conversionRate = affiliate.clickStats.total > 0
                    ? ((affiliate._count.orders / affiliate.clickStats.total) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={affiliate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {affiliate.user.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{affiliate.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {affiliate.discountCode}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {affiliate.commissionRate}%
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedAffiliateScans(affiliate);
                            setShowScansModal(true);
                          }}
                          className="text-left hover:opacity-80 transition-opacity"
                        >
                        <div className="text-sm font-medium text-blue-600">
                          {affiliate.clickStats.qrScans}
                        </div>
                          <div className="text-xs text-gray-500">
                            {affiliate.clickStats.uniqueQrScans || 0} unique
                          </div>
                        <div className="text-xs text-gray-500">
                          {conversionRate}% conv.
                        </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-sm font-medium text-purple-600">
                          {affiliate.clickStats.discountCodeUses}
                        </div>
                        <div className="text-xs text-gray-500">
                          at checkout
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 hidden sm:table-cell">
                        {affiliate._count.orders}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                        ${affiliate.totalSales.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium hidden lg:table-cell">
                        ${affiliate.totalCommission.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            affiliate.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {affiliate.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => generateQRCode(affiliate)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View QR Code"
                          >
                            <FiSmartphone className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(affiliate)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Edit"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(affiliate)}
                            className={`p-1 ${
                              affiliate.isActive
                                ? "text-red-600 hover:text-red-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={affiliate.isActive ? "Deactivate" : "Activate"}
                          >
                            {affiliate.isActive ? (
                              <FiXCircle className="w-5 h-5" />
                            ) : (
                              <FiCheckCircle className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Edit Affiliate: {editingAffiliate.user.name || editingAffiliate.user.email}
            </h3>
            <form onSubmit={handleUpdateAffiliate} className="space-y-4">
              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Code
                  </label>
                  <input
                    type="text"
                    value={editForm.discountCode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, discountCode: e.target.value.toUpperCase() })
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editForm.commissionRate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, commissionRate: parseFloat(e.target.value) })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Discount Settings */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Discount Settings (What Customers Get)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={editForm.discountPercentage}
                      onChange={(e) =>
                        setEditForm({ ...editForm, discountPercentage: parseFloat(e.target.value) })
                      }
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Order Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.minOrderAmount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, minOrderAmount: e.target.value })
                      }
                      className="input-field"
                      placeholder="No minimum"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.usageLimit}
                      onChange={(e) =>
                        setEditForm({ ...editForm, usageLimit: e.target.value })
                      }
                      className="input-field"
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.usageCount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, usageCount: parseInt(e.target.value) || 0 })
                      }
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={editForm.expiresAt}
                      onChange={(e) =>
                        setEditForm({ ...editForm, expiresAt: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.freeShipping}
                        onChange={(e) =>
                          setEditForm({ ...editForm, freeShipping: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Free Shipping</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAffiliate(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Affiliate QR Code
            </h3>
            <p className="text-sm text-gray-600 mb-4">{qrCodeData.affiliateName}</p>
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img src={qrCodeData.url} alt="QR Code" className="mx-auto" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Code: <code className="bg-gray-100 px-2 py-1 rounded">{qrCodeData.code}</code>
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={downloadQRCode}
                className="btn-primary"
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scan Details Modal */}
      {showScansModal && selectedAffiliateScans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              QR Scan Details - {selectedAffiliateScans.user.name || selectedAffiliateScans.user.email}
            </h3>
            {selectedAffiliateScans.qrScansList && selectedAffiliateScans.qrScansList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No QR code scans yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedAffiliateScans.qrScansList?.map((scan) => (
                      <tr key={scan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(scan.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {scan.city && scan.state
                            ? `${scan.city}, ${scan.state}`
                            : scan.country || "Unknown"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              scan.isUnique
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {scan.isUnique ? "Unique" : "Repeat"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowScansModal(false);
                  setSelectedAffiliateScans(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
