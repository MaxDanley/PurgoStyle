/**
 * AI Image Generation Utility
 * Generates images for blog posts using Hugging Face (free) or free stock photos as fallback
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
  // Try Hugging Face first (FREE - no API key required)
  try {
    // Use Stable Diffusion XL model - free and no auth required for public models
    const model = "stabilityai/stable-diffusion-xl-base-1.0";
    const hfApiKey = process.env.HUGGINGFACE_API_KEY; // Optional - works without it but may have rate limits
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add API key if available (optional - works without it)
    if (hfApiKey) {
      headers["Authorization"] = `Bearer ${hfApiKey}`;
    }

    const size = options.size || "1024x1024";
    const [width, height] = size.split("x").map(Number);

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: width,
            height: height,
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        }),
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      
      // Check if response is an image
      if (blob.type.startsWith("image/")) {
        // Convert blob to base64 data URL
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return `data:${blob.type};base64,${base64}`;
      } else {
        // If it's JSON, the model might be loading
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          if (json.error && json.error.includes("loading")) {
            console.log("Hugging Face model is loading, will retry with fallback");
            // Fall through to other options
          }
        } catch {
          // Not JSON, continue to fallback
        }
      }
    } else if (response.status === 503) {
      // Model is loading, try fallback
      console.log("Hugging Face model unavailable, trying fallback");
    }
  } catch (error) {
    console.error("Error generating image with Hugging Face:", error);
    // Continue to fallback options
  }

  // Fallback to free stock photos using Unsplash API (requires free API key)
  console.log("🖼️ Trying Unsplash API stock photo fallback...");
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashAccessKey) {
    try {
      const searchTerms = extractSearchTerms(prompt);
      console.log(`🔍 Searching Unsplash API for: ${searchTerms}`);
      
      // Use Unsplash API search endpoint for relevant photos (not random)
      // Add random page selection to get different results for similar searches
      const randomPage = Math.floor(Math.random() * 5) + 1; // Random page 1-5 for variety
      const unsplashSearchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerms)}&per_page=10&page=${randomPage}&orientation=landscape&client_id=${unsplashAccessKey}`;
      
      console.log(`🔍 Searching Unsplash for relevant photos: ${searchTerms} (page ${randomPage})`);
      
      // First, search for relevant photos
      const searchResponse = await fetch(unsplashSearchUrl, {
        method: "GET",
        headers: {
          "Accept-Version": "v1",
        },
      });

      if (!searchResponse.ok) {
        throw new Error(`Unsplash search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      // Get a random photo from the first 10 results for variety
      let photoData = null;
      if (searchData.results && searchData.results.length > 0) {
        // Pick a random result from the first 10 for variety
        const randomIndex = Math.floor(Math.random() * Math.min(10, searchData.results.length));
        photoData = searchData.results[randomIndex];
        console.log(`📸 Found relevant Unsplash photo: ${photoData.id} by ${photoData.user?.name || 'Unknown'} - "${photoData.description || searchTerms}"`);
      } else {
        // Fallback to random if no search results
        console.log(`⚠️ No search results, trying random photo...`);
        const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchTerms)}&w=1024&h=1024&fit=crop&client_id=${unsplashAccessKey}`;
        
        const randomResponse = await fetch(unsplashUrl, {
          method: "GET",
          headers: {
            "Accept-Version": "v1",
          },
        });
        
        if (randomResponse.ok) {
          photoData = await randomResponse.json();
        }
      }
      
      if (!photoData || !photoData.urls) {
        throw new Error("No photo data from Unsplash");
      }
      
      // Use the regular size URL (1024px width)
      // Return the URL directly instead of converting to base64 (faster and more reliable)
      const imageUrl = photoData.urls.regular || photoData.urls.full;
      console.log("✅ Successfully found relevant stock photo from Unsplash API");
      return imageUrl; // Return URL directly - Next.js Image component can handle external URLs
    } catch (error) {
      console.error("❌ Error fetching stock photo from Unsplash API:", error);
    }
  } else {
    console.log("⚠️ UNSPLASH_ACCESS_KEY not set - get free key at https://unsplash.com/developers");
  }

  // Final fallback: Use placeholder image service (Picsum Photos - free, no API key)
  console.log("🖼️ Using Picsum Photos as final fallback...");
  try {
    // Picsum Photos provides random placeholder images - free, no API key needed
    // Use a seed based on prompt to get consistent images for same prompts
    const seed = prompt.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const picsumUrl = `https://picsum.photos/seed/${seed}/1024/1024`;
    console.log("✅ Using Picsum Photos placeholder");
    return picsumUrl; // Return URL directly
  } catch (error) {
    console.error("❌ Error with Picsum Photos:", error);
  }

  // Ultimate fallback: Use a default research image
  console.log("⚠️ All image generation methods failed - using default image");
  return "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1024&h=1024&fit=crop"; // Generic lab image
}

/**
 * Extract search terms from image prompt for stock photo search
 * Returns relevant search terms for Unsplash API
 * Now uses the actual product name and topic for unique searches
 */
function extractSearchTerms(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // Extract product name (first word, usually the peptide name)
  const words = prompt.split(/\s+/);
  const productName = words[0] || '';
  
  // Extract key topic words (skip common words like "peptide", "research", "laboratory")
  const commonWords = new Set(['peptide', 'research', 'laboratory', 'lab', 'scientific', 'science', 'study', 'analysis']);
  const topicWords = words
    .filter(word => !commonWords.has(word.toLowerCase()) && word.length > 3)
    .slice(0, 3)
    .join(' ');
  
  // Build a more specific search query
  let searchQuery = '';
  
  // If we have a product name, include it
  if (productName && productName.length > 2) {
    searchQuery = `${productName} ${topicWords}`.trim();
  } else {
    searchQuery = topicWords || 'laboratory research';
  }
  
  // Add variation terms based on prompt content
  if (promptLower.includes('purity') || promptLower.includes('analysis')) {
    searchQuery += ' quality testing';
  } else if (promptLower.includes('buy') || promptLower.includes('supplier')) {
    searchQuery += ' pharmaceutical';
  } else if (promptLower.includes('structure') || promptLower.includes('molecular')) {
    searchQuery += ' molecular structure';
  } else if (promptLower.includes('shipping') || promptLower.includes('delivery')) {
    searchQuery += ' packaging';
  } else {
    searchQuery += ' laboratory';
  }
  
  // Limit to reasonable length for Unsplash API
  return searchQuery.substring(0, 100).trim() || 'laboratory research science';
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

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // In a real implementation, you'd save to public/blog-images/
    // For now, return the URL or base64
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }
    
    // Return the original URL if we can't save locally
    return imageUrl;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

