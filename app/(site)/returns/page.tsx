export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Returns Policy</h1>
          
          <div className="prose max-w-none">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
              <p className="text-brand-900 font-semibold">
                30-day returns for unworn items. Tags must still be attached.
              </p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligibility</h2>
            <p className="text-gray-600 mb-4">
              You may return most items within 30 days of delivery if they are unworn, unwashed, and still have the original tags attached. Items must be in resalable condition.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">How to Return</h2>
            <p className="text-gray-600 mb-4">
              Contact us at <a href="mailto:hello@summersteez.com" className="text-brand-600 hover:underline">hello@summersteez.com</a> with your order number and reason for return. We’ll send you instructions and a return address. You are responsible for return shipping unless the return is due to our error.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Refunds</h2>
            <p className="text-gray-600 mb-4">
              Once we receive and inspect your return, we’ll process your refund to the original payment method. Refunds may take a few business days to appear.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Damaged or Incorrect Items</h2>
            <p className="text-gray-600 mb-4">
              If you received a damaged or incorrect item, contact us at hello@summersteez.com within 48 hours of delivery with your order number and photos. We’ll arrange a replacement or full refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
