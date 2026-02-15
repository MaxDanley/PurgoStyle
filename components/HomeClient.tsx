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
import { SECONDARY_PICTURES_FOR_HOME } from "@/lib/products";

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
      trackPageView(window.location.href, 'Home - Summer Steeze', {
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
      {/* Hero Section - Centered layout like reference */}
      <section className="relative w-full overflow-hidden min-h-[55vh] md:min-h-[65vh] lg:min-h-[70vh]">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_image.png"
            alt="Summer Steeze"
            fill
            className="object-cover"
            priority
            quality={95}
            sizes="100vw"
          />
          {/* Gradient overlay: darker at top for contrast */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/40"
            aria-hidden
          />
        </div>

        {/* Centered content at bottom */}
        <div className="relative z-10 flex flex-col items-center justify-end min-h-[55vh] md:min-h-[65vh] lg:min-h-[70vh] pb-16 md:pb-24 pt-24 px-4 text-center">
          <span
            className="text-white text-xs md:text-sm uppercase tracking-[0.25em] md:tracking-[0.35em] font-medium mb-2"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
          >
            Arizona activewear
          </span>
          <h1
            className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white uppercase tracking-tight ${archivoBlack.className}`}
            style={{
              textShadow: "0 2px 24px rgba(0,0,0,0.4), 0 0 48px rgba(0,0,0,0.2)",
            }}
          >
            Summer Steeze
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
            <Link
              href="/products"
              onClick={() => {
                trackEvent("cta_click", {
                  cta_text: "Shop Now",
                  cta_location: "hero",
                  page_type: "home",
                });
              }}
              className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/40 hover:bg-white/30 text-white px-8 py-3.5 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors"
              aria-label="Shop now"
            >
              Shop Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/40 hover:bg-white/30 text-white px-8 py-3.5 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors"
              aria-label="Our story"
            >
              View Story
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="pt-4 md:pt-20 pb-20 relative scroll-animate opacity-0" data-direction="fade-in">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #f27e56 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-16">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">Premium Quality</span>
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
              <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Premium Quality
              </h3>
              <p className="text-gray-600">
                Quality fabrics and construction you can trust
              </p>
            </div>

            <div className="text-center group scroll-animate opacity-0" data-direction="zoom-in">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-500/50">
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
              <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-500/50">
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

      {/* Triple secondary pictures - full width, 3 columns */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {SECONDARY_PICTURES_FOR_HOME.map((src, i) => (
            <div key={i} className="relative aspect-[4/5] md:aspect-[3/4]">
              <Image
                src={src}
                alt="Summer Steeze apparel"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 scroll-animate opacity-0" data-direction="zoom-in">
        <div className="container-custom">
          <div className="glass rounded-3xl p-12 md:p-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Welcome to <span className="gradient-text">Summer Steeze</span>
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Your trusted source for <span className="text-brand-600 font-semibold">Arizona activewear & premium tees</span>
              </p>
              <p className="text-gray-600 mb-8">
                We are dedicated to quality apparel—premium tees, sweatshirts, and activewear. 
                Quality you can feel. Every piece is made with care for 
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
          <Accordion title="Learn More About Summer Steeze">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                Summer Steeze is an Arizona-based activewear and apparel brand. We focus on quality you can feel in every tee, sweatshirt, and piece of activewear we make.
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
          name: "Summer Steeze",
          legalName: "Summer Steeze",
          url: "https://www.summersteez.com",
          logo: "https://www.summersteez.com/STEEZ.png",
          description: "Summer Steeze – Arizona activewear and premium tees. Quality you can feel.",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            email: "hello@summersteez.com",
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
            "https://www.instagram.com/summersteez/",
            "https://x.com/SummerSteeze",
            "https://www.facebook.com/profile.php?id=61588015956175",
          ],
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://www.summersteez.com",
          name: "Summer Steeze",
          legalName: "Summer Steeze",
          image: "https://www.summersteez.com/STEEZ.png",
          url: "https://www.summersteez.com",
          email: "hello@summersteez.com",
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
          name: "Summer Steeze",
          url: "https://www.summersteez.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.summersteez.com/products?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Products", url: "https://www.summersteez.com/products" },
            { "@type": "ListItem", position: 2, name: "About", url: "https://www.summersteez.com/about" },
            { "@type": "ListItem", position: 3, name: "Contact", url: "https://www.summersteez.com/contact" },
            { "@type": "ListItem", position: 4, name: "Blog", url: "https://www.summersteez.com/blog" },
          ],
        }}
      />
    </div>
  );
}
