"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type DesignElement = 
  | { type: "text"; id: string; x: number; y: number; text: string; fontSize: number }
  | { type: "image"; id: string; x: number; y: number; src: string; width: number; height: number };

const SHIRT_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#1a1a1a" },
  { name: "Heather Gray", value: "#9ca3af" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Red", value: "#b91c1c" },
  { name: "Forest", value: "#166534" },
];

const SIZES = ["S", "M", "L", "XL", "2XL"];

export default function DesignStudioPage() {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0].value);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const [newText, setNewText] = useState("");
  const [newTextSize, setNewTextSize] = useState(24);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addText = () => {
    if (!newText.trim()) return;
    setElements((prev) => [
      ...prev,
      { type: "text", id: `t-${Date.now()}`, x: 120, y: 140, text: newText.trim(), fontSize: newTextSize },
    ]);
    setNewText("");
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setElements((prev) => [
        ...prev,
        { type: "image", id: `i-${Date.now()}`, x: 100, y: 120, src, width: 120, height: 120 },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  const handlePointerDown = useCallback((id: string, clientX: number, clientY: number) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    setDraggingId(id);
    setDragOffset({ x: clientX - el.x, y: clientY - el.y });
  }, [elements]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingId === null) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(rect.width - 50, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - 30, e.clientY - rect.top - dragOffset.y));
      setElements((prev) =>
        prev.map((el) => (el.id === draggingId ? { ...el, x, y } : el))
      );
    },
    [draggingId, dragOffset]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleOrder = () => {
    const design = {
      shirtColor,
      size,
      quantity,
      elements: elements.map((el) => {
        if (el.type === "text") return { type: "text", x: el.x, y: el.y, text: el.text, fontSize: el.fontSize };
        return { type: "image", x: el.x, y: el.y, src: el.src, width: el.width, height: el.height };
      }),
    };
    sessionStorage.setItem("custom_design", JSON.stringify(design));
    window.location.href = "/custom-design/order";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4">
          <Link href="/custom-design" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Custom Design
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Design Studio</h1>
          <button
            type="button"
            onClick={handleOrder}
            className="rounded-lg bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600"
          >
            Order ({quantity} item{quantity !== 1 ? "s" : ""})
          </button>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Tools */}
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
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm text-gray-600">Size:</label>
                <input
                  type="range"
                  min="14"
                  max="48"
                  value={newTextSize}
                  onChange={(e) => setNewTextSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-8">{newTextSize}</span>
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

          {/* Center: Shirt preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div
              ref={containerRef}
              className="relative w-full max-w-md aspect-[3/4] bg-gray-200 rounded-xl overflow-hidden select-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: "none" }}
            >
              {/* Shirt base */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: shirtColor }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"
                  alt="T-shirt"
                  fill
                  className="object-contain opacity-90 mix-blend-multiply"
                  sizes="50vw"
                  unoptimized
                />
              </div>
              {/* Design elements */}
              {elements.map((el) => (
                <div
                  key={el.id}
                  className="absolute cursor-move border-2 border-transparent hover:border-brand-500 rounded"
                  style={{
                    left: el.x,
                    top: el.y,
                    zIndex: 10,
                  }}
                  onPointerDown={(e) => handlePointerDown(el.id, e.clientX, e.clientY)}
                >
                  {el.type === "text" ? (
                    <span
                      style={{ fontSize: el.fontSize }}
                      className="font-bold text-gray-900 whitespace-nowrap bg-white/80 px-1"
                    >
                      {el.text}
                    </span>
                  ) : (
                    <img
                      src={el.src}
                      alt=""
                      width={el.width}
                      height={el.height}
                      className="object-contain pointer-events-none"
                      draggable={false}
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm leading-none flex items-center justify-center"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              Drag text and images to position them on the shirt.
            </p>
          </div>

          {/* Right: Product options */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-4">Shirt color</h2>
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setShirtColor(c.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      shirtColor === c.value ? "border-gray-900 scale-110" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
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
    </div>
  );
}
