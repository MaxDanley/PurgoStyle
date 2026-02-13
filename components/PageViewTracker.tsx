"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

interface PageViewTrackerProps {
  pageTitle?: string;
  pageType?: string;
  additionalParams?: Record<string, any>;
}

/**
 * Client component to track page views for server-rendered pages
 * Usage: Add <PageViewTracker pageTitle="Products" pageType="products" /> to any page
 */
export default function PageViewTracker({ 
  pageTitle, 
  pageType,
  additionalParams 
}: PageViewTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      trackPageView(
        window.location.href,
        pageTitle || document.title,
        {
          page_type: pageType,
          ...additionalParams,
        }
      );
    }
  }, [pathname, pageTitle, pageType, additionalParams]);

  return null;
}

