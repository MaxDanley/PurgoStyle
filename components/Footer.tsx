import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 border-t border-gray-200">
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Image src="/STEEZ.png" alt="Summer Steeze" width={40} height={40} />
              <div>
                <div className="font-bold text-lg text-gray-900">SUMMER STEEZE</div>
                <div className="text-xs text-brand-600">ARIZONA ACTIVEWEAR</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Premium tees and activewear. Quality you can feel.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-brand-600 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-brand-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-gray-400 hover:text-brand-400 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-brand-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="text-gray-400 hover:text-brand-400 transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-brand-400 transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-brand-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-brand-400 transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <a href="mailto:hello@summersteeze.com" className="text-gray-400 hover:text-brand-400 transition-colors">
                  hello@summersteeze.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-brand-400 transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-brand-400 transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1 mt-6 md:mt-0">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Follow us</h3>
            <a
              href="https://www.facebook.com/profile.php?id=61588015956175"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-400 transition-colors"
              aria-label="Summer Steeze on Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Summer Steeze. Arizona activewear and premium tees.
        </div>
      </div>
    </footer>
  );
}
