export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping Information</h1>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Policy</h2>
            <p className="text-gray-600 mb-4">
              We ship all orders within 1-2 business days of payment confirmation. 
              Orders are processed Monday through Friday, excluding holidays.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Rates</h2>
            <p className="text-gray-600 mb-4">
              We offer flat-rate shipping via USPS. All shipping rates are the same regardless of your delivery address:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4">
              <li>Free shipping on orders over $200</li>
              <li>Standard Ground shipping: FREE (USPS Priority Mail)</li>
              <li>Priority shipping: $15.00 (USPS Priority Mail)</li>
              <li>Overnight shipping: $50.00 (USPS Priority Mail Express Overnight)</li>
              <li>Shipping insurance: $3.50 (required on all orders)</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Times</h2>
            <ul className="list-disc list-inside text-gray-600 mb-4">
              <li>Standard Ground shipping: 5 business days</li>
              <li>Priority shipping: 2-3 business days</li>
              <li>Overnight shipping: 1-2 business days</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tracking</h2>
            <p className="text-gray-600 mb-4">
              You will receive a tracking number via email once your order ships. 
              You can track your package using the tracking number on the carrier's website.
              We also provide automatic delivery notifications when your package arrives.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">US Only Shipping</h2>
            <p className="text-gray-600 mb-4">
              We currently ship within the United States only. All orders must be delivered 
              to a valid US address. International shipping is not available at this time.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Insurance</h2>
            <p className="text-gray-600 mb-4">
              All orders include $3.50 shipping insurance to protect your package during transit. 
              This insurance covers loss, damage, or theft during shipping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
