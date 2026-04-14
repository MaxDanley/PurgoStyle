/**
 * Website A PayPal checkout: no main site chrome (navbar, footer, shipping strip).
 * Custom Purgo Labs header on /checkout/paypal. URL stays /checkout/paypal.
 */
export default function WebsiteAPayPalShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">{children}</div>
  );
}
