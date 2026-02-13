"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/store";
import { useSession } from "next-auth/react";
import SearchOverlay from "@/components/SearchOverlay";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items } = useCart();
  const { data: session } = useSession();
  const pathname = usePathname();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasNavigatedRef = useRef(false);
  
  // Check if user is admin
  const isAdmin = session && (session.user as any)?.role === "ADMIN";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      return;
    }
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle Mobile Menu Animation
  useEffect(() => {
    const contentWrapper = document.getElementById('page-content-wrapper');
    
    if (isMenuOpen) {
      // Stronger scroll lock
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.backgroundColor = '#0b1726'; // Dark blue background
      
      if (contentWrapper) {
        // Push content left only (no vertical movement)
        // translateX(-65vw) moves it left to reveal nav items on the right
        // scale(0.85) shrinks it slightly
        // transform-origin: center center keeps it centered both horizontally and vertically
        contentWrapper.style.transform = 'scale(0.85) translateX(-65vw) translateY(0)';
        contentWrapper.style.transformOrigin = 'center center';
        contentWrapper.style.borderRadius = '20px';
        contentWrapper.style.overflow = 'hidden';
        contentWrapper.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)';
        contentWrapper.style.opacity = '0.5';
        // Ensure content stays at top of viewport
        contentWrapper.style.marginTop = '0';
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.backgroundColor = '';
      
      if (contentWrapper) {
        contentWrapper.style.transform = '';
        contentWrapper.style.borderRadius = '';
        contentWrapper.style.overflow = '';
        contentWrapper.style.boxShadow = '';
        contentWrapper.style.opacity = '';
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.backgroundColor = '';
      if (contentWrapper) {
        contentWrapper.style.transform = '';
        contentWrapper.style.borderRadius = '';
        contentWrapper.style.overflow = '';
        contentWrapper.style.boxShadow = '';
        contentWrapper.style.opacity = '';
      }
    };
  }, [isMenuOpen]);

  const MobileMenuPortal = () => {
    if (!mounted || !isMenuOpen) return null;

    return createPortal(
      <div className="fixed top-0 right-0 h-full w-[70%] max-w-sm z-[9999] md:hidden flex flex-col items-end pr-6 pt-6">
        {/* Close Button */}
        <div className="mb-8">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-white hover:text-cyan-400 transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col items-end space-y-6 w-full">
          <Link
            href="/products"
            className="text-white hover:text-cyan-400 font-bold text-xl transition-colors uppercase tracking-widest"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Shop"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="text-white hover:text-cyan-400 font-bold text-xl transition-colors uppercase tracking-widest"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/track-order"
            className="text-white hover:text-cyan-400 font-bold text-xl transition-colors uppercase tracking-widest"
            onClick={() => setIsMenuOpen(false)}
          >
            Track Order
          </Link>
          <Link
            href="/contact"
            className="text-white hover:text-cyan-400 font-bold text-xl transition-colors uppercase tracking-widest"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>

          {/* Admin Link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-white hover:text-cyan-400 font-bold text-xl transition-colors border border-purple-500/50 bg-purple-500/20 px-6 py-2 rounded uppercase tracking-widest"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-[60] backdrop-blur-md bg-[#0b1726]/95 border-b border-white/10">
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-small.png"
                alt="Purgo Style"
                width={60}
                height={60}
                className="w-16 h-16"
              />
            </Link>

            {/* Desktop Navigation - translucent pill over hero */}
            <div className="hidden md:flex items-center space-x-8 bg-[#0b1726]/50 border border-white/10 rounded-2xl px-6 py-2 shadow-lg">
              <Link
                href="/products"
                className="text-white hover:text-cyan-400 font-medium transition-colors"
                aria-label="Shop"
              >
                Shop
              </Link>
              <Link href="/about" className="text-white hover:text-cyan-400 font-medium transition-colors">
                About
              </Link>
              <Link href="/track-order" className="text-white hover:text-cyan-400 font-medium transition-colors">
                Track Order
              </Link>
              <Link href="/contact" className="text-white hover:text-cyan-400 font-medium transition-colors">
                Contact
              </Link>
              
              {/* Admin Link - Only visible to admins */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-white hover:text-cyan-400 font-medium transition-colors px-3 py-1 rounded-lg bg-purple-600/30 border border-purple-400/50 hover:bg-purple-600/50"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Desktop Icons */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-white/90 hover:text-white transition-colors p-2 rounded-xl border border-white/30 bg-transparent"
                  aria-label="Search products"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                <Link
                  href="/account"
                  className="text-white/90 hover:text-white transition-colors p-2 rounded-xl border border-white/30 bg-transparent"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
                <Link
                  href="/cart"
                  className="relative text-white/90 hover:text-white transition-colors p-2 rounded-xl border border-white/30 bg-transparent"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Mobile Icons */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden text-gray-700 hover:text-cyan-600 transition-colors"
                aria-label="Search products"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <Link
                href="/account"
                className="md:hidden text-gray-700 hover:text-cyan-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
              <Link
                href="/cart"
                className="md:hidden relative text-gray-700 hover:text-cyan-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    {itemCount}
                  </span>
                )}
              </Link>
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-gray-700 hover:text-cyan-600"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </nav>
      
      {/* Mobile Menu Portal */}
      <MobileMenuPortal />
    </>
  );
}
