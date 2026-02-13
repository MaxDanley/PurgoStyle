export default function DisclaimerPage() {
  return (
    <div className="py-12">
      <div className="container-custom max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms &amp; Disclaimer</h1>

        <div className="prose prose-lg max-w-none">
          <h2>About Our Products</h2>
          <p>
            Purgo Style Labs sells Arizona activewear, premium tees, sweatshirts, and apparel. Our products
            are intended for personal wear and gifting. We focus on quality fabrics and construction.
          </p>

          <h2>Product Information</h2>
          <p>
            Product photos and descriptions are representative. Slight variations in color or fit may occur.
            Follow care instructions on the label to maintain quality. If you have sizing or care questions,
            contact hello@purgostyle.com.
          </p>

          <h2>Orders &amp; Returns</h2>
          <p>
            By placing an order, you agree to our shipping and return policies. See our Returns page for
            eligibility and instructions. We are not responsible for lost or damaged packages after
            delivery confirmation, or for misuse of products.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about orders, sizing, or our tees, contact hello@purgostyle.com.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
            <p className="text-gray-800 font-semibold">
              By purchasing from Purgo Style Labs, you agree to our Terms of Service and this disclaimer.
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-8">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
