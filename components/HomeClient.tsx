"use client";

import Image from "next/image";
import Link from "next/link";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import Accordion from "@/components/Accordion";
import StructuredData from "@/components/StructuredData";
import { useEffect } from "react";
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

export default function HomeClient({ featuredProducts }: HomeClientProps) {
  const pathname = usePathname();

  // Track page view
  useEffect(() => {
    if (pathname) {
      trackPageView(window.location.href, 'Home - Purgo Style', {
        page_type: 'home',
        page_section: 'landing',
      });
      
      // Track featured products list view
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
            src="/hero_final.png"
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

        {/* Review Links - Desktop */}
        <div className="absolute bottom-44 right-8 hidden lg:flex flex-col items-end gap-3 z-20 scroll-animate opacity-0" data-direction="slide-left">
          <a 
            href="https://www.trustpilot.com/review/purgolabs.com?_gl=1*1k1z474*_gcl_au*Mzc5MTg1MDI3LjE3NjgzNjcyMDQ.*_ga*NzU2NDk1NTYuMTc2ODM2NzIxNg..*_ga_11HBWMC274*czE3NjgzNjcyMTUkbzEkZzEkdDE3NjgzNjcyNzAkajUkbDAkaDA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-gray-900 rounded-xl px-5 py-2 border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-3 shadow-xl"
          >
            <span className="text-black text-sm font-semibold">Review us on</span>
            <Image 
              src="/trustpilotfinal.png" 
              alt="Trustpilot" 
              width={80}
              height={24}
              className="h-6 w-auto"
            />
          </a>
          
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
          <Link href="/lab-reports" className="bg-white text-gray-900 rounded-xl px-5 py-4 border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 text-sm font-semibold">[View Lab Reports]</p>
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
          {/* Reviews - Mobile Only */}
          <div className="flex flex-row items-center justify-center gap-3 mb-8 lg:hidden">
            <a 
              href="https://www.trustpilot.com/review/purgolabs.com?_gl=1*1k1z474*_gcl_au*Mzc5MTg1MDI3LjE3NjgzNjcyMDQ.*_ga*NzU2NDk1NTYuMTc2ODM2NzIxNg..*_ga_11HBWMC274*czE3NjgzNjcyMTUkbzEkZzEkdDE3NjgzNjcyNzAkajUkbDAkaDA" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-gray-900 rounded-xl px-3 py-2 border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-2 shadow-xl"
            >
              <span className="text-black text-xs font-semibold">Review us on</span>
              <Image 
                src="/trustpilotfinal.png" 
                alt="Trustpilot" 
                width={64}
                height={16}
                className="h-4 w-auto"
              />
            </a>
            
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
              Our most popular research peptides, rigorously tested for purity
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
                Welcome to <span className="gradient-text">Purgo Labs</span>
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Your trusted source for premium-quality, <span className="text-cyan-600 font-semibold">lab-tested peptides</span>
              </p>
              <p className="text-gray-600 mb-8">
                We are dedicated to advancing scientific research by providing high-purity, 
                pharmaceutical-grade peptides to research institutions, laboratories, and qualified 
                professionals worldwide. Every product undergoes rigorous third-party testing to ensure 
                the highest standards of quality and consistency.
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
          <Accordion title="Learn More About Research Peptides">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                Research peptides are short chains of amino acids that serve as essential tools in modern scientific research. These synthetic or naturally-derived compounds play crucial roles in understanding biological processes, cellular signaling, and molecular interactions. At Purgo Labs, we provide high-purity research peptides specifically designed for laboratory use, enabling researchers to conduct groundbreaking studies in various fields of science.
              </p>
              <p className="mb-4">
                Research peptides function by interacting with specific receptors, enzymes, and cellular pathways. They can mimic natural biological compounds, block receptor sites, or enhance cellular processes. This versatility makes them invaluable for studying complex biological systems, from tissue repair mechanisms to metabolic pathways and hormone signaling.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Types of Research Peptides</h3>
              <p className="mb-4">
                Research peptides can be categorized into several types based on their structure and function. Receptor agonists activate specific receptors, mimicking natural ligands to study cellular responses. Hormone analogs replicate the structure and function of natural hormones, allowing researchers to investigate endocrine systems. Growth factor compounds stimulate cell growth and differentiation, essential for tissue culture and regenerative medicine research. Antioxidant compounds help researchers understand oxidative stress and cellular protection mechanisms.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Applications in Laboratory Research</h3>
              <p className="mb-4">
                Research peptides have diverse applications across multiple scientific disciplines. In tissue repair research, peptides like BPC-157 are studied for their potential role in wound healing and tissue regeneration. Metabolic research utilizes peptides such as tirzepatide and retatrutide to investigate glucose metabolism, insulin signaling, and energy balance. Hormone research employs analogs like tesamorelin to study growth hormone pathways and endocrine function.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Safety and Handling Guidelines</h3>
              <p className="mb-4">
                Proper handling of research peptides is essential for maintaining their integrity and ensuring laboratory safety. All research peptides should be handled in a controlled laboratory environment by qualified researchers. Personal protective equipment, including gloves and lab coats, should be worn when handling these compounds. Work surfaces should be decontaminated after use, and all materials should be disposed of according to laboratory waste protocols.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Storage Requirements</h3>
              <p className="mb-4">
                Research peptides are typically supplied as lyophilized (freeze-dried) powders that require proper storage to maintain stability. Unreconstituted peptides should be stored at temperatures between 2-8°C for short-term storage or at -20°C for long-term preservation. Once reconstituted, peptides should be aliquoted to avoid repeated freeze-thaw cycles and stored at -20°C. Proper storage ensures peptide stability and maintains research integrity.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Legal Considerations - Research Use Only</h3>
              <p className="mb-4">
                All products from Purgo Labs are sold strictly for Research Use Only (RUO). These compounds are intended exclusively for laboratory research, analytical testing, and scientific investigation. They are not approved for human consumption, veterinary use, or any therapeutic applications. Researchers must comply with all applicable local, state, and federal regulations regarding the purchase, storage, and use of research compounds. It is the responsibility of the purchaser to ensure compliance with all relevant laws and regulations.
              </p>
            </div>
          </Accordion>

          <Accordion title="Research Applications & Use Cases">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                Research peptides serve as powerful tools across numerous scientific disciplines, enabling researchers to investigate complex biological processes and develop new understanding of cellular mechanisms. The applications of research peptides span from basic science to applied research, contributing to advances in medicine, biology, and biotechnology.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Tissue Repair and Wound Healing Research</h3>
              <p className="mb-4">
                Peptides like BPC-157 are extensively studied for their potential role in tissue repair and wound healing mechanisms. Researchers investigate how these compounds influence angiogenesis, fibroblast migration, and extracellular matrix formation. Studies focus on understanding the molecular pathways involved in tissue regeneration, which may contribute to future therapeutic developments in regenerative medicine.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Metabolic Pathway Studies</h3>
              <p className="mb-4">
                Metabolic research utilizes peptides such as tirzepatide and retatrutide to study glucose metabolism, insulin signaling, and energy balance. These dual and triple agonist peptides allow researchers to investigate how multiple receptor pathways interact to regulate metabolic processes. Research in this area contributes to understanding metabolic diseases and potential therapeutic approaches.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Hormone Receptor Research</h3>
              <p className="mb-4">
                Hormone analogs like tesamorelin enable researchers to study growth hormone releasing hormone (GHRH) pathways and their effects on various physiological processes. These studies investigate hormone-receptor interactions, signal transduction mechanisms, and downstream cellular responses. Such research contributes to understanding endocrine function and hormone-related conditions.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Cellular Signaling Research</h3>
              <p className="mb-4">
                Research peptides are essential tools for studying cellular signaling pathways. Peptides like IGF-1 LR3 allow researchers to investigate growth factor signaling, including PI3K/Akt and MAPK pathways. These studies help understand how cells respond to external signals and regulate processes such as growth, differentiation, and survival.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Antioxidant Research</h3>
              <p className="mb-4">
                Antioxidant compounds like glutathione are studied to understand oxidative stress mechanisms and cellular protection systems. Researchers investigate how these compounds neutralize reactive oxygen species, maintain cellular redox balance, and protect against oxidative damage. This research contributes to understanding aging, disease processes, and cellular health.
              </p>
            </div>
          </Accordion>

          <Accordion title="Our Quality Standards & Testing">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4">
                At Purgo Labs, quality is our highest priority. Every product undergoes rigorous testing and verification to ensure the highest standards of purity, potency, and consistency. Our comprehensive quality assurance process includes multiple analytical techniques and independent third-party verification.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">HPLC Verification Process</h3>
              <p className="mb-4">
                High-Performance Liquid Chromatography (HPLC) is a primary analytical method used to verify peptide purity and identity. This technique separates and quantifies peptide components, allowing us to confirm that each product meets our strict purity standards. HPLC analysis provides detailed information about peptide composition, identifying any impurities or degradation products that may be present.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Mass Spectrometry Analysis</h3>
              <p className="mb-4">
                Mass spectrometry provides definitive confirmation of peptide identity and molecular weight. This analytical technique allows us to verify that each peptide matches its expected structure and molecular composition. Mass spectrometry analysis ensures that products are correctly synthesized and free from structural modifications or contaminants.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Certificate of Analysis (COA)</h3>
              <p className="mb-4">
                Every product from Purgo Labs comes with a Certificate of Analysis (COA) that documents the analytical testing results. The COA includes information about purity percentage, molecular weight verification, and analytical method used. This documentation provides researchers with complete transparency about product quality and allows for verification of product specifications.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Purity Standards</h3>
              <p className="mb-4">
                We maintain strict purity standards for all our research peptides, typically requiring 99% or greater purity for most products. This high level of purity ensures that research results are not compromised by impurities or contaminants. Our quality control processes are designed to consistently meet or exceed these standards across all product batches.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Storage and Handling Protocols</h3>
              <p className="mb-4">
                Proper storage and handling are essential for maintaining product quality. All products are stored under controlled conditions that preserve stability and prevent degradation. We provide detailed storage instructions with each product to ensure researchers can maintain optimal conditions throughout the product lifecycle.
              </p>
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Batch Testing Procedures</h3>
              <p className="mb-4">
                Every production batch undergoes comprehensive testing before release. Our batch testing procedures include identity confirmation, purity analysis, and stability testing. This rigorous approach ensures that every product meets our quality standards and provides consistent results for researchers.
              </p>
            </div>
          </Accordion>

          <Accordion title="Frequently Asked Questions">
            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What are research peptides?</h3>
                <p className="text-gray-700">
                  Research peptides are short chains of amino acids used in laboratory research to study biological processes, cellular signaling, and molecular interactions. They are synthetic or naturally-derived compounds designed for scientific investigation and are not intended for human or veterinary use.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">How should research peptides be stored?</h3>
                <p className="text-gray-700">
                  Unreconstituted lyophilized peptides should be stored at 2-8°C for short-term storage or -20°C for long-term preservation. Once reconstituted, peptides should be aliquoted and stored at -20°C to avoid repeated freeze-thaw cycles. Always follow the specific storage instructions provided with each product.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What is a Certificate of Analysis (COA)?</h3>
                <p className="text-gray-700">
                  A Certificate of Analysis is a document that provides detailed information about the analytical testing performed on a specific product batch. It includes purity percentage, molecular weight verification, and the analytical methods used. COAs are available for all Purgo Labs products.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">How do I reconstitute research peptides?</h3>
                <p className="text-gray-700">
                  Research peptides are typically reconstituted using bacteriostatic water (BAC water) or sterile diluent. The specific reconstitution protocol depends on the peptide and should be followed according to the product instructions. Generally, peptides are reconstituted at concentrations appropriate for the intended research application.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What is the purity of your peptides?</h3>
                <p className="text-gray-700">
                  Most Purgo Labs peptides have a purity of 99% or greater, as verified by HPLC and mass spectrometry analysis. The exact purity percentage for each product is documented in the Certificate of Analysis provided with each purchase.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Are your products tested by third-party laboratories?</h3>
                <p className="text-gray-700">
                  Yes, all products undergo rigorous third-party testing using HPLC and mass spectrometry to verify purity, identity, and quality. These independent tests ensure that our products meet the highest standards for research use.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What does Research Use Only (RUO) mean?</h3>
                <p className="text-gray-700">
                  Research Use Only means that products are intended exclusively for laboratory research, analytical testing, and scientific investigation. They are not approved for human consumption, veterinary use, or therapeutic applications. Researchers must comply with all applicable regulations.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">How long do peptides remain stable?</h3>
                <p className="text-gray-700">
                  Lyophilized peptides, when stored properly at -20°C, can remain stable for 24-36 months. Once reconstituted, peptides should be used promptly or stored at -20°C in aliquots to maintain stability. Always refer to the specific product documentation for stability information.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What shipping methods do you offer?</h3>
                <p className="text-gray-700">
                  We offer various shipping options with full tracking capabilities. Orders are typically processed within 24 hours. Shipping methods and estimated delivery times are available during checkout. All products are shipped in temperature-controlled packaging when necessary.
                </p>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Can I request additional testing or documentation?</h3>
                <p className="text-gray-700">
                  Yes, researchers can request additional analytical data or documentation for specific research needs. Please contact our support team to discuss your requirements. We're committed to supporting your research with comprehensive product information.
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
          name: "Purgo Labs",
          legalName: "PurgoLabs LLC",
          url: "https://www.purgolabs.com",
          logo: "https://www.purgolabs.com/logo.png",
          description: "Premium-quality, lab-tested research peptides for laboratory applications. Buy research peptides online with 99%+ purity verification.",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            email: "support@purgolabs.com",
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
          "@id": "https://www.purgolabs.com",
          name: "Purgo Labs",
          legalName: "PurgoLabs LLC",
          image: "https://www.purgolabs.com/logo.png",
          url: "https://www.purgolabs.com",
          email: "support@purgolabs.com",
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "09:00",
              closes: "17:00",
            },
          ],
          priceRange: "$$",
          servesCuisine: "Research Peptides",
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
          name: "Purgo Labs",
          url: "https://www.purgolabs.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.purgolabs.com/products?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* Main site navigation - helps search engines understand key links (e.g. for sitelinks) */}
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Buy Peptides", url: "https://www.purgolabs.com/products" },
            { "@type": "ListItem", position: 2, name: "About", url: "https://www.purgolabs.com/about" },
            { "@type": "ListItem", position: 3, name: "Contact", url: "https://www.purgolabs.com/contact" },
            { "@type": "ListItem", position: 4, name: "Research", url: "https://www.purgolabs.com/research" },
            { "@type": "ListItem", position: 5, name: "Blog", url: "https://www.purgolabs.com/blog" },
          ],
        }}
      />
    </div>
  );
}
