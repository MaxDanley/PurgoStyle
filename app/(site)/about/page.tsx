"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SECONDARY_PICTURES_FOR_HOME } from "@/lib/products";

export default function AboutPage() {
  const [products, setProducts] = useState<{ id: string; name: string; slug: string; image: string; secondImage?: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => setProducts((data.products || []).slice(0, 6)))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-100" />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">
              Arizona activewear. <span className="text-brand-600">Summer Steeze</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-700 leading-relaxed">
              We're an Arizona-based brand built on simple, honest gear you can rely on.
              Tees and hoodies designed for the desert and the everyday.
            </p>
            <p className="mt-4 text-lg text-slate-700">
              From the Sonoran sun to the trail, our pieces are made to move with you.
              Quality fabrics, straightforward design, no fluff. That's Summer Steeze.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center rounded-xl bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-xl border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product imagery strip - secondary pictures */}
      <section className="w-full py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 max-w-5xl mx-auto px-4">
          {SECONDARY_PICTURES_FOR_HOME.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
              <Image
                src={src}
                alt="Summer Steeze"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Why Summer Steeze */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
            Why Summer Steeze
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Arizona Born</h3>
              <p className="text-slate-600">
                Designed and run from Arizona. Built for heat, comfort, and real use—whether you're on the trail or in the city.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Clean & Simple</h3>
              <p className="text-slate-600">
                We keep things clean: design, quality, and how we do business. No clutter, no gimmicks—just gear that works.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Quality You Can Feel</h3>
              <p className="text-slate-600">
                Tees and hoodies you'll actually wear. Premium fabrics and construction you can trust, season after season.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Gear - product grid */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
            Our Gear
          </h2>
          <p className="text-slate-600 text-center max-w-xl mx-auto mb-12">
            Premium tees, hoodies, and activewear built for the Arizona lifestyle.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative aspect-square bg-slate-100">
                  <Image
                    src={(p.secondImage || p.image) || "/placeholder.svg"}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {p.name}
                  </h3>
                  <span className="text-sm text-brand-600 font-medium">View product →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex rounded-xl bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Story / Mission */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
            Built for the Desert
          </h2>
          <p className="text-slate-700 text-lg leading-relaxed mb-6">
            Summer Steeze started with a simple idea: create apparel that holds up to Arizona's heat, fits your life, and looks good doing it. We focus on breathable fabrics, relaxed fits, and designs that work from morning runs to weekend hangouts.
          </p>
          <p className="text-slate-700 text-lg leading-relaxed">
            Every piece is chosen and designed with the same standard—quality you can feel. No excess, no compromise. Just gear that earns its place in your rotation.
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Questions? Get in touch.
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-6">
            We're here to help with orders, sizing, or anything else. Reach out anytime.
          </p>
          <a
            href="mailto:hello@summersteez.com"
            className="text-brand-600 hover:text-brand-700 font-semibold text-lg"
          >
            hello@summersteez.com
          </a>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex rounded-xl border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
