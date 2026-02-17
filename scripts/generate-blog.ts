/**
 * Daily automated blog generation via GROQ API.
 * Run: GROQ_API_KEY=xxx npx tsx scripts/generate-blog.ts
 * Cron: run once per day (e.g. 0 9 * * * in crontab or Vercel cron).
 *
 * - Loads existing blog titles/slugs/keywords for dedup
 * - Picks next topic from config queue (Tier 1 → 2 → 3)
 * - Calls GROQ (Llama), parses JSON, saves to DB
 * - Sitemap is dynamic (Next.js) so new posts appear on next request
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  BLOG_BRAND,
  getTopicQueue,
  getServicePageForKeyword,
} from "../config/blog-topics";
import { generateAndSaveBlogHeaderImage } from "../lib/blog-header-image";

const prisma = new PrismaClient();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface GroqBlogOutput {
  title: string;
  slug: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  excerpt: string;
  content: string;
  internalLinks: Array<{ text: string; url: string }>;
  externalLinks: Array<{ text: string; url: string }>;
  faqSchema: Array<{ question: string; answer: string }>;
}

function buildPrompt(
  primaryKeyword: string,
  servicePageUrl: string,
  existingPostsList: string,
  existingBlogUrls: string
): string {
  const systemPrompt = `You are an expert SEO content writer for ${BLOG_BRAND.name} (${BLOG_BRAND.baseUrl}), a tree service company serving the Kansas City metro area.

Write a comprehensive, SEO-optimized blog post targeting the keyword: "${primaryKeyword}"

REQUIREMENTS:

Title: Must include the primary keyword naturally. Under 60 characters. Compelling and click-worthy.
Meta Description: 150-160 characters, includes primary keyword, has a call-to-action.
Content length: 1200-1800 words
Tone: Professional but approachable. Authoritative. Helpful. Like talking to a knowledgeable neighbor who happens to be a certified arborist.
Location focus: Kansas City metro area, Missouri, and Kansas references where natural.
STRUCTURE (use these exact heading levels):

H1: The blog title (only ONE h1)
H2: Major sections (4-6 sections)
H3: Subsections where needed
Use bullet points and numbered lists for scannability
Short paragraphs (2-3 sentences max)
Include a "Key Takeaways" or "Quick Summary" section near the top
End with a CTA section promoting ${BLOG_BRAND.name} services and the Annual Tree Care Program ($75/year)
INTERNAL LINKING (include these naturally in the content):

Link to the most relevant service page: ${BLOG_BRAND.baseUrl}${servicePageUrl}
Link to 2-3 existing blog posts: ${existingBlogUrls}
Link to the Annual Tree Care Program page
EXTERNAL REFERENCES:

Include 1-2 outbound links to authoritative sources (university extensions, USDA, Wikipedia, ISA - International Society of Arboriculture)
SEO RULES:

Primary keyword appears in: title, meta description, first paragraph, at least 2 H2s, and naturally throughout (1-2% density)
Use semantic variations and LSI keywords naturally
Include a FAQ section with 3-4 questions using "People Also Ask" style queries related to the keyword
Every image placeholder should have descriptive alt text containing the keyword
OUTPUT FORMAT — Return valid JSON only, no markdown code fence or extra text:
{
  "title": "...",
  "slug": "...",
  "metaDescription": "...",
  "primaryKeyword": "...",
  "secondaryKeywords": ["...", "..."],
  "excerpt": "first 2 sentences for preview cards",
  "content": "full blog content in markdown with heading levels",
  "internalLinks": [{"text": "anchor text", "url": "/path"}],
  "externalLinks": [{"text": "anchor text", "url": "https://..."}],
  "faqSchema": [{"question": "...", "answer": "..."}]
}

PREVIOUSLY PUBLISHED POSTS (DO NOT duplicate these topics or titles):
${existingPostsList}`;

  return systemPrompt;
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You output only valid JSON. No markdown, no code fence." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GROQ API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from GROQ");
  return content;
}

function parseJson(content: string): GroqBlogOutput {
  let raw = content.trim();
  const codeBlock = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (codeBlock) raw = codeBlock[1].trim();
  return JSON.parse(raw) as GroqBlogOutput;
}

async function main() {
  console.log("[generate-blog] Loading existing posts for dedup...");
  const existing = await prisma.blogPost.findMany({
    where: { published: true },
    select: { title: true, slug: true, primaryKeyword: true },
    orderBy: { publishedAt: "desc" },
  });

  const existingTitles = new Set(existing.map((p) => p.title.toLowerCase()));
  const existingSlugs = new Set(existing.map((p) => p.slug));
  const existingKeywords = new Set(
    existing.map((p) => p.primaryKeyword?.toLowerCase()).filter(Boolean) as string[]
  );

  const existingPostsList = existing
    .slice(0, 80)
    .map((p) => `- Title: "${p.title}" | Slug: ${p.slug} | Keyword: ${p.primaryKeyword ?? "—"}`)
    .join("\n");

  const existingBlogUrls = existing
    .slice(0, 5)
    .map((p) => `${BLOG_BRAND.baseUrl}/blog/${p.slug}`)
    .join(", ");

  const queue = getTopicQueue();
  let chosen: { keyword: string; tier: 1 | 2 | 3 } | null = null;
  for (const { keyword, tier } of queue) {
    const kw = keyword.toLowerCase();
    if (existingKeywords.has(kw)) continue;
    chosen = { keyword, tier };
    break;
  }

  if (!chosen) {
    console.log("[generate-blog] No new topic left in queue (all keywords used). Exiting.");
    process.exit(0);
  }

  console.log(`[generate-blog] Next topic: "${chosen.keyword}" (Tier ${chosen.tier})`);
  const servicePageUrl = getServicePageForKeyword(chosen.keyword);
  const prompt = buildPrompt(
    chosen.keyword,
    servicePageUrl,
    existingPostsList || "(none yet)",
    existingBlogUrls || BLOG_BRAND.baseUrl + "/blog"
  );

  let raw: string;
  try {
    raw = await callGroq(prompt);
  } catch (e) {
    console.error("[generate-blog] GROQ call failed:", e);
    process.exit(1);
  }

  let parsed: GroqBlogOutput;
  try {
    parsed = parseJson(raw);
  } catch (e) {
    console.error("[generate-blog] Failed to parse JSON:", e);
    console.error("[generate-blog] Raw response (first 500 chars):", raw.slice(0, 500));
    process.exit(1);
  }

  const slug = parsed.slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (existingSlugs.has(slug)) {
    console.error(`[generate-blog] Slug "${slug}" already exists. Aborting to avoid duplicate.`);
    process.exit(1);
  }

  const created = await prisma.blogPost.create({
    data: {
      title: parsed.title,
      slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      keywords: [parsed.primaryKeyword, ...parsed.secondaryKeywords],
      metaDescription: parsed.metaDescription,
      featuredImage: null,
      articleImages: [],
      published: true,
      publishedAt: new Date(),
      primaryKeyword: parsed.primaryKeyword,
      faqSchema: parsed.faqSchema as object,
    },
  });
  const postId = created.id;

  let featuredImage: string | null = null;
  try {
    const imageResult = await generateAndSaveBlogHeaderImage(
      slug,
      parsed.primaryKeyword,
      parsed.title,
      { saveToDisk: true }
    );
    featuredImage = imageResult.featuredImage;
    if (featuredImage) {
      await prisma.blogPost.update({
        where: { id: postId },
        data: { featuredImage },
      });
    }
  } catch (e) {
    console.warn("[generate-blog] Header image generation failed, using default:", e);
    const { getDefaultBlogHeaderPath } = await import("../lib/blog-header-image");
    featuredImage = getDefaultBlogHeaderPath();
    await prisma.blogPost.update({
      where: { id: postId },
      data: { featuredImage },
    });
  }

  console.log(`[generate-blog] Created: "${parsed.title}" at /blog/${slug}` + (featuredImage ? ` (image: ${featuredImage})` : ""));
}

main()
  .catch((e) => {
    console.error("[generate-blog] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
