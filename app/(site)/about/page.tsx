"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SECONDARY_PICTURES_FOR_HOME } from "@/lib/products";
import CustomTeeCard from "@/components/CustomTeeCard";
import {
  FaMapMarkerAlt,
  FaLeaf,
  FaShieldAlt,
  FaTruck,
  FaPalette,
  FaTshirt,
  FaEnvelope,
  FaChevronRight,
} from "react-icons/fa";
import { HiPencilAlt, HiOutlineSparkles } from "react-icons/hi";

function SectionSeparator({ icon: Icon = HiOutlineSparkles }: { icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <span className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-brand-300" />
      {Icon && <Icon className="w-5 h-5 text-brand-500" />}
      <span className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-brand-300" />
    </div>
  );
}

export default function AboutPage() {
  const [products, setProducts] = useState<{ id: string; name: string; slug: string; image: string; secondImage?: string | null }[]>([]);

  const CUSTOM_TEE_SLUGS = ["custom-tee", "custom-tshirt", "custom-t-shirt"];

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        const list = (data.products || []).filter(
          (p: { slug?: string }) => !CUSTOM_TEE_SLUGS.includes((p.slug ?? "").toLowerCase())
        );
        setProducts(list.slice(0, 6));
      })
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-100" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-slate-200/40 rounded-full blur-3xl" />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
              <FaMapMarkerAlt className="w-4 h-4" />
              Arizona-based
            </div>
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
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700 transition-colors"
              >
                Shop Now
                <FaChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/custom-design/studio"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-400 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
              >
                <HiPencilAlt className="w-5 h-5" />
                Design Your Shirt
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Product imagery strip */}
      <section className="w-full py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 max-w-5xl mx-auto px-4">
          {SECONDARY_PICTURES_FOR_HOME.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg ring-1 ring-slate-200/50">
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

      <SectionSeparator icon={FaLeaf} />

      {/* Why Summer Steeze - with icons */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
            Why Summer Steeze
          </h2>
          <p className="text-slate-600 text-center max-w-xl mx-auto mb-12">
            Built for heat, comfort, and real use—no clutter, no gimmicks.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-6 group-hover:bg-brand-200 transition-colors">
                <FaMapMarkerAlt className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Arizona Born</h3>
              <p className="text-slate-600">
                Designed and run from Arizona. Built for heat, comfort, and real use—whether you're on the trail or in the city.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-6 group-hover:bg-brand-200 transition-colors">
                <FaLeaf className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Clean & Simple</h3>
              <p className="text-slate-600">
                We keep things clean: design, quality, and how we do business. No clutter, no gimmicks—just gear that works.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-6 group-hover:bg-brand-200 transition-colors">
                <FaShieldAlt className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3 text-lg">Quality You Can Feel</h3>
              <p className="text-slate-600">
                Tees and hoodies you'll actually wear. Premium fabrics and construction you can trust, season after season.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionSeparator icon={FaTshirt} />

      {/* How it works - UberPrints style */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
            How It Works
          </h2>
          <p className="text-slate-600 text-center max-w-xl mx-auto mb-12">
            From design to delivery—simple and straightforward.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                <HiPencilAlt className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">Design Online</h3>
              <p className="text-slate-600 text-sm">
                Use our Design Studio to create custom tees or shop ready-made styles. Add text, upload your logo, pick colors.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                <FaPalette className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">Expertly Made</h3>
              <p className="text-slate-600 text-sm">
                We stand behind every piece. Quality printing and construction so your gear looks and feels great.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                <FaTruck className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-lg">Delivered To You</h3>
              <p className="text-slate-600 text-sm">
                Fast shipping so you can get back to what matters. Track your order every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* Our Gear - product grid with Custom T-Shirt first */}
      <section className="py-16 lg:py-20 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">
            Our Gear
          </h2>
          <p className="text-slate-600 text-center max-w-xl mx-auto mb-12">
            Premium tees, hoodies, and activewear—plus design your own in our studio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <CustomTeeCard />
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
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {p.name}
                  </h3>
                  <span className="text-sm text-brand-600 font-medium inline-flex items-center gap-1">
                    View product <FaChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700"
            >
              View All Products
              <FaChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SectionSeparator icon={HiOutlineSparkles} />

      {/* Story / Mission */}
      <section className="py-16 lg:py-20">
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

      <SectionSeparator />

      {/* Contact CTA */}
      <section className="py-16 bg-slate-50">
        <div className="container-custom text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
            <FaEnvelope className="w-7 h-7 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Questions? Get in touch.
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-6">
            We're here to help with orders, sizing, or anything else. Reach out anytime.
          </p>
          <a
            href="mailto:hello@summersteez.com"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold text-lg"
          >
            <FaEnvelope className="w-5 h-5" />
            hello@summersteez.com
          </a>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
