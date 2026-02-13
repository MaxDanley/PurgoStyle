"use client";

import { useState } from "react";

const faqData: { question: string; answer: string }[] = [
  {
    question: "What sizes do you offer?",
    answer: "We offer Small, Medium, and Large for all tees and hoodies. If you're between sizes, we recommend sizing up for a relaxed fit."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for unworn items with tags attached. Items must be in original condition. Contact hello@summersteeze.com to start a return."
  },
  {
    question: "How do I track my order?",
    answer: "After your order ships, you'll receive an email with a tracking number. You can also use the Track Order page and enter your order number and email."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept credit and debit cards through our secure checkout. You'll complete payment on our secure payment page after placing your order."
  },
  {
    question: "How long does shipping take?",
    answer: "We ship within the United States. Standard shipping typically takes 5–7 business days. Faster options may be available at checkout."
  },
  {
    question: "Do you ship internationally?",
    answer: "Currently we ship to addresses within the United States only."
  },
  {
    question: "How do I care for my tee or hoodie?",
    answer: "Machine wash cold with like colors. Tumble dry low or hang dry. Avoid bleach to preserve print and color."
  },
  {
    question: "Where is Summer Steeze based?",
    answer: "We're an Arizona-based activewear and tee brand. We keep our designs and quality straightforward and clean."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
          <div className="space-y-2">
            {faqData.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4 text-gray-600 text-sm">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
