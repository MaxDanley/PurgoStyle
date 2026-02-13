"use client";

import Image from "next/image";
import Link from "next/link";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import Accordion from "@/components/Accordion";
import StructuredData from "@/components/StructuredData";
import { useEffect, useState } from "react";
import { trackPageView, trackViewItemList, trackEvent } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { Archivo_Black } from 'next/font/google';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface HomeClientProps {
  featuredProducts: any[];
}

export default function HomeClient({ featuredProducts: initialProducts }: HomeClientProps) {
  const pathname = usePathname();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>(initialProducts);

  // Fetch featured products client-side so server never needs DB for /
  useEffect(() => {
    if (initialProducts.length > 0) return;
    fetch("/api/products")
      .then((res) => res.ok ? res.json() : { products: [] })
      .then((data) => {
        const list = data.products || [];
        const featured = list.filter((p: any) => p.featured).slice(0, 6);
        setFeaturedProducts(featured);
      })
      .catch(() => setFeaturedProducts([]));
  }, [initialProducts.length]);

  // Track page view
  useEffect(() => {
    if (pathname) {
      trackPageView(window.location.href, 'Home - Purgo Style', {
        page_type: 'home',
        page_section: 'landing',
      });
      if (featuredProducts.length > 0) {
        trackViewItemList(
          featuredProducts.map(p => ({
            itemId: p.id,
            itemName: p.name,
            itemCategory: p.category,
            price: p.variants[0]?.price || 0,
          })),
          'Featured Products'
        );
      }
    }
  }, [pathname, featuredProducts]);

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0');
          entry.target.classList.add('opacity-100');
        }
      });
    }, observerOptions);

    // Observe all scroll-animate elements
    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        {/* Hero Background Image - Full Width, Scaled Down */}
        <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[65vh] z-0">
          <Image
            src="/hero_image.png"
            alt="Purgo Style"
            fill
            className="object-cover"
            priority
            quality={95}
            sizes="100vw"
          />
        </div>

        <div className="container-custom relative z-10 -mt-[50vh] md:-mt-[60vh] lg:-mt-[65vh] pt-16 md:pt-32 pb-20 md:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-start">
            {/* Left Content - Upper Left Aligned */}
            <div className="text-left space-y-6 md:space-y-8 max-w-lg relative z-20">
              <h1 className={`text-6xl md:text-8xl font-bold leading-tight ${archivoBlack.className}`}>
                <span className="block">
                  <span className="inline-block md:inline">
                  <span 
                      className="inline-block animate-[slideUp_0.8s_ease-out] px-2 py-1 md:px-0 md:py-0 bg-white/70 backdrop-blur-md rounded-full md:bg-transparent md:backdrop-blur-none"
                    style={{ 
                      color: '#3aaff9',
                      fontStyle: 'italic',
                      animation: 'slideUp 0.8s ease-out forwards'
                    }}
                  >
                    Purgo
                  </span>
                    <span className="inline-block px-2 py-1 md:px-0 md:py-0 bg-white/70 backdrop-blur-md rounded-full md:bg-transparent md:backdrop-blur-none text-black">Style</span>
                  </span>
                </span>
                <span className="block text-black text-2xl md:text-3xl font-normal mt-4">
                  <span className="inline-block px-2 py-1 md:px-0 md:py-0 bg-white/70 backdrop-blur-md rounded-full md:bg-transparent md:backdrop-blur-none">Arizona activewear & premium tees</span>
                </span>
              </h1>

              <div>
                <Link 
                  href="/products" 
                  className="inline-flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-cyan-500/25"
                  onClick={() => {
                    trackEvent('cta_click', {
                      cta_text: 'Shop Now',
                      cta_location: 'hero',
                      page_type: 'home',
                    });
                  }}
                  aria-label="Shop"
                >
                  Shop Now
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Promo Banner - Bottom Left */}
              <div>
                <Link
                  href="/products"
                  className="inline-block bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-6 py-3 shadow-md hover:bg-black/50 transition-colors"
                >
                  <p className="text-white text-sm font-medium">Shop now</p>
                </Link>
              </div>
            </div>

            {/* Spacer column for layout on desktop */}
            <div className="hidden lg:block" aria-hidden="true"></div>
          </div>
        </div>

        {/* Review Link - Desktop (Google only) */}
        <div className="absolute bottom-44 right-8 hidden lg:flex flex-col items-end gap-3 z-20 scroll-animate opacity-0" data-direction="slide-left">
          <a 
            href="https://share.google/kCQYHyMGyamt5M1yj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-gray-900 rounded-xl px-5 py-2 border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-3 shadow-xl"
          >
            <Image 
              src="/Google-Review-Emblem.png" 
              alt="Google Reviews" 
              width={100}
              height={32}
              className="h-8 w-auto"
            />
          </a>
        </div>

        {/* View Lab Reports - Bottom Right (white card like reference) */}
        <div className="absolute bottom-24 right-8 hidden lg:block z-20 scroll-animate opacity-0" data-direction="slide-left">
          <Link href="/products" className="bg-white text-gray-900 rounded-xl px-5 py-4 border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 text-sm font-semibold">View Products</p>
              <p className="text-gray-600 text-xs mt-1">All products undergo rigorous third-party lab testing for purity, potency, and safety</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="pt-4 md:pt-20 pb-20 relative scroll-animate opacity-0" data-direction="fade-in">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="container-custom relative z-10">
          {/* Reviews - Mobile Only (Google only) */}
          <div className="flex flex-row items-center justify-center gap-3 mb-8 lg:hidden">
            <a 
              href="https://share.google/kCQYHyMGyamt5M1yj" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-gray-900 rounded-xl px-3 py-2 border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-2 shadow-xl"
            >
              <Image 
                src="/Google-Review-Emblem.png" 
                alt="Google Reviews" 
                width={72}
                height={24}
                className="h-6 w-auto"
              />
            </a>
          </div>
          
          <div className="text-center mb-16">
            <span className="text-cyan-600 font-semibold text-sm uppercase tracking-wider">Premium Quality</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our most popular products, made with quality you can feel
            </p>
          </div>
          
          <div className="mb-12">
            {featuredProducts.length > 0 ? (
              <FeaturedProductsCarousel products={featuredProducts} />
            ) : (
              <p className="text-center text-gray-500">No featured products available</p>
            )}
          </div>

          <div className="text-center">
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              View All Products
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50 scroll-animate opacity-0" data-direction="slide-up">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="text-center group scroll-animate opacity-0" data-direction="slide-left">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                99%+ Purity
              </h3>
              <p className="text-gray-600">
                Every batch is third-party tested using HPLC and mass spectrometry
              </p>
            </div>

            <div className="text-center group scroll-animate opacity-0" data-direction="zoom-in">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Fast Shipping
              </h3>
              <p className="text-gray-600">
                Orders processed within 24 hours with full tracking capabilities
              </p>
            </div>

            <div className="text-center group scroll-animate opacity-0" data-direction="slide-right">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Secure Payments
              </h3>
              <p className="text-gray-600">
                Secure checkout with multiple payment options
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 scroll-animate opacity-0" data-direction="zoom-in">
        <div className="container-custom">
          <div className="glass rounded-3xl p-12 md:p-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Welcome to <span className="gradient-text">Purgo Style Labs</span>
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Your trusted source for <span className="text-cyan-600 font-semibold">Arizona activewear & premium tees</span>
              </p>
              <p className="text-gray-600 mb-8">
                We are dedicated to quality apparel—premium tees, sweatshirts, and activewear. 
                Latin for purify: quality you can feel. Every piece is made with care for 
                style and comfort.
              </p>
              <Link href="/about" className="btn-secondary inline-flex items-center gap-2">
                Learn More About Us
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Sections - Expandable */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <Accordion title="Learn More About Purgo Style Labs">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                Purgo Style Labs is an Arizona-based activewear and apparel brand. Our name comes from the Latin word for purify—we focus on quality you can feel in every tee, sweatshirt, and piece of activewear we make.
              </p>
              <p className="mb-4">
                We believe in simple, well-made clothing that holds up to your lifestyle. Every product is designed with attention to fit, fabric, and durability so you get pieces you’ll actually want to wear again and again.
              </p>
            </div>
          </Accordion>

          <Accordion title="Frequently Asked Questions">
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What shipping methods do you offer?</h3>
                <p className="text-gray-700">
                  We offer various shipping options with full tracking. Orders are typically processed within 24 hours. Shipping methods and estimated delivery times are available during checkout.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">How can I contact support?</h3>
                <p className="text-gray-700">
                  Reach out via our contact page or email support. We’re happy to help with orders, sizing, or any questions about our products.
                </p>
              </div>
            </div>
          </Accordion>
        </div>
      </section>

      {/* Show popup when button is clicked */}

      {/* Structured Data */}
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Purgo Style Labs",
          legalName: "Purgo Style Labs",
          url: "https://www.purgostyle.com",
          logo: "https://www.purgostyle.com/logo-small-copy.png",
          description: "Purgo Style Labs – Arizona activewear and premium tees. Quality you can feel.",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            email: "support@purgostyle.com",
            availableLanguage: "English",
            areaServed: "US",
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "09:00",
            closes: "17:00",
            timeZone: "America/Phoenix",
          },
          sameAs: [
            "https://www.instagram.com/purgo_labs/",
            "https://x.com/PurgoLabs",
            "https://www.facebook.com/profile.php?id=61586220091066",
          ],
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://www.purgostyle.com",
          name: "Purgo Style Labs",
          legalName: "Purgo Style Labs",
          image: "https://www.purgostyle.com/logo-small-copy.png",
          url: "https://www.purgostyle.com",
          email: "support@purgostyle.com",
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "09:00",
              closes: "17:00",
            },
          ],
          priceRange: "$$",
          areaServed: {
            "@type": "Country",
            name: "United States",
          },
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Purgo Style Labs",
          url: "https://www.purgostyle.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.purgostyle.com/products?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Products", url: "https://www.purgostyle.com/products" },
            { "@type": "ListItem", position: 2, name: "About", url: "https://www.purgostyle.com/about" },
            { "@type": "ListItem", position: 3, name: "Contact", url: "https://www.purgostyle.com/contact" },
            { "@type": "ListItem", position: 4, name: "Blog", url: "https://www.purgostyle.com/blog" },
          ],
        }}
      />
    </div>
  );
}
