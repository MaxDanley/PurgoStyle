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
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-slate-50" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="container-custom relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_minmax(0,_0.9fr)] items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Contact <span className="gradient-text">Purgo Style Labs</span>
              </h1>
              <p className="mt-4 text-lg text-slate-700 max-w-xl">
                Have a question about an order, documentation, or partnering with us? Our support
                team is built for research operations, not generic ticket queues.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-xl">
                <div className="glass rounded-2xl p-4 border border-cyan-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Primary contact
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-800">
                    <FaEnvelope className="h-4 w-4 text-cyan-600" />
                    <span>support@purgostyle.com</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    For orders, documentation, and business inquiries.
                  </p>
                </div>
                <div className="glass rounded-2xl p-4 border border-cyan-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Business hours
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-800">
                    <FaClock className="h-4 w-4 text-cyan-600" />
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
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-cyan-400/40 via-blue-500/30 to-slate-900 blur-xl opacity-60" />
                <div className="relative glass rounded-3xl border border-cyan-100/70 p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                        Lab-grade support
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Get answers that understand your workflows.
                      </p>
                    </div>
                    <Image
                      src="/logo-small-copy.png"
                      alt="Purgo Style Labs"
                      width={40}
                      height={40}
                      className="rounded-full border border-cyan-100 bg-white shadow-md"
                    />
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-900/95 p-4 text-left text-sm text-slate-100">
                    <p className="font-semibold text-cyan-300">Response expectations</p>
                    <p className="mt-2 text-xs text-slate-300">
                      We typically respond within one business day. For order‑critical or time‑
                      sensitive research questions, include your order number and project phase so
                      we can prioritize accordingly.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Order status &amp; tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>COA &amp; documentation requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Bulk &amp; recurring supply discussions</span>
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
                  <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                    <FaEnvelope className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Support &amp; orders</h2>
                </div>
                <p className="text-sm text-slate-600">
                  For order questions, tracking, or issues with received materials.
                </p>
                <p className="mt-2 text-sm font-mono text-slate-800">
                  support@purgostyle.com
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                    <FaQuestionCircle className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Technical questions</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Clarifications on documentation, COAs, or research‑use restrictions.
                </p>
                <p className="mt-2 text-sm font-mono text-slate-800">
                  support@purgostyle.com
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                    <FaShippingFast className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Shipping &amp; logistics</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Questions about carriers, transit times, or special handling needs.
                </p>
                <Link
                  href="/shipping"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 hover:text-cyan-600"
                >
                  View shipping info
                  <span aria-hidden>↗</span>
                </Link>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                    <FaQuestionCircle className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">FAQ &amp; policies</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Start here for common questions on orders, returns, and research‑only use.
                </p>
                <div className="mt-2 flex flex-col gap-1 text-xs font-semibold text-cyan-700">
                  <Link href="/faq" className="hover:text-cyan-600">
                    → Frequently Asked Questions
                  </Link>
                  <Link href="/returns" className="hover:text-cyan-600">
                    → Returns &amp; refunds
                  </Link>
                  <Link href="/disclaimer" className="hover:text-cyan-600">
                    → Research disclaimer
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
                Share as much context as you can (order number, product, research context) so we
                can route your request to the right person on the first reply.
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
                      placeholder="Dr. Jane Doe"
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
                      placeholder="you@institution.edu"
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
                    placeholder="Share details on your question, including any relevant order numbers or research context."
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
                By submitting this form, you confirm that your inquiry relates to laboratory or
                scientific research. We do not provide guidance on human or animal use.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


