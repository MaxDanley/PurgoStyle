"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import AffiliatesTab from "@/components/admin/AffiliatesTab";

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountAmount: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  freeShipping: boolean;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image: string;
  coaUrl?: string | null;
  active: boolean;
  featured: boolean;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  price: number;
  stockCount: number;
  sku: string;
  active: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  subtotal: number;
  shippingInsurance: number;
  shippingCost: number;
  shippingMethod: string;
  total: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  paymentMethod: "CRYPTO" | "ZELLE" | "BARTERPAY" | "EDEBIT" | "CREDIT_CARD" | "OTHER";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  discountAmount: number;
  createdAt: string;
  email: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    isBackorder?: boolean;
    product: {
      name: string;
    };
    variant: {
      size: string;
    };
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "discounts" | "products" | "campaigns" | "profit" | "affiliates" | "statistics">("orders");
  const [campaignSubTab, setCampaignSubTab] = useState<"email" | "sms">("email");
  const [orders, setOrders] = useState<Order[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{ sent: number; total: number } | null>(null);
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number; failed: number } | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [statisticsDate, setStatisticsDate] = useState<string>(new Date().toISOString().split("T")[0]);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [editingTrackingNumber, setEditingTrackingNumber] = useState("");
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [sendCancellationEmail, setSendCancellationEmail] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountAmount: 0,
    minOrderAmount: "",
    maxDiscount: "",
    freeShipping: false,
    usageLimit: "",
    expiresAt: "",
  });
  const [editingStock, setEditingStock] = useState<{
    variantId: string;
    stockCount: number;
  } | null>(null);
  const [uploadingCOA, setUploadingCOA] = useState<string | null>(null);
  const [coaFiles, setCoaFiles] = useState<Record<string, File>>({});
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["PENDING", "PROCESSING", "SHIPPED", "REFUNDED"]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isDownloadingSquareReport, setIsDownloadingSquareReport] = useState(false);

  // Profit analytics time filter: day = today, week = this week, month = this month, custom = date range
  const [profitTimeFilter, setProfitTimeFilter] = useState<"all" | "day" | "week" | "month" | "custom">("all");
  const [profitCustomStart, setProfitCustomStart] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [profitCustomEnd, setProfitCustomEnd] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  /** Filter orders by profit time range (by order createdAt). */
  const filterOrdersByProfitTime = <T extends { createdAt: string }>(orderList: T[], range: "all" | "day" | "week" | "month" | "custom"): T[] => {
    if (range === "all") return orderList;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === "day") {
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      return orderList.filter(o => {
        const d = new Date(o.createdAt);
        return d >= todayStart && d <= todayEnd;
      });
    }
    if (range === "week") {
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      return orderList.filter(o => {
        const d = new Date(o.createdAt);
        return d >= weekStart && d <= now;
      });
    }
    if (range === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return orderList.filter(o => {
        const d = new Date(o.createdAt);
        return d >= monthStart && d <= now;
      });
    }
    if (range === "custom" && profitCustomStart && profitCustomEnd) {
      const rangeStart = new Date(profitCustomStart);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(profitCustomEnd);
      rangeEnd.setHours(23, 59, 59, 999);
      return orderList.filter(o => {
        const d = new Date(o.createdAt);
        return d >= rangeStart && d <= rangeEnd;
      });
    }
    return orderList;
  };

  const allStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const toggleAllStatuses = () => {
    if (statusFilter.length === allStatuses.length) {
      setStatusFilter([]);
    } else {
      setStatusFilter(allStatuses);
    }
  };


  // Redirect if not admin
  useEffect(() => {
    console.log("Admin page - Status:", status);
    console.log("Admin page - Session:", session);
    console.log("Admin page - User role:", (session?.user as any)?.role);
    
    if (status === "loading") return;
    
    if (!session || (session.user as any)?.role !== "ADMIN") {
      console.log("Redirecting - not admin");
      router.push("/");
      return;
    }
    
    console.log("User is admin, proceeding...");
  }, [session, status, router]);

  // Load data
  useEffect(() => {
    if (session && (session.user as any)?.role === "ADMIN") {
      if (activeTab === "orders" || activeTab === "profit") {
        fetchOrders();
      } else if (activeTab === "discounts") {
        fetchDiscountCodes();
      } else if (activeTab === "products") {
        fetchProducts();
      } else if (activeTab === "statistics") {
        fetchStatistics();
      }
    }
  }, [session, activeTab, statisticsDate]);

  const fetchOrders = async () => {
    console.log("Fetching orders...");
    try {
      const response = await fetch("/api/admin/orders");
      console.log("Orders response status:", response.status);
      const data = await response.json();
      console.log("Orders response data:", data);
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscountCodes = async () => {
    console.log("Fetching discount codes...");
    try {
      const response = await fetch("/api/admin/discount-codes");
      console.log("Discount codes response status:", response.status);
      const data = await response.json();
      console.log("Discount codes response data:", data);
      setDiscountCodes(data.discountCodes || []);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast.error("Failed to load discount codes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    console.log("Fetching products...");
    try {
      const response = await fetch("/api/admin/products");
      console.log("Products response status:", response.status);
      const data = await response.json();
      console.log("Products response data:", data);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/statistics?date=${statisticsDate}`);
      if (!response.ok) throw new Error("Failed to fetch statistics");
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSquareOrdersAndPriceList = async () => {
    setIsDownloadingSquareReport(true);
    try {
      const response = await fetch("/api/admin/square-orders-price-list");
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : `square-orders-and-prices-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      console.error("Download Square report error:", error);
      toast.error("Failed to download report");
    } finally {
      setIsDownloadingSquareReport(false);
    }
  };

  // Profit calculation functions
  const getProductCost = (productName: string, size: string): number => {
    const name = productName.toLowerCase().trim();
    // Normalize size - remove 'mg', spaces, and convert to lowercase
    const sizeLower = size.toLowerCase().replace(/mg/g, '').replace(/\s+/g, '').trim();
    
    // Retatrutide (GLP-3 RT)
    if (name.includes('glp-3') || name.includes('retatrutide') || name.includes('reta')) {
      if (sizeLower === '20') return 108 / 10; // $108 for 10 vials
      if (sizeLower === '15') return 100 / 10; // $100 for 10 vials
      if (sizeLower === '10') return 90 / 10; // $90 for 10 vials
    }
    
    // Tirzepatide (GLP-2 TRZ) - match various spellings including hyphenated versions
    // Remove hyphens and spaces for matching to handle "Tirze-patide", "Tirzepatide", etc.
    const normalizedName = name.replace(/-/g, '').replace(/\s+/g, '');
    if (name.includes('glp-2') || normalizedName.includes('tirzepatide') || normalizedName.includes('trizep') || normalizedName.includes('trizepitide')) {
      if (sizeLower === '20') return 72 / 10; // $72 for 10 vials
      if (sizeLower === '15') return 60 / 10; // $60 for 10 vials
      if (sizeLower === '10') return 47 / 10; // $47 for 10 vials
    }
    
    // IGF-1 LR3
    if (name.includes('igf') || name.includes('igf1')) {
      if (sizeLower === '0.1' || sizeLower === '.1') return 40 / 10; // $40 for 10 vials
    }
    
    // Glutathione
    if (name.includes('glutathione') || name.includes('gluta')) {
      if (sizeLower === '1500') return 75 / 10; // $75 for 10 vials
      if (sizeLower === '600') return 30 / 10; // $30 for 10 vials
    }
    
    // Glow
    if (name.includes('glow')) {
      if (sizeLower === '70' || sizeLower.includes('complex')) return 185 / 10; // $185 for 10 vials
    }
    
    // BAC Water
    if (name.includes('bac') || name.includes('bacteriostatic')) {
      if (sizeLower === '10' || sizeLower.includes('ml')) return 10 / 10; // $10 for 10 vials
    }
    
    // MOTS-c
    if (name.includes('mots') || name.includes('motsc')) {
      if (sizeLower === '40') return 180 / 10; // $180 for 10 vials
      if (sizeLower === '10') return 55 / 10; // $55 for 10 vials
    }
    
    // Tesamorelin
    if (name.includes('tesamorelin') || name.includes('tesa')) {
      if (sizeLower === '5') return 88 / 10; // $88 for 10 vials
    }
    
    // BPC-157
    if (name.includes('bpc')) {
      if (sizeLower === '10') return 57 / 10; // $57 for 10 vials
      if (sizeLower === '5') return 32 / 10; // $32 for 10 vials
    }
    
    // MT1 (Melatonin)
    if (name.includes('melatonin') || name.includes('mt1') || name.includes('mela')) {
      if (sizeLower === '10') return 43 / 10; // $43 for 10 vials
    }
    
    // VIP Products
    if (name.includes('vip') && !name.includes('klow')) {
      if (sizeLower.includes('10') || sizeLower.includes('vial')) return 150 / 10; // $150 for 10 vials
    }
    
    // Semax
    if (name.includes('semax')) {
      if (sizeLower === '10') return 65 / 10; // $65 for 10 vials
    }
    
    // Selank
    if (name.includes('selank')) {
      if (sizeLower === '10') return 65 / 10; // $65 for 10 vials
    }
    
    // MT2
    if (name.includes('mt2')) {
      if (sizeLower.includes('10') || sizeLower.includes('vial')) return 40 / 10; // $40 for 10 vials
    }
    
    // NAD+
    if (name.includes('nad') || name.includes('nad+')) {
      if (sizeLower === '500' || sizeLower.includes('500')) return 65 / 10; // $65 for 10 vials
    }
    
    // Wolverine
    if (name.includes('wolverine')) {
      if (sizeLower === '10') return 175 / 10; // $175 for 10 vials
    }
    
    // Semaglutide
    if (name.includes('semaglutide')) {
      if (sizeLower === '10') return 50 / 10; // $50 for 10 vials
    }
    
    // SS31
    if (name.includes('ss31') || name.includes('ss-31')) {
      if (sizeLower.includes('10') || sizeLower.includes('vial')) return 82 / 10; // $82 for 10 vials
    }
    
    // KLOW
    if (name.includes('klow')) {
      if (sizeLower.includes('10') || sizeLower.includes('vial')) return 192 / 10; // $192 for 10 vials
    }
    
    // Default: return 0 if product not found (shouldn't happen)
    return 0;
  };

  const calculateOrderProfit = (order: Order) => {
    // Calculate product costs
    let totalProductCost = 0;
    let totalVials = 0;
    
    order.items.forEach(item => {
      const productCost = getProductCost(item.product.name, item.variant.size);
      // Debug: log if product cost is 0 (product not found in cost table)
      if (productCost === 0) {
        console.warn(`⚠️ Product cost not found for: "${item.product.name}" (${item.variant.size}). Order: ${order.orderNumber}`);
      }
      const itemCost = productCost * item.quantity;
      totalProductCost += itemCost;
      totalVials += item.quantity;
    });
    
    // Calculate shipping costs based on shipping method and order size
    // Overnight shipping (expedited): costs $35, charges $50
    // Priority shipping (priority): costs $12, charges $15
    // Basic shipping (ground): costs $5 for orders with <5 vials, $10 for orders with 5+ vials, charges $0 (free)
    // Infer method from order.shippingCost when stored method is "ground" (legacy orders)
    const effectiveShippingMethod = order.shippingMethod === "expedited" || (order.shippingMethod === "ground" && (order.shippingCost ?? 0) >= 50)
      ? "expedited"
      : order.shippingMethod === "priority" || (order.shippingMethod === "ground" && (order.shippingCost ?? 0) >= 15)
      ? "priority"
      : "ground";
    const shippingCost = effectiveShippingMethod === "expedited"
      ? 35
      : effectiveShippingMethod === "priority"
      ? 12
      : (totalVials >= 5 ? 10 : 5);
    
    // Calculate packaging costs
    const labelCost = totalVials * 0.20; // $0.20 per vial
    const envelopeCost = 0.20; // $0.20 per order
    const boxCost = totalVials * 0.30; // $0.30 per vial
    
    // Calculate payment processing fees
    let paymentFee = 0;
    if (order.paymentMethod === "BARTERPAY") {
      // BarterPay takes 9% of order total
      paymentFee = order.total * 0.09;
    } else if (order.paymentMethod === "EDEBIT") {
      // E-check payments: $6.56 + $0.29 per transaction
      paymentFee = 6.56 + 0.29;
    } else if (order.paymentMethod === "CREDIT_CARD") {
      // GoDaddy Payments: 2.3% + 30¢
      paymentFee = order.total * 0.023 + 0.30;
    }
    
    const totalCosts = totalProductCost + shippingCost + labelCost + envelopeCost + boxCost + paymentFee;
    const profit = order.total - totalCosts;
    const profitMargin = order.total > 0 ? (profit / order.total) * 100 : 0;
    
    return {
      totalProductCost,
      shippingCost,
      labelCost,
      envelopeCost,
      boxCost,
      paymentFee,
      totalCosts,
      profit,
      profitMargin,
      totalVials,
      revenue: order.total,
    };
  };

  const updateStock = async (variantId: string, stockCount: number) => {
    try {
      const response = await fetch(`/api/admin/products/variant/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCount }),
      });

      if (response.ok) {
        toast.success("Stock updated successfully");
        setEditingStock(null);
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update stock");
      }
    } catch {
      toast.error("Failed to update stock");
    }
  };

  const handleCOAFileSelect = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoaFiles((prev) => ({ ...prev, [productId]: file }));
    }
  };

  const uploadCOA = async (productId: string) => {
    const file = coaFiles[productId];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploadingCOA(productId);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);

      const response = await fetch("/api/admin/products/coa", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("COA uploaded successfully");
        setCoaFiles((prev) => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
        // Refresh products to show updated COA URL
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload COA");
      }
    } catch {
      toast.error("Failed to upload COA");
    } finally {
      setUploadingCOA(null);
    }
  };

  const deleteCOA = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this COA?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/coa`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        toast.success("COA deleted successfully");
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete COA");
      }
    } catch {
      toast.error("Failed to delete COA");
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    // If changing to SHIPPED, require tracking number
    if (status === "SHIPPED") {
      setSelectedOrder(orders.find(o => o.id === orderId) || null);
      setNewStatus(status);
      setShowTrackingModal(true);
      return;
    }

    // If changing to CANCELLED or REFUNDED, require cancellation reason
    if (status === "CANCELLED" || status === "REFUNDED") {
      const order = orders.find(o => o.id === orderId);
      console.log("Showing cancellation modal for status:", status, "Order:", order?.orderNumber);
      setSelectedOrder(order || null);
      setNewStatus(status);
      setCancellationReason("");
      setSendCancellationEmail(true); // Default to sending email
      setShowCancellationModal(true);
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${status}`);
        fetchOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const updateOrderStatusWithTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    if (!newStatus || newStatus.trim() === "") {
      toast.error("Order status is required");
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          trackingNumber: trackingNumber.trim()
        }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus} with tracking number`);
        setShowTrackingModal(false);
        setSelectedOrder(null);
        setTrackingNumber("");
        setNewStatus("");
        fetchOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const updateOrderStatusWithCancellation = async () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    if (!newStatus || newStatus.trim() === "") {
      toast.error("Order status is required");
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          cancellationReason: cancellationReason.trim(),
          sendEmail: sendCancellationEmail
        }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        setShowCancellationModal(false);
        setSelectedOrder(null);
        setCancellationReason("");
        setNewStatus("");
        setSendCancellationEmail(true);
        fetchOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const addTrackingNumber = async (orderId: string) => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      const response = await fetch(`/api/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId, 
          trackingNumber: trackingNumber.trim() 
        }),
      });

      if (response.ok) {
        toast.success("Tracking number added and customer notified");
        setTrackingNumber("");
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error("Failed to add tracking number");
      }
    } catch (error) {
      toast.error("Failed to add tracking number");
    }
  };

  const updateTrackingNumber = async () => {
    if (!selectedOrder || !editingTrackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trackingNumber: editingTrackingNumber.trim() 
        }),
      });

      if (response.ok) {
        toast.success("Tracking number updated and customer notified");
        setIsEditingTracking(false);
        // Update local state
        const updatedOrder = { ...selectedOrder, trackingNumber: editingTrackingNumber.trim() };
        setSelectedOrder(updatedOrder);
        // Update orders list
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update tracking number");
      }
    } catch (error) {
      toast.error("Failed to update tracking number");
    }
  };


  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
          freeShipping: formData.freeShipping,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        }),
      });

      if (response.ok) {
        toast.success("Discount code created successfully!");
        setShowCreateForm(false);
        setFormData({
          code: "",
          description: "",
          discountType: "PERCENTAGE",
          discountAmount: 0,
          minOrderAmount: "",
          maxDiscount: "",
          freeShipping: false,
          usageLimit: "",
          expiresAt: "",
        });
        fetchDiscountCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create discount code");
      }
    } catch (error) {
      toast.error("Failed to create discount code");
    }
  };

  const toggleDiscountStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Discount code ${!isActive ? "activated" : "deactivated"}`);
        fetchDiscountCodes();
      } else {
        toast.error("Failed to update discount code");
      }
    } catch (error) {
      toast.error("Failed to update discount code");
    }
  };


  const [campaignSubject, setCampaignSubject] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "specific">("all");
  const [specificEmails, setSpecificEmails] = useState("");
  const [selectedHtmlFile, setSelectedHtmlFile] = useState<File | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);

  const [smsMessage, setSmsMessage] = useState("");
  const [smsImageFile, setSmsImageFile] = useState<File | null>(null);
  const [smsEligibleCount, setSmsEligibleCount] = useState<number | null>(null);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const [blooioNextFive, setBlooioNextFive] = useState<string[]>([]);
  const [blooioStats, setBlooioStats] = useState<{ totalEligible: number; alreadySentCount: number; remainingCount: number } | null>(null);
  const [blooioMessage, setBlooioMessage] = useState("");
  const [isSendingBlooio, setIsSendingBlooio] = useState(false);
  const [blooioResult, setBlooioResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHtmlFile) {
      toast.error("Please select an HTML file");
      return;
    }

    if (!campaignSubject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (recipientType === "specific" && !specificEmails.trim()) {
      toast.error("Please enter recipient emails");
      return;
    }

    if (!confirm(`Are you sure you want to send this campaign to ${recipientType === 'all' ? 'ALL subscribers' : 'specific recipients'}?`)) {
      return;
    }

    setIsSendingEmail(true);
    setEmailProgress({ sent: 0, total: 0 });

    const formData = new FormData();
    formData.append("subject", campaignSubject);
    formData.append("recipientType", recipientType);
    formData.append("specificEmails", specificEmails);
    formData.append("htmlFile", selectedHtmlFile);
    selectedImageFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      toast.loading("Sending email campaign...", { id: "email-sending" });

      const response = await fetch("/api/admin/send-campaign", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss("email-sending");
        toast.success(`Campaign sent successfully to ${data.sent} recipients!`);
        setEmailProgress({ sent: data.sent, total: data.contactsCount });
        // Reset form
        setCampaignSubject("");
        setSpecificEmails("");
        setSelectedHtmlFile(null);
        setSelectedImageFiles([]);
      } else {
        toast.dismiss("email-sending");
        toast.error(data.error || "Failed to send campaign");
      }
    } catch (error) {
      toast.dismiss("email-sending");
      toast.error("Failed to send campaign");
      console.error(error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!confirm("Are you sure you want to send the '20% OFF ALL PEPTIDES JUST FOR YOU' email to ALL subscribers? This cannot be undone.")) {
      return;
    }

    setIsSendingEmail(true);
    setEmailProgress({ sent: 0, total: 0 });
    
    try {
      toast.loading("Sending email campaign... this may take a while", { id: "email-sending" });
      
      const response = await fetch("/api/admin/send-custom-email", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss("email-sending");
        toast.success(`Email campaign sent successfully to ${data.sent} recipients!`);
        setEmailProgress({ sent: data.sent, total: data.contactsCount });
      } else {
        toast.dismiss("email-sending");
        toast.error(data.error || "Failed to send email campaign");
      }
    } catch (error) {
      toast.dismiss("email-sending");
      toast.error("Failed to send email campaign");
      console.error(error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const fetchSmsEligibleCount = async () => {
    try {
      const res = await fetch("/api/admin/sms-campaign/eligible");
      if (res.ok) {
        const data = await res.json();
        setSmsEligibleCount(data.count ?? 0);
      } else setSmsEligibleCount(0);
    } catch {
      setSmsEligibleCount(0);
    }
  };

  const fetchBlooioNext = async () => {
    try {
      const res = await fetch("/api/admin/sms-campaign/blooio-next");
      if (res.ok) {
        const data = await res.json();
        setBlooioNextFive(data.phones ?? []);
        setBlooioStats({
          totalEligible: data.totalEligible ?? 0,
          alreadySentCount: data.alreadySentCount ?? 0,
          remainingCount: data.remainingCount ?? 0,
        });
      } else {
        setBlooioNextFive([]);
        setBlooioStats(null);
      }
    } catch {
      setBlooioNextFive([]);
      setBlooioStats(null);
    }
  };

  useEffect(() => {
    if (activeTab === "campaigns" && campaignSubTab === "sms") {
      fetchSmsEligibleCount();
      fetchBlooioNext();
    }
  }, [activeTab, campaignSubTab]);

  const handleSendBlooioFirstFive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blooioMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (blooioNextFive.length === 0) {
      toast.error("No recipients in this batch (all eligible have been sent already).");
      return;
    }
    if (!confirm(`Send this message via Blooio (iMessage/SMS) to the next ${blooioNextFive.length} recipient(s)? They will be removed from the list for tomorrow's batch.`)) return;
    setIsSendingBlooio(true);
    setBlooioResult(null);
    try {
      const res = await fetch("/api/admin/sms-campaign/blooio-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: blooioMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlooioResult({ sent: data.sent, failed: data.failed, total: data.total });
        toast.success(`Blooio: ${data.sent} sent, ${data.failed} failed (batch of ${data.total})`);
        setBlooioMessage("");
        fetchBlooioNext();
      } else toast.error(data.error || "Failed to send Blooio campaign");
    } catch {
      toast.error("Failed to send Blooio campaign");
    } finally {
      setIsSendingBlooio(false);
    }
  };

  const handleSendSmsCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!confirm(`Send this SMS campaign to ${smsEligibleCount ?? 0} eligible recipients?`)) return;
    setIsSendingSms(true);
    setSmsResult(null);
    try {
      const formData = new FormData();
      formData.append("message", smsMessage.trim());
      if (smsImageFile) formData.append("image", smsImageFile);
      const res = await fetch("/api/admin/sms-campaign/send", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setSmsResult({ sent: data.sent, failed: data.failed, total: data.total });
        toast.success(`SMS campaign sent: ${data.sent} delivered, ${data.failed} failed`);
        setSmsMessage("");
        setSmsImageFile(null);
        fetchSmsEligibleCount();
      } else toast.error(data.error || "Failed to send SMS campaign");
    } catch (err) {
      toast.error("Failed to send SMS campaign");
    } finally {
      setIsSendingSms(false);
    }
  };

  const importContactsFromCSV = async () => {
    if (!confirm("Are you sure you want to import contacts from 'contacts-1766820235896.csv' to Omnisend?")) {
      return;
    }

    setIsImportingContacts(true);
    setImportProgress({ processed: 0, total: 0, failed: 0 });

    try {
      // 1. Fetch contacts from CSV
      toast.loading("Reading CSV file...", { id: "import-contacts" });
      const csvResponse = await fetch("/api/admin/contacts/csv");
      const csvData = await csvResponse.json();

      if (!csvResponse.ok) {
        throw new Error(csvData.error || "Failed to read CSV");
      }

      const contacts = csvData.contacts || [];
      setImportProgress({ processed: 0, total: contacts.length, failed: 0 });
      toast.loading(`Found ${contacts.length} contacts. Starting import...`, { id: "import-contacts" });

      // 2. Sync each contact one by one
      let processed = 0;
      let failed = 0;

      for (const contact of contacts) {
        try {
          const syncResponse = await fetch("/api/admin/contacts/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contact),
          });

          if (!syncResponse.ok) {
            console.error(`Failed to sync ${contact.email}:`, await syncResponse.text());
            failed++;
          }
        } catch (error) {
          console.error(`Error syncing ${contact.email}:`, error);
          failed++;
        }

        processed++;
        setImportProgress({ processed, total: contacts.length, failed });
        
        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.dismiss("import-contacts");
      toast.success(`Import completed! Processed: ${processed}, Failed: ${failed}`);

    } catch (error: any) {
      toast.dismiss("import-contacts");
      toast.error(error.message || "Failed to import contacts");
      console.error(error);
    } finally {
      setIsImportingContacts(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage orders and discount codes</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "orders"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("discounts")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "discounts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Discounts ({discountCodes.length})
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab("campaigns")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "campaigns"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Campaigns
              </button>
              <button
                onClick={() => setActiveTab("profit")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "profit"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Profit Analytics
              </button>
              <button
                onClick={() => setActiveTab("affiliates")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "affiliates"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Affiliates
              </button>
              <button
                onClick={() => setActiveTab("statistics")}
                className={`py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === "statistics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>
        </div>

        {/* Campaigns Tab (Email + SMS) */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            {/* Sub-tabs: Email | SMS */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setCampaignSubTab("email")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    campaignSubTab === "email"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignSubTab("sms")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    campaignSubTab === "sms"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  SMS
                </button>
              </nav>
            </div>

            {/* Email sub-tab */}
            {campaignSubTab === "email" && (
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Campaigns</h2>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h3>
                <form onSubmit={handleSendCampaign} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Special Offer: 20% Off All Peptides!"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTML Template File (.html) *
                      </label>
                      <input
                        type="file"
                        accept=".html"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedHtmlFile(file);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload the email.html file from your Canva export</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Images (Select all from images/ folder)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setSelectedImageFiles(Array.from(e.target.files));
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Select all images in the 'images' folder. They will be embedded.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipients
                    </label>
                    <div className="flex items-center space-x-4 mb-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="all"
                          checked={recipientType === "all"}
                          onChange={(e) => setRecipientType("all")}
                          className="mr-2"
                        />
                        All Subscribers (Main List)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="specific"
                          checked={recipientType === "specific"}
                          onChange={(e) => setRecipientType("specific")}
                          className="mr-2"
                        />
                        Specific Emails
                      </label>
                    </div>
                    
                    {recipientType === "specific" && (
                      <textarea
                        value={specificEmails}
                        onChange={(e) => setSpecificEmails(e.target.value)}
                        placeholder="Enter email addresses separated by commas or new lines..."
                        className="input-field h-24"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className={`btn-primary w-full ${isSendingEmail ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSendingEmail ? "Sending..." : "Send Custom Campaign"}
                  </button>
                </form>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Send 20% OFF Promotion (Legacy)</h3>
                    <p className="text-gray-600 mt-1 max-w-2xl">
                      Send the "20% OFF ALL PEPTIDES JUST FOR YOU" promotional email to all subscribers on the main mailing list.
                      This email includes the special offer and peptide product highlights.
                    </p>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> This will send emails to thousands of subscribers. 
                        The process runs in the background and sends emails one by one to respect rate limits.
                        Please allow some time for completion.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={sendCustomEmail}
                    disabled={isSendingEmail}
                    className={`btn-primary ${isSendingEmail ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSendingEmail ? "Sending..." : "Send Campaign"}
                  </button>
                </div>

                {emailProgress && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{emailProgress.sent} sent / {emailProgress.total} total contacts found</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${emailProgress.total > 0 ? (emailProgress.sent / emailProgress.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Contacts */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Import Contacts to Omnisend</h3>
                    <p className="text-gray-600 mt-1 max-w-2xl">
                      Import contacts from the server CSV file (`public/contacts-1766820235896.csv`) to Omnisend.
                      This will add them as subscribers with tag "imported-from-csv".
                    </p>
                  </div>
                  <button
                    onClick={importContactsFromCSV}
                    disabled={isImportingContacts}
                    className={`btn-secondary ${isImportingContacts ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isImportingContacts ? "Importing..." : "Import Contacts"}
                  </button>
                </div>

                {importProgress && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress: {importProgress.processed} / {importProgress.total} contacts</span>
                      <span>Failed: {importProgress.failed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* SMS sub-tab */}
            {campaignSubTab === "sms" && (
            <div className="card p-6 space-y-8">
              {/* Blooio: 5 per day (new conversations limit) */}
              <div className="border border-blue-200 rounded-lg p-5 bg-blue-50/50">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Blooio (iMessage/SMS) — 5 per day</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Same eligible list (delivered ≥1 month ago, has phone, opted in). Blooio allows only 5 new conversations per day. Send to the first 5 today; they are removed from the list so tomorrow you get the next 5.
                </p>
                {blooioStats !== null && (
                  <div className="text-sm text-gray-700 mb-3">
                    <strong>Next batch:</strong> {blooioNextFive.length} recipient(s) — {blooioStats.remainingCount} remaining (already sent: {blooioStats.alreadySentCount})
                  </div>
                )}
                {blooioNextFive.length > 0 && (
                  <ul className="text-sm text-gray-600 mb-3 list-disc list-inside">
                    {blooioNextFive.map((p) => (
                      <li key={p}>{p.replace(/(\+1)?(\d{3})\d{4}(\d{4})/, "$1$2***$3")}</li>
                    ))}
                  </ul>
                )}
                <form onSubmit={handleSendBlooioFirstFive} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom message *</label>
                    <textarea
                      value={blooioMessage}
                      onChange={(e) => setBlooioMessage(e.target.value)}
                      placeholder="Type your message for this batch of 5..."
                      className="input-field h-24 resize-y"
                      maxLength={1600}
                    />
                  </div>
                  {blooioResult && (
                    <p className="text-sm text-gray-600">Last run: {blooioResult.sent} sent, {blooioResult.failed} failed</p>
                  )}
                  <button
                    type="submit"
                    disabled={isSendingBlooio || blooioNextFive.length === 0 || !blooioMessage.trim()}
                    className={`btn-primary ${isSendingBlooio || blooioNextFive.length === 0 || !blooioMessage.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSendingBlooio ? "Sending..." : `Send to first 5 (${blooioNextFive.length})`}
                  </button>
                </form>
              </div>

              <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">SMS Campaign (Twilio)</h2>
              <p className="text-gray-600 mb-6">
                Send a mass text to customers who have had an order delivered at least one month ago and have a phone on file. Logged-in users must have opted in; guest orders with a phone are included by default (prior guests who gave phone count as opted in).
              </p>
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-cyan-800">
                  <strong>Eligible recipients:</strong> {smsEligibleCount !== null ? smsEligibleCount : "Loading..."} (delivered ≥1 month ago, has phone; guests with phone included by default)
                </p>
              </div>
              <form onSubmit={handleSendSmsCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type your text message here. Keep it concise for SMS."
                    className="input-field h-32 resize-y"
                    maxLength={1600}
                  />
                  <p className="text-xs text-gray-500 mt-1">SMS limit: 1600 characters (multi-segment if longer)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach image (optional, MMS)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSmsImageFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Image will be uploaded and sent as MMS. Max 5MB combined.</p>
                </div>
                {smsResult && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">Last run: {smsResult.sent} sent, {smsResult.failed} failed, {smsResult.total} total</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSendingSms || (smsEligibleCount ?? 0) === 0}
                  className={`btn-primary w-full ${isSendingSms || (smsEligibleCount ?? 0) === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSendingSms ? "Sending..." : `Send SMS Campaign to ${smsEligibleCount ?? 0} recipients`}
                </button>
              </form>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Profit Analytics Tab */}
        {activeTab === "profit" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profit Analytics</h2>
                {!isLoading && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(["all", "day", "week", "month", "custom"] as const).map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setProfitTimeFilter(range)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            profitTimeFilter === range
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {range === "all" ? "All time" : range === "day" ? "Today" : range === "week" ? "This week" : range === "month" ? "This month" : "Custom range"}
                        </button>
                      ))}
                    </div>
                    {profitTimeFilter === "custom" && (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <label className="flex items-center gap-1.5">
                          <span className="text-gray-600">From</span>
                          <input
                            type="date"
                            value={profitCustomStart}
                            onChange={(e) => setProfitCustomStart(e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1.5 text-gray-900"
                          />
                        </label>
                        <label className="flex items-center gap-1.5">
                          <span className="text-gray-600">To</span>
                          <input
                            type="date"
                            value={profitCustomEnd}
                            onChange={(e) => setProfitCustomEnd(e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1.5 text-gray-900"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading profit data...</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  {(() => {
                    const statusFiltered = orders.filter(order => 
                      order.status !== "CANCELLED" && order.status !== "REFUNDED" && order.status !== "PENDING"
                    );
                    const allOrders = filterOrdersByProfitTime(statusFiltered, profitTimeFilter);
                    const profitData = allOrders.map(calculateOrderProfit);
                    const totalRevenue = profitData.reduce((sum, p) => sum + p.revenue, 0);
                    const totalCosts = profitData.reduce((sum, p) => sum + p.totalCosts, 0);
                    const totalProfit = profitData.reduce((sum, p) => sum + p.profit, 0);
                    const totalVials = profitData.reduce((sum, p) => sum + p.totalVials, 0);
                    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 md:p-6">
                          <div className="text-xs md:text-sm font-medium text-green-700 mb-1">Total Revenue</div>
                          <div className="text-2xl md:text-3xl font-bold text-green-900">${totalRevenue.toFixed(2)}</div>
                          <div className="text-xs text-green-600 mt-1">{allOrders.length} orders</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 md:p-6">
                          <div className="text-xs md:text-sm font-medium text-red-700 mb-1">Total Costs</div>
                          <div className="text-2xl md:text-3xl font-bold text-red-900">${totalCosts.toFixed(2)}</div>
                          <div className="text-xs text-red-600 mt-1">{totalVials} vials shipped</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 md:p-6">
                          <div className="text-xs md:text-sm font-medium text-blue-700 mb-1">Total Profit</div>
                          <div className={`text-2xl md:text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                            ${totalProfit.toFixed(2)}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">{avgProfitMargin.toFixed(1)}% margin</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 md:p-6">
                          <div className="text-xs md:text-sm font-medium text-purple-700 mb-1">Avg Profit/Order</div>
                          <div className="text-2xl md:text-3xl font-bold text-purple-900">
                            ${allOrders.length > 0 ? (totalProfit / allOrders.length).toFixed(2) : '0.00'}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">Per order average</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Orders Table */}
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 md:px-0">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                              Items
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Revenue
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              Product Cost
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              Shipping
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                              Packaging
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Costs
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Profit
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                              Margin
                            </th>
                          </tr>
                        </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filterOrdersByProfitTime(
                          orders.filter(order => order.status !== "CANCELLED" && order.status !== "REFUNDED" && order.status !== "PENDING"),
                          profitTimeFilter
                        ).map((order) => {
                            const profit = calculateOrderProfit(order);
                            return (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-xs md:text-sm font-medium text-gray-900">
                                      #{order.orderNumber}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(order.createdAt).toLocaleDateString()}
                                    </div>
                                    {/* Show items on mobile */}
                                    <div className="text-xs text-gray-600 mt-1 sm:hidden">
                                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-4 hidden sm:table-cell">
                                  <div className="text-xs md:text-sm text-gray-900">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="mb-1">
                                        {item.quantity}x {item.product.name} ({item.variant.size})
                                        {(item as any).isBackorder && (
                                          <span className="ml-1 text-xs text-orange-600 font-semibold">[BACKORDER]</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {profit.totalVials} vials total
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                                  ${profit.revenue.toFixed(2)}
                                </td>
                                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 hidden lg:table-cell">
                                  ${profit.totalProductCost.toFixed(2)}
                                </td>
                                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 hidden lg:table-cell">
                                  ${profit.shippingCost.toFixed(2)}
                                </td>
                                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 hidden xl:table-cell">
                                  <div className="text-xs">
                                    <div>Labels: ${profit.labelCost.toFixed(2)}</div>
                                    <div>Envelope: ${profit.envelopeCost.toFixed(2)}</div>
                                    <div>Box: ${profit.boxCost.toFixed(2)}</div>
                                    {profit.paymentFee > 0 && (
                                      <div className="text-red-600 font-medium mt-1">
                                        Payment Fee: ${profit.paymentFee.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-red-700">
                                  ${profit.totalCosts.toFixed(2)}
                                </td>
                                <td className={`px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-bold ${
                                  profit.profit >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  ${profit.profit.toFixed(2)}
                                </td>
                                <td className={`px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium hidden md:table-cell ${
                                  profit.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {profit.profitMargin.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        {(() => {
                          const statusFiltered = orders.filter(order => 
                            order.status !== "CANCELLED" && order.status !== "REFUNDED" && order.status !== "PENDING"
                          );
                          const allOrders = filterOrdersByProfitTime(statusFiltered, profitTimeFilter);
                          const profitData = allOrders.map(calculateOrderProfit);
                          const totalRevenue = profitData.reduce((sum, p) => sum + p.revenue, 0);
                          const totalProductCost = profitData.reduce((sum, p) => sum + p.totalProductCost, 0);
                          const totalShipping = profitData.reduce((sum, p) => sum + p.shippingCost, 0);
                          const totalLabels = profitData.reduce((sum, p) => sum + p.labelCost, 0);
                          const totalEnvelope = profitData.reduce((sum, p) => sum + p.envelopeCost, 0);
                          const totalBox = profitData.reduce((sum, p) => sum + p.boxCost, 0);
                          const totalPaymentFee = profitData.reduce((sum, p) => sum + (p.paymentFee || 0), 0);
                          const totalCosts = profitData.reduce((sum, p) => sum + p.totalCosts, 0);
                          const totalProfit = profitData.reduce((sum, p) => sum + p.profit, 0);
                          const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

                          return (
                            <tr className="font-bold">
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                                TOTAL ({allOrders.length} orders)
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 hidden sm:table-cell">
                                {profitData.reduce((sum, p) => sum + p.totalVials, 0)} vials
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                                ${totalRevenue.toFixed(2)}
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 hidden lg:table-cell">
                                ${totalProductCost.toFixed(2)}
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 hidden lg:table-cell">
                                ${totalShipping.toFixed(2)}
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-700 hidden xl:table-cell">
                                <div className="text-xs">
                                  <div>Labels: ${totalLabels.toFixed(2)}</div>
                                  <div>Envelope: ${totalEnvelope.toFixed(2)}</div>
                                  <div>Box: ${totalBox.toFixed(2)}</div>
                                  {totalPaymentFee > 0 && (
                                    <div className="text-red-600 font-medium mt-1">
                                      Payment Fees: ${totalPaymentFee.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-red-700">
                                ${totalCosts.toFixed(2)}
                              </td>
                              <td className={`px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm ${
                                totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                ${totalProfit.toFixed(2)}
                              </td>
                              <td className={`px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm hidden md:table-cell ${
                                totalMargin >= 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {totalMargin.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Affiliates Tab */}
        {activeTab === "affiliates" && (
          <AffiliatesTab />
        )}

        {/* Statistics Tab */}
        {activeTab === "statistics" && (
          <div className="space-y-6">
            <div className="card p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Daily Statistics</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    value={statisticsDate}
                    onChange={(e) => {
                      setStatisticsDate(e.target.value);
                      fetchStatistics();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={fetchStatistics}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading statistics...</p>
                </div>
              ) : statistics ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs md:text-sm font-medium text-blue-700 mb-1">Unique Visitors</div>
                      <div className="text-2xl md:text-3xl font-bold text-blue-900">{statistics.uniqueVisitors || 0}</div>
                      <div className="text-xs text-blue-600 mt-1">Page views tracked</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                      <div className="text-xs md:text-sm font-medium text-green-700 mb-1">Cart Additions</div>
                      <div className="text-2xl md:text-3xl font-bold text-green-900">{statistics.uniqueCartAdditions || 0}</div>
                      <div className="text-xs text-green-600 mt-1">Unique users</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs md:text-sm font-medium text-purple-700 mb-1">Completed Orders</div>
                      <div className="text-2xl md:text-3xl font-bold text-purple-900">{statistics.completedOrders || 0}</div>
                      <div className="text-xs text-purple-600 mt-1">Paid orders</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                      <div className="text-xs md:text-sm font-medium text-orange-700 mb-1">Conversion Rate</div>
                      <div className="text-2xl md:text-3xl font-bold text-orange-900">
                        {statistics.uniqueCartAdditions > 0
                          ? ((statistics.completedOrders / statistics.uniqueCartAdditions) * 100).toFixed(1)
                          : "0.0"}%
                      </div>
                      <div className="text-xs text-orange-600 mt-1">Cart to order</div>
                    </div>
                  </div>

                  {/* Checkout Drop-offs */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Checkout Drop-offs</h3>
                    <div className="space-y-4">
                      {statistics.checkoutDropoffs && Object.entries(statistics.checkoutDropoffs).map(([step, data]: [string, any]) => (
                        <div key={step} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="capitalize font-medium text-gray-900">{step}</span>
                              {step === "completed" && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 sm:mt-0">
                              <span>Reached: <strong className="text-gray-900">{data.reached || 0}</strong></span>
                              {step !== "completed" && (
                                <span>Dropped: <strong className="text-red-600">{data.dropped || 0}</strong></span>
                              )}
                            </div>
                          </div>
                          {step !== "completed" && data.reached > 0 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(data.dropped / data.reached) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {((data.dropped / data.reached) * 100).toFixed(1)}% drop-off rate
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Pages */}
                  {statistics.pageViews && statistics.pageViews.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Top Pages</h3>
                      <div className="space-y-2">
                        {statistics.pageViews.map((pv: { path: string; count: number }, index: number) => (
                          <div key={pv.path} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-sm text-gray-700 truncate flex-1">{pv.path || "/"}</span>
                            <span className="text-sm font-medium text-gray-900 ml-4">{pv.count} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No statistics available for this date.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <button
                  type="button"
                  onClick={downloadSquareOrdersAndPriceList}
                  disabled={isDownloadingSquareReport}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingSquareReport ? "Preparing…" : "Download Square orders & price list (CSV)"}
                </button>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by order number, customer name, email, or tracking..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="relative sm:w-64">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex justify-between items-center"
                  >
                    <span className="block truncate">
                      {statusFilter.length === 0
                        ? "Select Statuses"
                        : statusFilter.length === allStatuses.length
                        ? "All Statuses"
                        : `${statusFilter.length} Selected`}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {isFilterDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div className="p-2 border-b border-gray-200">
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={statusFilter.length === allStatuses.length}
                            onChange={toggleAllStatuses}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Select All</span>
                        </label>
                      </div>
                      <div className="p-2 space-y-1">
                        {allStatuses.map((status) => (
                          <label key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={statusFilter.includes(status)}
                              onChange={() => toggleStatusFilter(status)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{status.toLowerCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Backdrop to close dropdown */}
                  {isFilterDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setIsFilterDropdownOpen(false)}
                    />
                  )}
                </div>
              </div>
              
              {/* Filtered Orders Count */}
              {(searchQuery || statusFilter.length !== allStatuses.length) && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {orders.filter(order => {
                    const matchesSearch = !searchQuery || 
                      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      order.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = statusFilter.includes(order.status);
                    return matchesSearch && matchesStatus;
                  }).length} of {orders.length} orders
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders
                      .filter(order => {
                        const q = searchQuery.toLowerCase().trim();
                        const matchesSearch = !q ||
                          order.orderNumber.toLowerCase().includes(q) ||
                          (order.user?.name?.toLowerCase().includes(q) ?? false) ||
                          (order.shippingAddress?.name?.toLowerCase().includes(q) ?? false) ||
                          (order.user?.email?.toLowerCase().includes(q) ?? false) ||
                          (order.email?.toLowerCase().includes(q) ?? false) ||
                          (order.trackingNumber?.toLowerCase().includes(q) ?? false);
                        const matchesStatus = statusFilter.includes(order.status);
                        return matchesSearch && matchesStatus;
                      })
                      .map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetailsModal(true);
                      }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.user?.name || order.shippingAddress?.name || "Guest"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(() => {
                                const email = order.user?.email || order.email || "Guest Order";
                                const fullName = order.user?.name || order.shippingAddress?.name || "";
                                if (fullName) {
                                  const nameParts = fullName.trim().split(/\s+/);
                                  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
                                  return lastName ? `${lastName} • ${email}` : email;
                                }
                                return email;
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "PROCESSING" ? "bg-blue-100 text-blue-800" :
                            order.status === "SHIPPED" ? "bg-purple-100 text-purple-800" :
                            order.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                            order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.trackingNumber ? (
                            <a 
                              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.trackingNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 font-medium hover:text-blue-800 hover:underline"
                            >
                              {order.trackingNumber}
                            </a>
                          ) : (
                            <span className="text-gray-400">No tracking</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <select
                            value={order.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUNDED">Refunded</option>
                          </select>
                          {order.status === "PROCESSING" && !order.trackingNumber && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setNewStatus("SHIPPED");
                                setShowTrackingModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              Add Tracking
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Discount Codes Tab */}
        {activeTab === "discounts" && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="btn-primary"
                >
                  {showCreateForm ? "Cancel" : "Create New"}
                </button>
              </div>

              {/* Create Form */}
              {showCreateForm && (
                <form onSubmit={handleCreateDiscount} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="input-field"
                        placeholder="SAVE20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input-field"
                        placeholder="20% off all orders"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type *
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT" })}
                        className="input-field"
                      >
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED_AMOUNT">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Amount *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step={formData.discountType === "PERCENTAGE" ? "0.01" : "0.01"}
                        max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })}
                        className="input-field"
                        placeholder={formData.discountType === "PERCENTAGE" ? "20" : "10.00"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Order Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                        className="input-field"
                        placeholder="50.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Discount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                        className="input-field"
                        placeholder="25.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usage Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                        className="input-field"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="freeShipping"
                      checked={formData.freeShipping}
                      onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="freeShipping" className="ml-2 block text-sm text-gray-700">
                      Include Free Shipping
                    </label>
                  </div>

                  <button type="submit" className="btn-primary">
                    Create Discount Code
                  </button>
                </form>
              )}

              {/* Discount Codes List */}
              <div className="space-y-4">
                {discountCodes.map((discount) => (
                  <div key={discount.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{discount.code}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            discount.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {discount.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {discount.description && (
                          <p className="text-gray-600 mt-1">{discount.description}</p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">
                            {discount.discountType === "PERCENTAGE" 
                              ? `${discount.discountAmount}% off`
                              : `$${discount.discountAmount} off`
                            }
                          </span>
                          {discount.freeShipping && (
                            <span className="text-green-600 font-semibold"> • FREE SHIPPING</span>
                          )}
                          {discount.minOrderAmount && (
                            <span> • Min order: ${discount.minOrderAmount}</span>
                          )}
                          {discount.maxDiscount && (
                            <span> • Max discount: ${discount.maxDiscount}</span>
                          )}
                          {discount.usageLimit && (
                            <span> • Usage: {discount.usageCount}/{discount.usageLimit}</span>
                          )}
                          {discount.expiresAt && (
                            <span> • Expires: {new Date(discount.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleDiscountStatus(discount.id, discount.isActive)}
                        className={`px-3 py-1 text-sm rounded ${
                          discount.isActive 
                            ? "bg-red-100 text-red-700 hover:bg-red-200" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {discount.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Management</h2>
              
              <div className="space-y-6">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.featured ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {product.featured ? "Featured" : "Regular"}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {product.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleCOAFileSelect(product.id, e)}
                          />
                          <span className="text-xs text-blue-600 hover:text-blue-800">
                            {coaFiles[product.id] ? coaFiles[product.id].name : "Upload COA"}
                          </span>
                        </label>
                        {coaFiles[product.id] && (
                          <button
                            onClick={() => uploadCOA(product.id)}
                            disabled={uploadingCOA === product.id}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            {uploadingCOA === product.id ? "Uploading..." : "Upload"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* COA Section */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Certificate of Analysis (COA)</h4>
                      {product.coaUrl ? (
                        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">COA Available</p>
                              <a 
                                href={product.coaUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                View COA ↗
                              </a>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteCOA(product.id)}
                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            Delete COA
                          </button>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-sm text-gray-700">No COA uploaded yet. Upload a COA using the "Upload COA" button above.</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Variants & Stock</h4>
                      <div className="space-y-2">
                        {product.variants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900">{variant.size}</span>
                              <span className="text-sm text-gray-600 ml-2">${variant.price.toFixed(2)}</span>
                              <span className="text-sm text-gray-500 ml-2">({variant.sku})</span>
                            </div>
                            {editingStock?.variantId === variant.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editingStock.stockCount}
                                  onChange={(e) => setEditingStock({ 
                                    variantId: variant.id, 
                                    stockCount: parseInt(e.target.value) || 0 
                                  })}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="0"
                                />
                                <button
                                  onClick={() => updateStock(variant.id, editingStock.stockCount)}
                                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingStock(null)}
                                  className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  variant.stockCount > 0 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  Stock: {variant.stockCount}
                                </span>
                                <button
                                  onClick={() => setEditingStock({ variantId: variant.id, stockCount: variant.stockCount })}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-2 sm:p-4 overflow-auto" onClick={() => {
            setShowOrderDetailsModal(false);
            setSelectedOrder(null);
          }}>
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.orderNumber}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOrderDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const fullName = selectedOrder.user?.name || selectedOrder.shippingAddress?.name || "Guest";
                      const nameParts = fullName.trim().split(/\s+/);
                      const firstName = nameParts[0] || "";
                      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
                      return (
                        <>
                          <p><strong>Name:</strong> {fullName}</p>
                          {lastName && <p><strong>Last Name:</strong> {lastName}</p>}
                          <p><strong>Email:</strong> {selectedOrder.user?.email || selectedOrder.email || "Guest Order"}</p>
                          {selectedOrder.shippingAddress?.phone && (
                            <p><strong>Phone:</strong> {selectedOrder.shippingAddress.phone}</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
                    <div className="text-sm space-y-1">
                      <p>{selectedOrder.shippingAddress.name}</p>
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.product.name}
                            {(item as any).isBackorder && (
                              <span className="ml-2 text-xs text-orange-600 font-semibold">[BACKORDER]</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.variant.size}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`font-medium ${
                        selectedOrder.paymentStatus === "PAID" ? "text-green-600" :
                        selectedOrder.paymentStatus === "PENDING" ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Method:</span>
                      <span className="font-medium">
                        {(() => {
                          const method = selectedOrder.shippingMethod || "ground";
                          const cost = selectedOrder.shippingCost ?? 0;
                          if (method === "expedited") return "Overnight";
                          if (method === "priority") return "Priority";
                          if (method === "ground" && cost >= 50) return "Overnight";
                          if (method === "ground" && cost >= 15) return "Priority";
                          return "Ground";
                        })()}
                      </span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tracking Number:</span>
                          {!isEditingTracking ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${selectedOrder.trackingNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {selectedOrder.trackingNumber}
                              </a>
                              <button 
                                onClick={() => {
                                  setIsEditingTracking(true);
                                  setEditingTrackingNumber(selectedOrder.trackingNumber || "");
                                }}
                                className="text-gray-400 hover:text-blue-600"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={updateTrackingNumber}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setIsEditingTracking(false)}
                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditingTracking && (
                          <input
                            type="text"
                            value={editingTrackingNumber}
                            onChange={(e) => setEditingTrackingNumber(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter new tracking number"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${selectedOrder.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Insurance:</span>
                      <span className="font-medium">${(selectedOrder.shippingInsurance || 3.50).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">
                        {selectedOrder.shippingCost === 0 ? "FREE" : `$${selectedOrder.shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-lg text-gray-900">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attribution Information */}
              {((selectedOrder as any).attributionSource || (selectedOrder as any).attributionMedium || (selectedOrder as any).initialReferrer || (selectedOrder as any).affiliateId) && (
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Attribution & Source</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {(selectedOrder as any).attributionSource && (
                      <div className="flex justify-between md:justify-start md:gap-4">
                        <span className="text-gray-600">Source:</span>
                        <span className="font-medium capitalize">{(selectedOrder as any).attributionSource}</span>
                      </div>
                    )}
                    {(selectedOrder as any).attributionMedium && (
                      <div className="flex justify-between md:justify-start md:gap-4">
                        <span className="text-gray-600">Medium:</span>
                        <span className="font-medium capitalize">{(selectedOrder as any).attributionMedium}</span>
                      </div>
                    )}
                    {(selectedOrder as any).attributionCampaign && (
                      <div className="flex justify-between md:justify-start md:gap-4">
                        <span className="text-gray-600">Campaign:</span>
                        <span className="font-medium">{(selectedOrder as any).attributionCampaign}</span>
                      </div>
                    )}
                    {(selectedOrder as any).affiliateId && (
                      <div className="flex justify-between md:justify-start md:gap-4">
                        <span className="text-gray-600">Affiliate ID:</span>
                        <span className="font-medium">{(selectedOrder as any).affiliateId}</span>
                      </div>
                    )}
                    {(selectedOrder as any).initialReferrer && (
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                        <span className="text-gray-600">Initial Referrer:</span>
                        <span className="font-medium break-all text-xs text-gray-500">{(selectedOrder as any).initialReferrer}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracking Number Modal */}
        {showTrackingModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {showTrackingModal ? "Change Status to Shipped" : "Add Tracking Number"}
              </h3>
              <p className="text-gray-600 mb-4">
                Order #{selectedOrder?.orderNumber} - {selectedOrder?.user?.email || selectedOrder?.email || "Guest Order"}
              </p>
              {showTrackingModal && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Required:</strong> A tracking number is required when changing order status to "Shipped".
                  </p>
                </div>
              )}
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="input-field w-full mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => showTrackingModal ? updateOrderStatusWithTracking() : addTrackingNumber(selectedOrder!.id)}
                  className="btn-primary flex-1"
                >
                  {showTrackingModal ? "Update Status" : "Add Tracking"}
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setTrackingNumber("");
                    setShowTrackingModal(false);
                    setNewStatus("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation/Refund Modal */}
        {showCancellationModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {newStatus === "CANCELLED" ? "Cancel Order" : "Refund Order"}
              </h3>
              <p className="text-gray-600 mb-4">
                Order #{selectedOrder?.orderNumber} - {selectedOrder?.user?.email || selectedOrder?.email || "Guest Order"}
              </p>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Required:</strong> Please provide a reason for {newStatus === "CANCELLED" ? "cancellation" : "refund"}. {sendCancellationEmail ? "This will be included in the email sent to the customer." : "This will be saved in the order history."}
                </p>
              </div>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder={`Enter reason for ${newStatus === "CANCELLED" ? "cancellation" : "refund"}...`}
                className="input-field w-full mb-4 min-h-[120px]"
                rows={4}
              />
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendCancellationEmail}
                    onChange={(e) => setSendCancellationEmail(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-700">
                    Send email notification to customer
                  </span>
                </label>
                {!sendCancellationEmail && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Customer will not be notified via email (useful for duplicate orders)
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={updateOrderStatusWithCancellation}
                  className="btn-primary flex-1"
                >
                  {newStatus === "CANCELLED" ? "Cancel Order" : "Refund Order"}
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setCancellationReason("");
                    setShowCancellationModal(false);
                    setNewStatus("");
                    setSendCancellationEmail(true);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}