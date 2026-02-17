/**
 * Cron endpoint: trigger daily blog generation.
 * Call with: POST /api/cron/generate-blog
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * Set CRON_SECRET and GROQ_API_KEY in env. Vercel Cron or GitHub Actions can hit this once per day.
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import {
  BLOG_BRAND,
  getTopicQueue,
  getServicePageForKeyword,
} from "@/config/blog-topics";
import {
  generateBlogHeaderImageWithGemini,
  getDefaultBlogHeaderPath,
} from "@/lib/blog-header-image";

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
  return `You are an expert SEO content writer for ${BLOG_BRAND.name} (${BLOG_BRAND.baseUrl}), a tree service company serving the Kansas City metro area.

Write a comprehensive, SEO-optimized blog post targeting the keyword: "${primaryKeyword}"

REQUIREMENTS:
Title: Must include the primary keyword naturally. Under 60 characters. Compelling and click-worthy.
Meta Description: 150-160 characters, includes primary keyword, has a call-to-action.
Content length: 1200-1800 words
Tone: Professional but approachable. Authoritative. Helpful.
Location focus: Kansas City metro area, Missouri, and Kansas references where natural.
STRUCTURE: H1 (only one), H2 major sections (4-6), H3 subsections. Bullet points and short paragraphs. Include "Key Takeaways" near top. End with CTA for Annual Tree Care Program ($75/year).
INTERNAL LINKING: Link to ${BLOG_BRAND.baseUrl}${servicePageUrl}; link to 2-3 existing posts: ${existingBlogUrls}.
EXTERNAL: 1-2 authoritative outbound links (university extensions, USDA, Wikipedia, ISA).
SEO: Primary keyword in title, meta, first paragraph, at least 2 H2s, 1-2% density. FAQ section with 3-4 "People Also Ask" style questions.
OUTPUT FORMAT — Return valid JSON only:
{"title":"...","slug":"...","metaDescription":"...","primaryKeyword":"...","secondaryKeywords":[],"excerpt":"...","content":"...","internalLinks":[],"externalLinks":[],"faqSchema":[{"question":"...","answer":"..."}]}

PREVIOUSLY PUBLISHED (DO NOT duplicate):
${existingPostsList}`;
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
  if (!res.ok) throw new Error(`GROQ ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty GROQ response");
  return content;
}

function parseJson(content: string): GroqBlogOutput {
  let raw = content.trim();
  const m = raw.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (m) raw = m[1].trim();
  return JSON.parse(raw) as GroqBlogOutput;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!secret || token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.blogPost.findMany({
      where: { published: true },
      select: { title: true, slug: true, primaryKeyword: true },
      orderBy: { publishedAt: "desc" },
    });
    const existingKeywords = new Set(
      existing.map((p) => p.primaryKeyword?.toLowerCase()).filter(Boolean) as string[]
    );
    const existingSlugs = new Set(existing.map((p) => p.slug));
    const existingPostsList = existing.slice(0, 80).map((p) => `- ${p.title} | ${p.slug} | ${p.primaryKeyword ?? "—"}`).join("\n");
    const existingBlogUrls = existing.slice(0, 5).map((p) => `${BLOG_BRAND.baseUrl}/blog/${p.slug}`).join(", ");

    const queue = getTopicQueue();
    let chosen: { keyword: string; tier: number } | null = null;
    for (const { keyword, tier } of queue) {
      if (existingKeywords.has(keyword.toLowerCase())) continue;
      chosen = { keyword, tier };
      break;
    }
    if (!chosen) {
      return NextResponse.json({ ok: true, message: "No new topic in queue" });
    }

    const servicePageUrl = getServicePageForKeyword(chosen.keyword);
    const prompt = buildPrompt(chosen.keyword, servicePageUrl, existingPostsList || "(none)", existingBlogUrls || BLOG_BRAND.baseUrl + "/blog");
    const raw = await callGroq(prompt);
    const parsed = parseJson(raw);
    const slug = parsed.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (existingSlugs.has(slug)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const post = await prisma.blogPost.create({
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

    let featuredImage: string | null = null;
    try {
      const buffer = await generateBlogHeaderImageWithGemini(parsed.primaryKeyword);
      if (buffer) {
        const webp = await sharp(buffer)
          .resize(1200, 630, { fit: "cover" })
          .webp({ quality: 82 })
          .toBuffer();
        const blob = await put(`blog/${slug}.webp`, webp, {
          access: "public",
          contentType: "image/webp",
        });
        featuredImage = blob.url;
      }
    } catch {
      // ignore
    }
    if (!featuredImage) featuredImage = getDefaultBlogHeaderPath();
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { featuredImage },
    });

    return NextResponse.json({ ok: true, slug, title: parsed.title, image: featuredImage });
  } catch (e: unknown) {
    console.error("[cron/generate-blog]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
