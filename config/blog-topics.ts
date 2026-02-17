/**
 * Blog topic queue for automated daily generation.
 * Pick from Tier 1 first, then Tier 2, then Tier 3 (cycle).
 * ALL existing blog titles/slugs/keywords are passed to the generator for dedup — do not duplicate these.
 */

export const BLOG_BRAND = {
  name: "Grade A Tree Care",
  siteName: "Grade A Tree Care",
  baseUrl: "https://gradeatree.com",
  logoUrl: "https://gradeatree.com/logo.png",
};

/** Map primary keyword → relevant service page for internal linking */
export const KEYWORD_TO_SERVICE_PAGE: Record<string, string> = {
  "benefits of tree removal": "/tree-removal",
  "removing a tree": "/tree-removal",
  "remove tree": "/tree-removal",
  "tree trimming pruning": "/tree-trimming",
  "tree service kansas city": "/tree-service",
  "storm damaged tree removal": "/storm-damage-cleanup",
  "trees native to missouri": "/tree-care",
  "tree damage from storm": "/storm-damage-cleanup",
  "tree removal after storm": "/storm-damage-cleanup",
  "storm damage tree removal": "/storm-damage-cleanup",
};

/** Tier 1 — HIGH PRIORITY: exact queries (e.g. ranking 8+). One deep-dive post per keyword. */
export const TIER_1_KEYWORDS: string[] = [
  "benefits of tree removal",
  "removing a tree",
  "remove tree",
  "tree trimming pruning",
  "tree service kansas city",
  "storm damaged tree removal",
  "trees native to missouri",
  "tree damage from storm",
  "tree removal after storm",
  "storm damage tree removal",
];

/** Tier 2 — SERVICE-BASED: topics derived from service pages (tree removal, trimming, stump grinding, storm damage, etc.) */
export const TIER_2_KEYWORDS: string[] = [
  "when to remove a tree",
  "cost of stump grinding",
  "how to choose an arborist",
  "tree pruning best practices",
  "emergency tree removal",
  "dead tree removal",
  "tree risk assessment",
];

/** Tier 3 — SEASONAL / LOCAL: Kansas City area seasonal tips, local species, weather prep */
export const TIER_3_KEYWORDS: string[] = [
  "fall tree care kansas city",
  "winter tree care missouri",
  "spring tree trimming tips",
  "storm preparation for trees",
  "native trees kansas city",
];

export type TopicTier = 1 | 2 | 3;

export function getTopicQueue(): { keyword: string; tier: TopicTier }[] {
  const queue: { keyword: string; tier: TopicTier }[] = [];
  TIER_1_KEYWORDS.forEach((k) => queue.push({ keyword: k, tier: 1 }));
  TIER_2_KEYWORDS.forEach((k) => queue.push({ keyword: k, tier: 2 }));
  TIER_3_KEYWORDS.forEach((k) => queue.push({ keyword: k, tier: 3 }));
  return queue;
}

export function getServicePageForKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();
  return KEYWORD_TO_SERVICE_PAGE[lower] ?? "/tree-care";
}
