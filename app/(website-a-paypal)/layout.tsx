/**
 * Website A PayPal checkout: no site chrome (navbar, footer, shipping strip).
 * URL stays /checkout/paypal — merged with (site)/checkout via parallel route groups.
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
