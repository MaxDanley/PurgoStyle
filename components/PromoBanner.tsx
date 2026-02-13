"use client";

export default function PromoBanner() {
  const message = "30% OFF & FREE SHIPPING SITE-WIDE";
  
  return (
    <div className="bg-[#3aaff9] text-white py-2 overflow-hidden whitespace-nowrap">
      <div className="animate-marquee inline-block">
        {/* Repeat the message multiple times for seamless scrolling */}
        {[...Array(10)].map((_, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="font-bold text-sm tracking-wide">{message}</span>
            <span className="mx-8 text-white/70">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

