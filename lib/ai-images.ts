/**
 * Image generation for blog posts – uses Picsum Photos (free, no API key).
 * Hugging Face and Unsplash have been removed.
 */

interface ImageGenerationOptions {
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024";
  n?: number;
}

export async function generateAIImage(
  prompt: string,
  options: { size?: "256x256" | "512x512" | "1024x1024" } = {}
): Promise<string | null> {
  try {
    const seed = prompt.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const picsumUrl = `https://picsum.photos/seed/${seed}/1024/1024`;
    return picsumUrl;
  } catch (error) {
    console.error("Error with Picsum Photos:", error);
  }
  return "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1024&h=1024&fit=crop";
}

/**
 * Generate a featured image prompt for a blog post
 */
export function generateFeaturedImagePrompt(
  title: string,
  topic: string,
  productName?: string
): string {
  if (productName) {
    return `Professional scientific illustration of ${productName} peptide research in a modern laboratory setting. Clean, scientific aesthetic with molecular structures, research equipment, and laboratory environment. High quality, professional photography style, well-lit, scientific and educational tone.`;
  }
  return `Professional scientific illustration of ${topic} research in a modern laboratory setting. Clean, scientific aesthetic with molecular structures, research equipment, and laboratory environment. High quality, professional photography style, well-lit, scientific and educational tone.`;
}

/**
 * Generate an article image prompt for content sections
 */
export function generateArticleImagePrompt(
  sectionTitle: string,
  topic: string
): string {
  return `Scientific illustration related to ${topic} and ${sectionTitle}. Clean, professional, educational style. Modern laboratory or molecular visualization. High quality, scientific aesthetic.`;
}

/**
 * Download and save image from URL to public/blog-images directory
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }
    return imageUrl;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}
