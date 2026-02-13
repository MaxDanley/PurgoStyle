"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaEnvelope, FaClock, FaQuestionCircle, FaShippingFast } from "react-icons/fa";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Scroll-based animations (similar to home/about)
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -60px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("opacity-0");
          entry.target.classList.add("opacity-100");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Intro */}
      <section
        className="relative overflow-hidden py-16 md:py-20 scroll-animate opacity-0 transition-all duration-700"
        data-direction="fade-in"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-slate-50" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="container-custom relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_minmax(0,_0.9fr)] items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Contact <span className="gradient-text">Summer Steeze</span>
              </h1>
              <p className="mt-4 text-lg text-slate-700 max-w-xl">
                Have a question about an order, sizing, or our tees? Our support team is here to help
                with orders, returns, and anything about our activewear and premium apparel.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-xl">
                <div className="glass rounded-2xl p-4 border border-brand-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Primary contact
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-800">
                    <FaEnvelope className="h-4 w-4 text-brand-600" />
                    <span>hello@summersteeze.com</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    For orders, sizing, and general inquiries.
                  </p>
                </div>
                <div className="glass rounded-2xl p-4 border border-brand-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Business hours
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-800">
                    <FaClock className="h-4 w-4 text-brand-600" />
                    <span>Mon–Fri, 9:00 AM – 5:00 PM EST</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Messages received outside of hours are answered next business day.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-brand-400/40 via-blue-500/30 to-slate-900 blur-xl opacity-60" />
                <div className="relative glass rounded-3xl border border-brand-100/70 p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                        Real support
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Get answers about your order and our tees.
                      </p>
                    </div>
                    <Image
                      src="/STEEZ.png"
                      alt="Summer Steeze"
                      width={40}
                      height={40}
                      className="rounded-full border border-brand-100 bg-white shadow-md"
                    />
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-900/95 p-4 text-left text-sm text-slate-100">
                    <p className="font-semibold text-brand-300">Response expectations</p>
                    <p className="mt-2 text-xs text-slate-300">
                      We typically respond within one business day. For order questions, include your
                      order number so we can help you quickly.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Order status &amp; tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Sizing &amp; care questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Wholesale &amp; bulk orders</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                      <a
                        href="https://www.facebook.com/profile.php?id=61587658187619"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
                        aria-label="Follow Summer Steeze on Facebook"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Follow us on Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact cards & quick links */}
      <section
        className="py-14 md:py-16 bg-gray-50 scroll-animate opacity-0 transition-all duration-700"
        data-direction="slide-up"
      >
        <div className="container-custom">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,_1.15fr)_minmax(0,_0.85fr)] items-start">
            {/* Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <FaEnvelope className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Support &amp; orders</h2>
                </div>
                <p className="text-sm text-slate-600">
                  For order questions, tracking, or issues with your order.
                </p>
                <p className="mt-2 text-sm font-mono text-slate-800">
                  hello@summersteeze.com
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <FaQuestionCircle className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Sizing &amp; care</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Sizing, fabric, care instructions, or product questions.
                </p>
                <p className="mt-2 text-sm font-mono text-slate-800">
                  hello@summersteeze.com
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <FaShippingFast className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Shipping &amp; logistics</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Questions about shipping, delivery times, or tracking.
                </p>
                <Link
                  href="/shipping"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600"
                >
                  View shipping info
                  <span aria-hidden>↗</span>
                </Link>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <FaQuestionCircle className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">FAQ &amp; policies</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Sizing, orders, returns, and shipping.
                </p>
                <div className="mt-2 flex flex-col gap-1 text-xs font-semibold text-brand-700">
                  <Link href="/faq" className="hover:text-brand-600">
                    → Frequently Asked Questions
                  </Link>
                  <Link href="/returns" className="hover:text-brand-600">
                    → Returns &amp; refunds
                  </Link>
                  <Link href="/disclaimer" className="hover:text-brand-600">
                    → Terms &amp; disclaimer
                  </Link>
                </div>
              </div>
            </div>

            {/* Message form */}
            <div
              className="card p-8 md:p-9 scroll-animate opacity-0 transition-all duration-700"
              data-direction="slide-left"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a message</h2>
              <p className="text-sm text-slate-600 mb-6">
                Include your order number and product name if your question is about an order, so we
                can help you quickly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input-field"
                    placeholder="Order #, product, or topic"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-field"
                    placeholder="Your message—include order number if asking about an order."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full md:w-auto"
                >
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-500">
                We’ll get back to you within one business day. For order issues, include your order number.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


