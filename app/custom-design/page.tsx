"use client";

import { useState } from "react";
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
    } catch {
      toast.error("Something went wrong. Please try again or email help@summersteez.com.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Custom Design <span className="gradient-text">Services</span>
            </h1>
            <p className="mt-6 text-lg text-slate-700">
              We design custom clothing and apparel for sports teams, events, brands, and organizations. From team uniforms and event merchandise to branded workwear and full collections, we work with you to create quality gear that fits your vision.
            </p>
            <ul className="mt-6 space-y-2 text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-brand-500 font-bold">•</span>
                Sports teams & leagues — jerseys, warm-ups, fan gear
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500 font-bold">•</span>
                Events — runs, festivals, conferences, fundraisers
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500 font-bold">•</span>
                Brands & businesses — branded tees, polos, hoodies, workwear
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-500 font-bold">•</span>
                Small runs & samples — development and limited editions
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-custom max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Get in touch</h2>
          <p className="text-slate-600 mb-8">
            Tell us about your project. We&apos;ll reply within 1–2 business days to discuss what we can do for you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Your name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="jane@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">
                Brand / company name <span className="text-red-500">*</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                required
                value={formData.brand}
                onChange={handleChange}
                className="input-field"
                placeholder="Your brand or organization"
              />
            </div>

            <div>
              <label htmlFor="whatDoYouSell" className="block text-sm font-medium text-slate-700 mb-1">
                What do you sell or do? <span className="text-red-500">*</span>
              </label>
              <input
                id="whatDoYouSell"
                name="whatDoYouSell"
                type="text"
                required
                value={formData.whatDoYouSell}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Youth soccer league, tech conference, fitness brand"
              />
            </div>

            <div>
              <label htmlFor="designServices" className="block text-sm font-medium text-slate-700 mb-1">
                What kind of design services are you looking for? <span className="text-red-500">*</span>
              </label>
              <select
                id="designServices"
                name="designServices"
                required
                value={formData.designServices}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select an option</option>
                {DESIGN_SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="projectDetails" className="block text-sm font-medium text-slate-700 mb-1">
                Tell us about your project <span className="text-red-500">*</span>
              </label>
              <textarea
                id="projectDetails"
                name="projectDetails"
                required
                rows={5}
                value={formData.projectDetails}
                onChange={handleChange}
                className="input-field resize-y"
                placeholder="What do you have in mind? Colors, styles, quantities, inspiration..."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 mb-1">
                  When do you need this by? <span className="text-red-500">*</span>
                </label>
                <input
                  id="timeline"
                  name="timeline"
                  type="text"
                  required
                  value={formData.timeline}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 4 weeks, Q2 2025, flexible"
                />
              </div>
              <div>
                <label htmlFor="quantityEstimate" className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity estimate (optional)
                </label>
                <input
                  id="quantityEstimate"
                  name="quantityEstimate"
                  type="text"
                  value={formData.quantityEstimate}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 50 pieces, 200+ units"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending…" : "Submit request"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
