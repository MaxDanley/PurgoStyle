"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCart } from "@/lib/store";

const MAX_HISTORY = 50;
type ViewMode = "front" | "back";

const FONTS = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Impact",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black",
  "Palatino Linotype",
];

const TEXT_COLORS = [
  "#000000",
  "#ffffff",
  "#b91c1c",
  "#166534",
  "#1e3a5f",
  "#7c3aed",
  "#c2410c",
  "#0e7490",
  "#4f46e5",
  "#dc2626",
  "#2563eb",
];

type TextElement = {
  type: "text";
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: "normal" | "bold";
  letterSpacing: number;
};

type ImageElement = {
  type: "image";
  id: string;
  x: number;
  y: number;
  src: string;
  width: number;
  height: number;
};

type DesignElement = TextElement | ImageElement;

const SHIRT_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#1a1a1a" },
  { name: "Heather Gray", value: "#9ca3af" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Red", value: "#b91c1c" },
  { name: "Forest", value: "#166534" },
  { name: "Maroon", value: "#800020" },
  { name: "Royal Blue", value: "#4169e1" },
  { name: "Kelly Green", value: "#2d8f3e" },
  { name: "Orange", value: "#ea580c" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Pink", value: "#db2777" },
];

const CUSTOM_TEE_IMAGES_BASE = "/PURGO STYLE LABS (1)/custom_blank_tees";
const SHIRT_COLOR_TO_IMAGE: Record<string, string> = {
  White: "White.png",
  Black: "Black.png",
  "Heather Gray": "Gray.png",
  Navy: "Blue.png",
  Red: "Maroon.png",
  Forest: "Light Green.png",
  Maroon: "Maroon.png",
  "Royal Blue": "Blue.png",
  "Kelly Green": "Light Green.png",
  Orange: "Yellow.png",
  Yellow: "Yellow.png",
  Pink: "Gray.png",
};

const SIZES = ["S", "M", "L", "XL", "2XL"];
/** Per-shirt fee added on top of the product price when adding a custom design */
const CUSTOM_DESIGN_FEE_PER_SHIRT = 15;

interface ProductVariantOption {
  id: string;
  size: string;
  price: number;
}

interface ProductOption {
  id: string | null;
  name: string;
  slug: string;
  image: string;
  category?: string;
  variants?: ProductVariantOption[];
}

export default function DesignStudioPage() {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [elementsBack, setElementsBack] = useState<DesignElement[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("front");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0].value);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const [zoom, setZoom] = useState(1);
  const [newText, setNewText] = useState("");
  const [newTextSize, setNewTextSize] = useState(24);
  const [newTextFont, setNewTextFont] = useState(FONTS[0]);
  const [newTextColor, setNewTextColor] = useState("#000000");
  const [newTextBold, setNewTextBold] = useState(false);
  const [newLetterSpacing, setNewLetterSpacing] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quantitiesBySize, setQuantitiesBySize] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, "2XL": 0 });
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [designName, setDesignName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragPushedRef = useRef(false);

  const currentElements = viewMode === "front" ? elements : elementsBack;
  const selectedElement = selectedId ? currentElements.find((e) => e.id === selectedId) : null;
  const selectedProduct = selectedProductId ? products.find((p) => p.id === selectedProductId) : products.find((p) => p.slug === "custom-tee" || p.slug === "custom-tshirt");
  const isCustomTee = !selectedProductId || selectedProduct?.slug === "custom-tee" || selectedProduct?.slug === "custom-tshirt";

  const [history, setHistory] = useState<{ elements: DesignElement[]; elementsBack: DesignElement[]; shirtColor: string; productId: string | null }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback(() => {
    const snapshot = {
      elements: JSON.parse(JSON.stringify(elements)),
      elementsBack: JSON.parse(JSON.stringify(elementsBack)),
      shirtColor,
      productId: selectedProductId,
    };
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(snapshot);
      return next.slice(-MAX_HISTORY);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [elements, elementsBack, shirtColor, selectedProductId, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    const s = history[idx];
    if (s) {
      setElements(s.elements);
      setElementsBack(s.elementsBack);
      setShirtColor(s.shirtColor);
      setSelectedProductId(s.productId);
      setHistoryIndex(idx);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    const s = history[idx];
    if (s) {
      setElements(s.elements);
      setElementsBack(s.elementsBack);
      setShirtColor(s.shirtColor);
      setSelectedProductId(s.productId);
      setHistoryIndex(idx);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    pushHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to seed history
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        const list = (data.products || []).filter((p: { active?: boolean }) => p.active !== false);
        const withVariants = list.map((p: { id: string; name: string; slug: string; image: string; category?: string; variants?: { id: string; size: string; price: number }[] }) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image || "/placeholder.svg",
          category: p.category,
          variants: (p.variants || []).map((v: { id: string; size: string; price: number }) => ({ id: v.id, size: v.size, price: v.price })),
        }));
        const customTee = withVariants.find((p: ProductOption) => p.slug === "custom-tee" || p.slug === "custom-tshirt");
        setProducts(
          customTee
            ? [customTee, ...withVariants.filter((p: ProductOption) => p.id !== customTee.id)]
            : [{ id: null, name: "Custom T-Shirt", slug: "custom-tee", image: "", category: "Custom", variants: [] }, ...withVariants]
        );
      })
      .catch(() => setProducts([{ id: null, name: "Custom T-Shirt", slug: "custom-tee", image: "", category: "Custom", variants: [] }]));
  }, []);

  const shareDesign = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({
        title: "My design – Summer Steeze",
        text: "Check out my custom design",
        url,
      }).then(() => toast.success("Shared")).catch(() => {
        navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard"));
      });
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard")).catch(() => toast.error("Could not copy"));
    }
  }, []);

  const addText = () => {
    if (!newText.trim()) return;
    pushHistory();
    const el: TextElement = {
      type: "text",
      id: `t-${Date.now()}`,
      x: 100,
      y: 130,
      text: newText.trim(),
      fontSize: newTextSize,
      fontFamily: newTextFont,
      color: newTextColor,
      fontWeight: newTextBold ? "bold" : "normal",
      letterSpacing: newLetterSpacing,
    };
    if (viewMode === "front") setElements((prev) => [...prev, el]);
    else setElementsBack((prev) => [...prev, el]);
    setSelectedId(el.id);
    setNewText("");
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pushHistory();
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const el: ImageElement = {
        type: "image",
        id: `i-${Date.now()}`,
        x: 80,
        y: 100,
        src,
        width: 140,
        height: 140,
      };
      if (viewMode === "front") setElements((prev) => [...prev, el]);
      else setElementsBack((prev) => [...prev, el]);
      setSelectedId(el.id);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateElement = (id: string, updates: Partial<TextElement> | Partial<ImageElement>) => {
    pushHistory();
    const upd = (prev: DesignElement[]) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...updates } as DesignElement) : el));
    if (elements.some((e) => e.id === id)) setElements(upd);
    else if (elementsBack.some((e) => e.id === id)) setElementsBack(upd);
  };

  const removeElement = (id: string) => {
    pushHistory();
    if (viewMode === "front") setElements((prev) => prev.filter((el) => el.id !== id));
    else setElementsBack((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    pushHistory();
    const move = (prev: DesignElement[]) => {
      const i = prev.findIndex((e) => e.id === id);
      if (i === -1) return prev;
      if (direction === "up" && i === prev.length - 1) return prev;
      if (direction === "down" && i === 0) return prev;
      const next = [...prev];
      const j = direction === "up" ? i + 1 : i - 1;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    };
    if (elements.some((e) => e.id === id)) setElements(move);
    else setElementsBack(move);
  };

  const handlePointerDown = useCallback((id: string, e: React.PointerEvent) => {
    const el = currentElements.find((el) => el.id === id);
    if (!el) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const layoutWidth = containerRef.current?.offsetWidth ?? rect.width;
    const layoutHeight = containerRef.current?.offsetHeight ?? rect.height;
    const scale = rect.width / layoutWidth;
    const pointerLayoutX = (e.clientX - rect.left) / scale;
    const pointerLayoutY = (e.clientY - rect.top) / scale;
    setSelectedId(id);
    setDraggingId(id);
    setDragOffset({ x: pointerLayoutX - el.x, y: pointerLayoutY - el.y });
    containerRef.current?.setPointerCapture?.(e.pointerId);
  }, [currentElements]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingId === null) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const layoutWidth = containerRef.current?.offsetWidth ?? rect?.width ?? 400;
      const layoutHeight = containerRef.current?.offsetHeight ?? rect?.height ?? 533;
      if (!rect) return;
      const scale = rect.width / layoutWidth;
      if (!dragPushedRef.current) {
        dragPushedRef.current = true;
        pushHistory();
      }
      const pointerLayoutX = (e.clientX - rect.left) / scale;
      const pointerLayoutY = (e.clientY - rect.top) / scale;
      const x = Math.max(0, Math.min(layoutWidth - 80, pointerLayoutX - dragOffset.x));
      const y = Math.max(0, Math.min(layoutHeight - 40, pointerLayoutY - dragOffset.y));
      const upd = (prev: DesignElement[]) => prev.map((el) => (el.id === draggingId ? { ...el, x, y } : el));
      if (elements.some((el) => el.id === draggingId)) setElements(upd);
      else setElementsBack(upd);
    },
    [draggingId, dragOffset, elements, pushHistory]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    containerRef.current?.releasePointerCapture?.(e.pointerId);
    dragPushedRef.current = false;
    setDraggingId(null);
  }, []);

  const serializeElements = (els: DesignElement[]) =>
    els.map((el) => {
      if (el.type === "text")
        return { type: "text" as const, x: el.x, y: el.y, text: el.text, fontSize: el.fontSize, fontFamily: el.fontFamily, color: el.color, fontWeight: el.fontWeight, letterSpacing: el.letterSpacing };
      return { type: "image" as const, x: el.x, y: el.y, src: el.src, width: el.width, height: el.height };
    });

  /** Capture design preview (shirt + front elements) as a data URL for cart/order */
  const captureDesignPreview = useCallback(async (): Promise<string | null> => {
    const container = containerRef.current;
    if (!container) return null;
    const w = container.offsetWidth || 320;
    const h = container.offsetHeight || 427;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const shirtUrl = isCustomTee
      ? `${CUSTOM_TEE_IMAGES_BASE}/${SHIRT_COLOR_TO_IMAGE[SHIRT_COLORS.find((c) => c.value === shirtColor)?.name ?? "White"] ?? "White.png"}`
      : (() => {
          const p = products.find((pr) => pr.id === selectedProductId);
          return p?.image || "";
        })();

    const drawImageFit = (img: HTMLImageElement) => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.min(w / iw, h / ih);
      const sw = iw * scale;
      const sh = ih * scale;
      const x = (w - sw) / 2;
      const y = (h - sh) / 2;
      ctx.drawImage(img, 0, 0, iw, ih, x, y, sw, sh);
    };

    try {
      if (shirtUrl) {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            drawImageFit(img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = shirtUrl.startsWith("data:") ? shirtUrl : (shirtUrl.startsWith("/") ? window.location.origin + shirtUrl : shirtUrl);
        });
      } else {
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, 0, w, h);
      }

      for (const el of elements) {
        if (el.type === "text") {
          ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
          ctx.fillStyle = el.color;
          ctx.fillText(el.text, el.x, el.y + el.fontSize);
        } else {
          await new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              ctx.drawImage(img, el.x, el.y, el.width, el.height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = el.src;
          });
        }
      }
      return canvas.toDataURL("image/jpeg", 0.88);
    } catch {
      return null;
    }
  }, [isCustomTee, shirtColor, selectedProductId, products, elements]);

  const addToCart = useCart((s) => s.addItem);

  const buildDesign = (qty?: number, qtyBySize?: Record<string, number>) => ({
    shirtColor: isCustomTee ? shirtColor : undefined,
    size,
    quantity: qty ?? quantity,
    quantitiesBySize: qtyBySize ?? undefined,
    productId: selectedProductId ?? undefined,
    productSlug: (() => {
      const p = products.find((pr) => pr.id === selectedProductId);
      return p?.slug;
    })(),
    elements: serializeElements(elements),
    elementsBack: serializeElements(elementsBack),
  });

  /** Resolve product (by selectedProductId or custom-tee slug) and variant for size */
  const getProductAndVariant = (sizeKey: string) => {
    const product = selectedProductId
      ? products.find((p) => p.id === selectedProductId)
      : products.find((p) => p.slug === "custom-tee" || p.slug === "custom-tshirt");
    if (!product?.id || !product.variants?.length) return null;
    const variant = product.variants.find((v) => v.size === sizeKey) ?? product.variants[0];
    return { product, variant };
  };

  /** Add current design to cart (single line or one per size when qtyBySize provided); then optionally redirect */
  const addDesignToCart = async (opts?: { qty?: number; qtyBySize?: Record<string, number>; redirectToCart?: boolean }) => {
    const qtyBySize = opts?.qtyBySize;
    let design = buildDesign(opts?.qty, qtyBySize);
    const previewDataUrl = await captureDesignPreview();
    if (previewDataUrl) design = { ...design, previewImage: previewDataUrl };
    const displayImage = previewDataUrl ?? (products.find((p) => p.id === selectedProductId || p.slug === "custom-tee" || p.slug === "custom-tshirt")?.image || "/placeholder.svg");

    if (qtyBySize && Object.keys(qtyBySize).length > 0) {
      const total = Object.entries(qtyBySize).reduce((s, [, n]) => s + n, 0);
      if (total < 1) {
        toast.error("Enter at least one quantity.");
        return;
      }
      let added = 0;
      for (const sizeKey of SIZES) {
        const q = qtyBySize[sizeKey];
        if (!q || q < 1) continue;
        const resolved = getProductAndVariant(sizeKey);
        if (!resolved) {
          toast.error("Product or size not available. Try Custom T-Shirt.");
          return;
        }
        const { product, variant } = resolved;
        addToCart({
          productId: product.id!,
          variantId: variant.id,
          productName: product.name + " (custom design)",
          variantSize: variant.size,
          price: variant.price + CUSTOM_DESIGN_FEE_PER_SHIRT,
          quantity: q,
          image: displayImage,
          customDesign: design,
        });
        added += q;
      }
      toast.success(`Added ${added} item(s) to cart.`);
    } else {
      const qty = opts?.qty ?? quantity;
      const resolved = getProductAndVariant(size);
      if (!resolved) {
        toast.error("Product or size not available. Try Custom T-Shirt.");
        return;
      }
      const { product, variant } = resolved;
      addToCart({
        productId: product.id!,
        variantId: variant.id,
        productName: product.name + " (custom design)",
        variantSize: variant.size,
        price: variant.price + CUSTOM_DESIGN_FEE_PER_SHIRT,
        quantity: qty,
        image: displayImage,
        customDesign: design,
      });
      toast.success(`Added ${qty} item(s) to cart.`);
    }
    if (opts?.redirectToCart) window.location.href = "/cart";
  };

  const totalQtyFromSizes = Object.values(quantitiesBySize).reduce((a, b) => a + b, 0);
  const calculateQuote = () => {
    const base = 24;
    const perItem = 8;
    const total = totalQtyFromSizes;
    if (total < 1) {
      setCalculatedPrice(null);
      return;
    }
    setCalculatedPrice(base + total * perItem);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4">
          <Link href="/custom-design" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Custom Design
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Design Studio</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuoteModal(true)}
              className="rounded-lg border-2 border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Quote / Buy
            </button>
            <button
              type="button"
              onClick={() => addDesignToCart({ redirectToCart: true })}
              className="rounded-lg bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600"
            >
              Add to Cart ({quantity} item{quantity !== 1 ? "s" : ""})
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Add text / Add image */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Add text</h2>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addText()}
                placeholder="Your text"
                className="input-field mb-3"
              />
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-16">Font</label>
                  <select
                    value={newTextFont}
                    onChange={(e) => setNewTextFont(e.target.value)}
                    className="input-field flex-1 text-sm"
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-16">Size</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={newTextSize}
                    onChange={(e) => setNewTextSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-8">{newTextSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-16">Color</label>
                  <div className="flex flex-wrap gap-1">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTextColor(c)}
                        className={`w-6 h-6 rounded border-2 ${newTextColor === c ? "border-gray-900 scale-110" : "border-gray-300"}`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-16">Bold</label>
                  <button
                    type="button"
                    onClick={() => setNewTextBold((b) => !b)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border-2 ${newTextBold ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"}`}
                  >
                    Bold
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-16">Spacing</label>
                  <input
                    type="range"
                    min="-2"
                    max="8"
                    value={newLetterSpacing}
                    onChange={(e) => setNewLetterSpacing(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-6">{newLetterSpacing}px</span>
                </div>
              </div>
              <button type="button" onClick={addText} className="btn-secondary w-full">
                Add text to design
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Add image</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={addImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full"
              >
                Upload image
              </button>
            </div>
          </div>

          {/* Center: Toolbar + Shirt canvas */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
                title="Undo"
                aria-label="Undo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
                title="Redo"
                aria-label="Redo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === "front" ? "back" : "front"))}
                className={`p-2 rounded-lg border-2 ${viewMode === "back" ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-white hover:bg-gray-50"}`}
                title={viewMode === "front" ? "View back of shirt" : "View front"}
                aria-label={viewMode === "front" ? "View back of shirt" : "View front"}
              >
                <span className="text-sm font-medium">{viewMode === "front" ? "Back" : "Front"}</span>
              </button>
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg bg-white p-1">
                <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="p-1.5 rounded hover:bg-gray-100" aria-label="Zoom out">−</button>
                <span className="text-sm w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.25))} className="p-1.5 rounded hover:bg-gray-100" aria-label="Zoom in">+</button>
              </div>
              <button
                type="button"
                onClick={shareDesign}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                title="Share design"
                aria-label="Share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
            </div>
            <div className="w-full max-w-md flex justify-center" style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}>
              <div
                ref={containerRef}
                className="relative w-full aspect-[3/4] rounded-xl overflow-hidden select-none bg-gray-300"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ touchAction: "none" }}
              >
                {/* Shirt: real custom tee image by color (front/back) or product image */}
                {isCustomTee ? (
                  <div className={`absolute inset-0 ${viewMode === "back" ? "scale-x-[-1]" : ""}`}>
                    <Image
                      src={encodeURI(
                        `${CUSTOM_TEE_IMAGES_BASE}/${SHIRT_COLOR_TO_IMAGE[SHIRT_COLORS.find((c) => c.value === shirtColor)?.name ?? "White"] ?? "White.png"}`
                      )}
                      alt="Custom tee"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 28rem"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    {(() => {
                      const p = products.find((pr) => pr.id === selectedProductId);
                      if (p?.image) return <Image src={p.image} alt={p.name} fill className="object-contain" />;
                      return <span className="text-gray-500 text-sm">Product image</span>;
                    })()}
                  </div>
                )}
                {/* Design elements for current view (front or back) */}
                {(viewMode === "front" ? elements : elementsBack).map((el) => (
                <div
                  key={el.id}
                  className="absolute cursor-move border-2 rounded"
                  style={{
                    left: el.x,
                    top: el.y,
                    zIndex: 10,
                    borderColor: selectedId === el.id ? "var(--brand-500, #f97316)" : "transparent",
                    ...(el.type === "image" ? { width: el.width, height: el.height } : {}),
                    pointerEvents: "auto",
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePointerDown(el.id, e);
                  }}
                >
                  {el.type === "text" ? (
                    <span
                      style={{
                        fontSize: el.fontSize,
                        fontFamily: el.fontFamily,
                        color: el.color,
                        fontWeight: el.fontWeight,
                        letterSpacing: `${el.letterSpacing}px`,
                        pointerEvents: "none",
                      }}
                      className="whitespace-nowrap px-1 bg-white/70"
                    >
                      {el.text}
                    </span>
                  ) : (
                    <img
                      src={el.src}
                      alt=""
                      width={el.width}
                      height={el.height}
                      className="object-contain pointer-events-none select-none"
                      draggable={false}
                      style={{ display: "block" }}
                    />
                  )}
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm leading-none flex items-center justify-center z-10"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              Drag to move. Select an element to edit font, color, and layers below.
            </p>
          </div>

          {/* Right: Product, shirt color (if custom), size, qty + selected element props + layers */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Product</h2>
              <select
                value={selectedProductId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  pushHistory();
                  setSelectedProductId(v === "" ? null : v);
                }}
                className="input-field w-full"
              >
                {products.map((p) => (
                  <option key={p.id ?? "custom"} value={p.id ?? ""}>{p.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose Custom T-Shirt to pick a color, or one of your products to design on (no color options).</p>
            </div>
            {isCustomTee && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Shirt color</h2>
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => { pushHistory(); setShirtColor(c.value); }}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      shirtColor === c.value ? "border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-400" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            )}

            {selectedElement && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 border-brand-500/50">
                <h2 className="font-bold text-gray-900 mb-4">Edit selected</h2>
                {selectedElement.type === "text" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Font</label>
                      <select
                        value={selectedElement.fontFamily}
                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="input-field w-full text-sm mt-1"
                      >
                        {FONTS.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Size</label>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full mt-1"
                      />
                      <span className="text-xs text-gray-500">{selectedElement.fontSize}px</span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Color</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateElement(selectedElement.id, { color: c })}
                            className={`w-6 h-6 rounded border-2 ${selectedElement.color === c ? "border-gray-900 scale-110" : "border-gray-300"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Bold</label>
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold" })}
                        className={`px-3 py-1 rounded text-sm border-2 ${selectedElement.fontWeight === "bold" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"}`}
                      >
                        Bold
                      </button>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Letter spacing (px)</label>
                      <input
                        type="range"
                        min="-2"
                        max="8"
                        value={selectedElement.letterSpacing}
                        onChange={(e) => updateElement(selectedElement.id, { letterSpacing: Number(e.target.value) })}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Width</label>
                      <input
                        type="range"
                        min="40"
                        max="280"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="w-full mt-1"
                      />
                      <span className="text-xs text-gray-500">{selectedElement.width}px</span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Height</label>
                      <input
                        type="range"
                        min="40"
                        max="280"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                        className="w-full mt-1"
                      />
                      <span className="text-xs text-gray-500">{selectedElement.height}px</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Layers ({viewMode})</h2>
              <p className="text-xs text-gray-500 mb-3">Top of list = on top of shirt.</p>
              <ul className="space-y-2">
                {[...currentElements].reverse().map((el, idx) => (
                  <li
                    key={el.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded border ${
                      selectedId === el.id ? "border-brand-500 bg-brand-50" : "border-gray-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(el.id)}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {el.type === "text" ? `"${el.text}"` : "Image"}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLayer(el.id, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                        aria-label="Bring forward"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLayer(el.id, "down")}
                        disabled={idx === currentElements.length - 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                        aria-label="Send backward"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeElement(el.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {elements.length === 0 && (
                <p className="text-sm text-gray-500">Add text or an image to see layers.</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Size</h2>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                      size === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Quantity</h2>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="input-field w-24"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quote / Buy modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQuoteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Calculate Price & Add To Cart</h2>
            <p className="text-sm text-gray-600 mb-4">Enter quantities by size, then calculate your price. Name your design and proceed to order.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantities by size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["S", "M", "L", "XL", "2XL"] as const).map((s) => (
                    <div key={s}>
                      <label className="text-xs text-gray-500">{s}</label>
                      <input
                        type="number"
                        min={0}
                        value={quantitiesBySize[s] ?? 0}
                        onChange={(e) => setQuantitiesBySize((prev) => ({ ...prev, [s]: Math.max(0, Number(e.target.value) || 0) }))}
                        className="input-field w-full mt-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={calculateQuote} className="btn-primary w-full">
                Calculate Price
              </button>
              {calculatedPrice != null && (
                <p className="text-lg font-semibold text-gray-900">Estimated total: ${calculatedPrice.toFixed(2)}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Design name (optional)</label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="My design"
                  className="input-field w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuoteModal(false);
                    if (totalQtyFromSizes > 0) {
                      addDesignToCart({ qtyBySize: quantitiesBySize, redirectToCart: false });
                      window.location.href = "/checkout";
                    } else {
                      addDesignToCart({ redirectToCart: true });
                    }
                  }}
                  className="flex-1 rounded-lg bg-brand-500 py-2.5 font-semibold text-white hover:bg-brand-600"
                >
                  Add to Cart & Checkout
                </button>
                <button
                  type="button"
                  onClick={() => { setShowQuoteModal(false); addDesignToCart({ qtyBySize: totalQtyFromSizes > 0 ? quantitiesBySize : undefined, redirectToCart: true }); }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Add to Cart only
                </button>
                <button type="button" onClick={() => setShowQuoteModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
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
