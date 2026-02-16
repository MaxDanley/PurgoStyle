"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

const DESIGN_SERVICE_OPTIONS = [
  "Custom team uniforms (sports, leagues, clubs)",
  "Event merchandise (runs, festivals, conferences)",
  "Branded apparel & workwear",
  "Logo & graphic design for apparel",
  "Full collection design (multiple pieces)",
  "Sample development & small runs",
  "Other (describe in project details)",
];

/** Trusted By: small service-based businesses (not big corps) */
const TRUSTED_BY = [
  { name: "Desert Sun Gym", initial: "DS" },
  { name: "Valley Landscaping Co", initial: "VL" },
  { name: "Cactus Coffee Roasters", initial: "CC" },
  { name: "Mesa Family Dentistry", initial: "MF" },
  { name: "Phoenix Running Club", initial: "PR" },
  { name: "Tempe Yoga Studio", initial: "TY" },
  { name: "Scottsdale Pet Care", initial: "SP" },
];

const BEST_SELLING = [
  { title: "Hoodies", desc: "Our best-selling pullover hoodies.", href: "/custom-design/studio", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80" },
  { title: "Crewnecks", desc: "Custom sweats for cold weather.", href: "/custom-design/studio", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80" },
  { title: "Basic T-Shirts", desc: "Standard tees for any occasion.", href: "/custom-design/studio", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
  { title: "Premium Tees", desc: "Our favorite super-soft t-shirts.", href: "/custom-design/studio", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80" },
  { title: "No Minimums", desc: "No minimums, unlimited print colors.", href: "/custom-design/studio", img: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80" },
];

export default function CustomDesignPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    brand: "",
    whatDoYouSell: "",
    designServices: "",
    projectDetails: "",
    timeline: "",
    quantityEstimate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/custom-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }
      toast.success("Request sent! We'll get back to you within 1–2 business days.");
      setFormData({
        name: "", email: "", phone: "", brand: "", whatDoYouSell: "",
        designServices: "", projectDetails: "", timeline: "", quantityEstimate: "",
      });
    } catch {
      toast.error("Something went wrong. Please try again or email help@summersteez.com.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1920&q=85"
            alt="Custom t-shirts"
            fill
            className="object-cover brightness-75"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        </div>
        <div className="container-custom relative z-10 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight">
              Custom T-Shirts
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/95">
              Create your own t-shirts, tanks, hoodies and more in our online design studio.
            </p>
            <Link
              href="/custom-design/studio"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-lg font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Create Your Shirt
              <span aria-hidden>→</span>
            </Link>
            <ul className="mt-8 flex flex-wrap gap-6 text-white">
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> Free shipping on orders over $100
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> No minimums
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✓</span> Quality guaranteed
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 md:py-16 border-b border-gray-200">
        <div className="container-custom text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
            Trusted by
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {TRUSTED_BY.map((b) => (
              <div
                key={b.name}
                className="flex flex-col items-center gap-2 text-gray-600"
              >
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700">
                  {b.initial}
                </div>
                <span className="text-xs font-medium text-gray-500 max-w-[100px] text-center leading-tight">
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best-selling / Jump right in */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center uppercase">
            Our best-selling shirts. <span className="text-brand-600">Jump right in.</span>
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            Get started with one of our best-selling favorites.
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {BEST_SELLING.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="relative aspect-[3/4] bg-gray-100">
                  <Image
                    src={item.img}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 20vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 uppercase">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center">
            <Link href="/products" className="text-brand-600 font-semibold hover:underline">
              Browse the full lineup from tees to hoodies to hats →
            </Link>
          </p>
        </div>
      </section>

      {/* Design in minutes */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 uppercase">
                Design t-shirts in minutes. <span className="text-brand-600">No experience needed.</span>
              </h2>
              <p className="mt-4 text-lg text-gray-700">
                Create your own shirts and more in our online design studio.
              </p>
              <ul className="mt-8 space-y-4 text-gray-700">
                <li>
                  <strong className="text-gray-900">Add and manipulate text</strong> — Fine-tune and add personality with a few clicks.
                </li>
                <li>
                  <strong className="text-gray-900">Free images or upload your own</strong> — Use our graphics or drop in your logo.
                </li>
                <li>
                  <strong className="text-gray-900">Design amazing color schemes</strong> — Pick from 50+ colors or match your uploads.
                </li>
              </ul>
              <Link
                href="/custom-design/studio"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-lg font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                Go to the Design Studio
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="relative aspect-square max-w-lg mx-auto rounded-xl overflow-hidden border-2 border-brand-500/30 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80"
                alt="Design studio preview"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center uppercase">
            How it works
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            Easily create custom t-shirts, hoodies, polos, hats & more online.
          </p>
          <div className="mt-14 grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto text-brand-600">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-gray-900 text-lg">Design online</h3>
              <p className="mt-2 text-gray-600 text-sm">
                Create your custom shirts in our Design Studio. Choose from clip art and fonts or upload your own images.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto text-brand-600">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-gray-900 text-lg">Expertly printed</h3>
              <p className="mt-2 text-gray-600 text-sm">
                We stand behind every shirt that leaves our facility. Quality you can trust.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto text-brand-600">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-gray-900 text-lg">Delivered to you</h3>
              <p className="mt-2 text-gray-600 text-sm">
                We ship directly to your door so you can focus on what matters.
              </p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/custom-design/studio"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-lg font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Get started
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Get in touch (existing form) */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-200">
        <div className="container-custom max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Need a full custom design project?</h2>
          <p className="text-slate-600 mb-8">
            Tell us about your project. We&apos;ll reply within 1–2 business days to discuss what we can do for you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Your name <span className="text-red-500">*</span></label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="input-field" placeholder="Jane Smith" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field" placeholder="jane@company.com" />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="input-field" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">Brand / company name <span className="text-red-500">*</span></label>
              <input id="brand" name="brand" type="text" required value={formData.brand} onChange={handleChange} className="input-field" placeholder="Your brand or organization" />
            </div>
            <div>
              <label htmlFor="whatDoYouSell" className="block text-sm font-medium text-slate-700 mb-1">What do you sell or do? <span className="text-red-500">*</span></label>
              <input id="whatDoYouSell" name="whatDoYouSell" type="text" required value={formData.whatDoYouSell} onChange={handleChange} className="input-field" placeholder="e.g. Youth soccer league, tech conference" />
            </div>
            <div>
              <label htmlFor="designServices" className="block text-sm font-medium text-slate-700 mb-1">What kind of design services? <span className="text-red-500">*</span></label>
              <select id="designServices" name="designServices" required value={formData.designServices} onChange={handleChange} className="input-field">
                <option value="">Select an option</option>
                {DESIGN_SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="projectDetails" className="block text-sm font-medium text-slate-700 mb-1">Tell us about your project <span className="text-red-500">*</span></label>
              <textarea id="projectDetails" name="projectDetails" required rows={5} value={formData.projectDetails} onChange={handleChange} className="input-field resize-y" placeholder="What do you have in mind? Colors, styles, quantities..." />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-1">When do you need this by? <span className="text-red-500">*</span></label>
                <input id="timeline" name="timeline" type="text" required value={formData.timeline} onChange={handleChange} className="input-field" placeholder="e.g. 4 weeks, flexible" />
              </div>
              <div>
                <label htmlFor="quantityEstimate" className="block text-sm font-medium text-slate-700 mb-1">Quantity estimate (optional)</label>
                <input id="quantityEstimate" name="quantityEstimate" type="text" value={formData.quantityEstimate} onChange={handleChange} className="input-field" placeholder="e.g. 50 pieces" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto disabled:opacity-50">
              {isSubmitting ? "Sending…" : "Submit request"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
