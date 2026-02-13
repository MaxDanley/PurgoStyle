"use client";

import Accordion from "./Accordion";

export default function ProductsPageSEO() {
  return (
    <div className="container-custom py-12 max-w-4xl">
      <Accordion title="Product FAQ">
        <div className="prose prose-lg max-w-none text-gray-700">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">What sizing do you offer?</h3>
            <p className="text-gray-700">
              Product pages list available sizes. If you’re between sizes, we recommend sizing up for a relaxed fit. Check the product description for fit notes.
            </p>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">How long does shipping take?</h3>
            <p className="text-gray-700">
              Orders are typically processed within 24 hours. Shipping methods and delivery estimates are shown at checkout.
            </p>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">What is your return policy?</h3>
            <p className="text-gray-700">
              See our shipping and returns policy for eligibility and how to start a return. Contact support with any questions.
            </p>
          </div>
        </div>
      </Accordion>
    </div>
  );
}
