/**
 * Facebook/Instagram Ad Referral Detection
 * Detects if user came from Facebook or Instagram ad click
 */

const FACEBOOK_REFERRAL_COOKIE = "fb_ad_referral";
const COOKIE_EXPIRY_DAYS = 30; // Store referral for 30 days

/**
 * Check if current URL has Facebook/Instagram ad parameters
 */
export function detectFacebookReferral(): boolean {
  if (typeof window === "undefined") return false;

  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer.toLowerCase();
  const currentUrl = window.location.href.toLowerCase();

  // Check for Facebook Click ID (most reliable)
  const fbclid = urlParams.get("fbclid");
  
  // Check for UTM parameters
  const utmSource = urlParams.get("utm_source")?.toLowerCase();
  const utmMedium = urlParams.get("utm_medium")?.toLowerCase();
  const _utmCampaign = urlParams.get("utm_campaign")?.toLowerCase();
  
  // Check referrer domain
  const isFacebookDomain = referrer.includes("facebook.com") || referrer.includes("fb.com");
  const isInstagramDomain = referrer.includes("instagram.com") || referrer.includes("instagram");
  
  // Check if URL contains Instagram/Facebook indicators
  const urlHasInstagram = currentUrl.includes("instagram") || currentUrl.includes("ig_");
  const urlHasFacebook = currentUrl.includes("facebook") || currentUrl.includes("fb_");
  
  // Facebook/Instagram ad indicators
  const isFacebookAd = fbclid !== null || 
                       utmSource === "facebook" || 
                       urlHasFacebook ||
                       (isFacebookDomain && (utmMedium === "cpc" || utmMedium === "paid" || utmMedium === "social"));
  
  const isInstagramAd = fbclid !== null || // fbclid is also used for Instagram ads
                       utmSource === "instagram" || 
                       urlHasInstagram ||
                       (isInstagramDomain && (utmMedium === "cpc" || utmMedium === "paid" || utmMedium === "social"));

  return isFacebookAd || isInstagramAd;
}

/**
 * Store Facebook referral in cookie
 */
export function storeFacebookReferral(): void {
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  
  document.cookie = `${FACEBOOK_REFERRAL_COOKIE}=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Check if user has Facebook referral stored in cookie
 */
export function hasFacebookReferral(): boolean {
  if (typeof window === "undefined") return false;

  const cookies = document.cookie.split(";");
  return cookies.some(cookie => 
    cookie.trim().startsWith(`${FACEBOOK_REFERRAL_COOKIE}=`)
  );
}

/**
 * Clear Facebook referral cookie (e.g., after order is placed)
 */
export function clearFacebookReferral(): void {
  if (typeof window === "undefined") return;

  document.cookie = `${FACEBOOK_REFERRAL_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Get Facebook referral status (check URL params first, then cookie)
 */
export function getFacebookReferralStatus(): boolean {
  // First check if current visit is from Facebook/Instagram ad
  if (detectFacebookReferral()) {
    storeFacebookReferral();
    return true;
  }
  
  // Otherwise check if stored in cookie from previous visit
  return hasFacebookReferral();
}


