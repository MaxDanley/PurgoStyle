/**
 * Blog header image generation via Google Gemini (GOOGLE_AI_KEY or GEMINI_API_KEY).
 * Fallback: random from /images/blog/defaults/default-1.webp … default-6.webp.
 */

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const DEFAULT_IMAGE_COUNT = 6;
const HEADER_WIDTH = 1200;
const HEADER_HEIGHT = 630;

function getApiKey(): string | null {
  return process.env.GOOGLE_AI_KEY ?? process.env.GEMINI_API_KEY ?? null;
}

/**
 * Build the image prompt for Gemini.
 */
export function buildBlogImagePrompt(primaryKeyword: string): string {
  return `Generate a professional, high-quality editorial photograph suitable for a blog header. Subject: ${primaryKeyword}. Setting: Kansas City Missouri area, trees, nature, residential neighborhood. Style: warm natural lighting, shallow depth of field, professional landscape photography, no text overlays, no watermarks, no logos, photorealistic, wide 16:9 composition. The image should feel clean, inviting, and professional for a tree care company website.`;
}

/**
 * Call Gemini to generate an image. Returns PNG buffer or null on failure.
 * Timeout: 60 seconds.
 */
export async function generateBlogHeaderImageWithGemini(
  primaryKeyword: string
): Promise<Buffer | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[blog-header-image] No GOOGLE_AI_KEY or GEMINI_API_KEY");
    return null;
  }

  const prompt = buildBlogImagePrompt(primaryKeyword);

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Try generateImages first (Imagen-style); then try generateContent with image output
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      // Gemini 2.5 Flash with image generation (generateContent can return image parts)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        } as Record<string, unknown>,
      });

      clearTimeout(timeout);

      const candidates = (response as { candidates?: { content?: { parts?: { inlineData?: { data?: string }; imageBytes?: string }[] }[] })?.candidates;
      if (candidates?.[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          const data = (part as { inlineData?: { data?: string }; imageBytes?: string }).inlineData?.data ?? (part as { imageBytes?: string }).imageBytes;
          if (data) {
            return Buffer.from(data, "base64");
          }
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      // Fallback: try generateImages if available (different model)
      try {
        const imgResponse = await ai.models.generateImages({
          model: "gemini-2.5-flash",
          prompt,
          config: { aspectRatio: "16:9" },
        });
        const gen = (imgResponse as { generatedImages?: { image?: { imageBytes?: string } }[] })?.generatedImages?.[0];
        const bytes = gen?.image?.imageBytes;
        if (bytes) return Buffer.from(bytes, "base64");
      } catch {
        // ignore
      }
      throw e;
    }
  } catch (e) {
    console.error("[blog-header-image] Gemini error:", e);
    return null;
  }

  return null;
}

/**
 * Process buffer with sharp and save to public/images/blog/{slug}.webp and .jpg.
 * Returns the public path for the primary image (webp).
 */
export async function processAndSaveBlogImage(
  imageBuffer: Buffer,
  slug: string
): Promise<string> {
  const outputDir = path.join(process.cwd(), "public", "images", "blog");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const webpPath = path.join(outputDir, `${slug}.webp`);
  const jpgPath = path.join(outputDir, `${slug}.jpg`);

  await sharp(imageBuffer)
    .resize(HEADER_WIDTH, HEADER_HEIGHT, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(webpPath);

  await sharp(imageBuffer)
    .resize(HEADER_WIDTH, HEADER_HEIGHT, { fit: "cover" })
    .jpeg({ quality: 80, progressive: true })
    .toFile(jpgPath);

  return `/images/blog/${slug}.webp`;
}

/**
 * Get a random default header image path (when Gemini fails or no key).
 */
export function getDefaultBlogHeaderPath(): string {
  const n = Math.floor(Math.random() * DEFAULT_IMAGE_COUNT) + 1;
  return `/images/blog/defaults/default-${n}.webp`;
}

/**
 * Generate header image for a post: try Gemini, then save with sharp; on failure use default path.
 * When running in Vercel/serverless, writing to public/ may not be allowed — then we return default and optionally upload buffer to Blob (caller can handle).
 */
export async function generateAndSaveBlogHeaderImage(
  slug: string,
  primaryKeyword: string,
  title: string,
  options: { saveToDisk?: boolean } = { saveToDisk: true }
): Promise<{ featuredImage: string; alt: string; caption: string }> {
  const buffer = await generateBlogHeaderImageWithGemini(primaryKeyword);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gradeatree.com";
  const alt = `${primaryKeyword} - ${title} | Grade A Tree Care Kansas City`;
  const caption = `Professional ${primaryKeyword} services in the Kansas City metro area — Grade A Tree Care`;

  if (buffer && options.saveToDisk) {
    try {
      const path = await processAndSaveBlogImage(buffer, slug);
      return { featuredImage: path, alt, caption };
    } catch (e) {
      console.error("[blog-header-image] Sharp save failed:", e);
    }
  }

  const fallbackPath = getDefaultBlogHeaderPath();
  return { featuredImage: fallbackPath, alt, caption };
}
