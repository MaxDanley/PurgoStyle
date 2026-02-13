import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 border-t border-gray-200">
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Image src="/logo-small-copy.png" alt="Purgo Style" width={40} height={40} />
              <div>
                <div className="font-bold text-lg text-gray-900">PURGO STYLE</div>
                <div className="text-xs text-cyan-600">ARIZONA ACTIVEWEAR</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Premium tees and activewear. Purgo—Latin for purify. Quality you can feel.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-cyan-600 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <a href="mailto:support@purgostyle.com" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  support@purgostyle.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Purgo Style. Arizona activewear and premium tees.
        </div>
      </div>
    </footer>
  );
}
