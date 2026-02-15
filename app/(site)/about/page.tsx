"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Arizona activewear. <span className="text-brand-600">Summer Steeze</span>.
            </h1>
            <p className="mt-6 text-lg text-slate-700">
              We’re an Arizona-based brand built on simple, honest gear you can rely on. 
              Tees and hoodies designed for the desert and the everyday.
            </p>
            <p className="mt-4 text-lg text-slate-700">
              From the Sonoran sun to the trail, our pieces are made to move with you. 
              Quality fabrics, straightforward design, no fluff. That’s Summer Steeze.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 text-white font-medium hover:bg-brand-700"
              >
                Shop Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Why Summer Steeze</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Arizona Born</h3>
              <p className="text-slate-600 text-sm">Designed and run from Arizona. Built for heat, comfort, and real use.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Clean & Simple</h3>
              <p className="text-slate-600 text-sm">We keep things clean: design, quality, and how we do business.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Quality You Can Feel</h3>
              <p className="text-slate-600 text-sm">Tees and hoodies you’ll actually wear. No gimmicks, just good gear.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom text-center">
          <p className="text-slate-600 max-w-xl mx-auto">
            Questions? Reach out at{" "}
            <a href="mailto:hello@summersteez.com" className="text-brand-600 hover:underline">hello@summersteez.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
