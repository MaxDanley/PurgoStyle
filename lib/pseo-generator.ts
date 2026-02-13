/**
 * PSEO Content Generator Library
 * Extracted logic for generating programmatic SEO content
 * Can be used by both manual script and cron job
 */

import { prisma } from './prisma';
import { injectInternalLinks } from './blog-seo';
import { generateAIImage } from './ai-images';
import { products } from './products';
import fs from 'fs';
import path from 'path';

// Map common/alternate names and misspellings to our actual product slugs (for correct linking)
export const PRODUCT_ALIASES_TO_SLUG: Record<string, string> = {
  "tirzepatide": "glp-2-trz",
  "trizepitide": "glp-2-trz",
  "tirze-patide": "glp-2-trz",
  "glp-2 trz": "glp-2-trz",
  "glp2 trz": "glp-2-trz",
  "retatrutide": "glp-3-rt",
  "reta-trutide": "glp-3-rt",
  "glp-3 rt": "glp-3-rt",
  "glp3 rt": "glp-3-rt",
  "melanotan ii": "melatonin-ii",
  "melanotan 2": "melatonin-ii",
  "melatonin ii": "melatonin-ii",
  "melatonin 2": "melatonin-ii",
  "semaglutide": "sema-glutide",
  "sema-glutide": "sema-glutide",
  "bpc-157": "bpc-157",
  "bpc157": "bpc-157",
  "tb-500": "tb-500",
  "tb500": "tb-500",
  "ghk-cu": "ghk-cu",
  "nad+": "nad-plus",
  "nad plus": "nad-plus",
  "ss-31": "ss-31",
  "ss31": "ss-31",
  "mots-c": "mots-c",
  "motsc": "mots-c",
};

// PSEO Data Sources - market peptides + ours; aliases map to our slugs for correct linking
export const PRODUCTS = [
  "BPC-157", "Tirzepatide", "Retatrutide", "IGF-1 LR3",
  "Tesamorelin", "Glutathione", "Semaglutide", "TB-500",
  "Ipamorelin", "CJC-1295", "Melanotan II", "Epitalon",
  "GHK-Cu", "AOD-9604", "MOTS-c", "Kisspeptin-10",
  "Semax", "Selank", "NAD+", "SS-31", "Wolverine", "KLOW", "VIP", "Glow Complex", "BAC Water"
];

export const COMPETITORS = [
  "Peptide Sciences", "Blue Sky Peptides", "Limitless Life Nootropics",
  "Paradigm Peptides", "Core Peptides", "Swiss Chems",
  "Biotech Peptides", "Pure Rawz", "Sports Technology Labs"
];

export const TOPICS = [
  "Research Benefits", "Mechanism of Action", "Clinical Studies Overview",
  "Comparison Guide", "Storage and Handling", "Purity Analysis",
  "Dosage Protocols for Research", "Side Effects in Studies", "Half-Life and Solubility",
  "Stacking Protocols", "Lyophilization Process", "Reconstitution Guide"
];

export const INTENTS = [
  "buy online", "research usage", "chemical structure",
  "laboratory safety", "wholesale pricing", "bulk suppliers",
  "fast shipping", "US-made", "third-party tested"
];

// Helper to wait/sleep (to avoid rate limits)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to save base64 image to disk or use external URL
async function saveImage(imageData: string, slug: string): Promise<string> {
  try {
    // If it's already a URL (from Unsplash), use it directly
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      console.log(`✅ Using external image URL: ${imageData}`);
      return imageData;
    }
    
    // If it's a base64 data URL, save it to disk
    if (imageData.startsWith('data:')) {
      const base64Image = imageData.split(';base64,').pop();
      if (!base64Image) {
        console.error("No base64 data found in image");
        return '';
      }
      
      const filename = `${slug}-${Date.now()}.jpg`;
      const publicDir = path.join(process.cwd(), 'public', 'images', 'blog');
      const filePath = path.join(publicDir, filename);
      
      // Ensure directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Write the image file
      const buffer = Buffer.from(base64Image, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      console.log(`✅ Image saved to ${filePath}`);
      return `/images/blog/${filename}`;
    }
    
    console.error("Unknown image format:", imageData.substring(0, 50));
    return '';
  } catch (error) {
    console.error("Error saving image:", error);
    return '';
  }
}

/** Get internal links to existing comparison and peptide PSEO pages for interlinking */
async function getPSEOPageLinks(): Promise<Array<{ text: string; url: string }>> {
  const links: Array<{ text: string; url: string }> = [];
  try {
    const pages = await prisma.pSEOPage.findMany({
      where: { published: true },
      select: { type: true, title: true, slug: true },
    });
    for (const p of pages) {
      const base = p.type === "COMPARISON" ? "/compare" : "/peptides";
      links.push({ text: p.title, url: `${base}/${p.slug}` });
    }
  } catch (_e) {
    // PSEOPage table may not exist yet
  }
  return links;
}

/** Build base product links for use in comparison/peptide pages */
function buildProductLinksForPSEO(): Array<{ text: string; url: string }> {
  const out: Array<{ text: string; url: string }> = [];
  for (const p of products) {
    out.push({ text: p.name, url: `/products/${p.slug}` });
    // Add aliases so content mentioning "Tirzepatide" etc. links to our slug
    for (const [alias, slug] of Object.entries(PRODUCT_ALIASES_TO_SLUG)) {
      if (slug === p.slug) out.push({ text: alias, url: `/products/${p.slug}` });
    }
  }
  for (const name of PRODUCTS) {
    const normalized = name.toLowerCase().trim();
    const mapped = PRODUCT_ALIASES_TO_SLUG[normalized];
    const slug = mapped || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!products.find(pr => pr.slug === slug || pr.name.toLowerCase() === normalized)) {
      out.push({ text: name, url: `/products/${slug}` });
    }
  }
  out.push(
    { text: "Buy Peptides Online", url: "/products" },
    { text: "Research Peptides", url: "/products" },
    { text: "US Made Peptides", url: "/about" }
  );
  return out;
}

/** Resolve product name (e.g. "Tirzepatide") to our product slug for linking */
function resolveProductSlug(productName: string): string {
  const normalized = productName.toLowerCase().trim();
  const aliased = PRODUCT_ALIASES_TO_SLUG[normalized];
  if (aliased) return aliased;
  const byProduct = products.find(
    p => p.name.toLowerCase() === normalized || p.slug.toLowerCase() === normalized
  );
  if (byProduct) return byProduct.slug;
  return normalized.replace(/[^a-z0-9]+/g, "-");
}

// Helper function to get recent research context (simplified - can be enhanced with actual API calls)
async function getResearchContext(product: string, _topic: string): Promise<string> {
  // This is a placeholder - in production, you could:
  // 1. Use Reddit API to search r/Peptides, r/Nootropics, etc.
  // 2. Use Google Custom Search API for recent news
  // 3. Use PubMed API for recent research papers
  // 4. Use Twitter/X API for recent discussions
  
  // For now, return context that encourages the AI to be current and research-aware
  const currentYear = new Date().getFullYear();
  return `
    Research Context for ${product} (${currentYear}):
    - Consider recent developments in peptide research
    - Think about current market trends and researcher needs
    - Consider common questions and concerns researchers have
    - Reference current best practices in peptide purchasing
    - Be aware of recent regulatory or quality standard updates
    - Consider what active researchers are discussing about ${product}
  `;
}

async function generateContent(product: string, topic: string, intent: string, competitor?: string) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not defined in environment variables");
  }
  
  // Get research context for more informed content
  const researchContext = await getResearchContext(product, topic);
  
  const systemPrompt = `You are an expert SEO content writer for "Purgo Style Labs", an Arizona activewear and apparel brand. 
You write in a professional, brand-appropriate tone.`;

  // Diverse title templates - NEVER use "Unlock the power of" / "Unlock the potential of" / "Discover the"
  const titleVariations = [
    `The Complete Guide to Buying ${product} Online`,
    `Where to Buy ${product} for Research: Verified Suppliers Guide`,
    `${product} Online: How to Choose a Trusted Research Supplier`,
    `Buying ${product} Online: Quality, Purity, and Shipping Guide`,
    `Research-Grade ${product}: Where to Buy and What to Look For`,
    `The Ultimate Guide to Purchasing ${product} for Laboratory Research`,
    `${product} Supplier Guide: Finding Quality Research Peptides Online`,
    `How to Buy ${product} Online: Complete Buyer's Guide`,
    `Finding Quality ${product} for Research: A Researcher's Guide`,
    `${product} Research Supplier: Complete Buying Guide`,
    `What Researchers Should Know Before Buying ${product}`,
    `${product} for Lab Research: Sourcing, Quality, and Best Practices`,
    `A Practical Guide to Sourcing ${product} for Your Lab`,
    `Quality and Purity: What to Look for When Buying ${product}`,
    `${product} Buyer's Guide: From Selection to Delivery`,
    `Research Applications of ${product}: Sourcing and Standards`,
    `Comparing ${product} Suppliers: What Matters for Your Research`,
    `${product} in the Lab: Where to Source and How to Verify Quality`,
  ];
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const randomVariation = titleVariations[Math.floor(Math.random() * titleVariations.length)];

  const userPrompt = `
    Write a comprehensive, SEO-optimized blog post that targets BUYER INTENT searches. Be CREATIVE and UNIQUE - avoid generic, robotic content.
    
    Context:
    - Product: ${product}
    - Topic: ${topic}
    - Current Date: ${currentDate}
    ${competitor ? `- Competitor Analysis: Compare Purgo Style Labs vs ${competitor}. Be fair but highlight Purgo Style Labs advantages.` : ''}
    - User Search Intent: "${intent}" (This is a BUYER searching - they want to purchase. Write content that helps them make a purchase decision).
    
    ${researchContext}

    IMPORTANT: Research and incorporate recent information about ${product}:
    - Recent research findings or studies (if available)
    - Current market trends for ${product}
    - Common questions researchers have about ${product}
    - Real-world considerations for purchasing ${product}
    - Be conversational and helpful, not robotic or templated
    - You MAY discuss other peptides on the market (e.g. related GLP-1 agonists, growth factors) and relate them to ${product} or similar research compounds where relevant. This adds depth and interlinking value.

    CRITICAL: Focus on BUYER INTENT with CREATIVE, UNIQUE content. People searching "${intent}" want to BUY. Answer:
    - Where to buy ${product} online (with specific, actionable advice)
    - How to choose a reliable supplier (real criteria, not generic)
    - What to look for when buying ${product} (specific quality indicators)
    - Why Purgo Style Labs is a trusted source (concrete reasons)
    - Pricing considerations, shipping options, quality verification
    - How to order and what to expect

    Requirements:
    1. Title: Create a UNIQUE, catchy, SEO-friendly title. NEVER use these overused phrases:
       - FORBIDDEN: "Unlock the power of", "Unlock the potential of", "Discover the power of", "Discover the potential of"
       - Prefer concrete, specific titles like: "${randomVariation}"
       - Examples: "Research-Grade ${product}: Your Complete Buying Guide", "Finding Quality ${product} Online: A Researcher's Guide"
       - Be creative and avoid generic patterns.
    
    2. Content:
       - Write a COMPLETE article of 1200-1800 words. Do NOT stop mid-sentence or leave content truncated. Finish every section and the conclusion.
       - Use Markdown formatting (H2, H3, bullet points).
       - Include NATURAL Wikipedia links throughout (3-5 links) for scientific terms:
         * [Peptide](https://en.wikipedia.org/wiki/Peptide) when explaining what peptides are
         * [${product}](https://en.wikipedia.org/wiki/${encodeURIComponent(product.replace(/\s+/g, '_'))}) if Wikipedia page exists
         * Links to related scientific concepts (e.g., [HPLC](https://en.wikipedia.org/wiki/High-performance_liquid_chromatography), [Mass Spectrometry](https://en.wikipedia.org/wiki/Mass_spectrometry))
       - Include internal links naturally within content (not just at the bottom).
       - Use ## for main sections, ### for subsections.
       - Add a "Recent Research and Developments" section if relevant.
       - Include real, helpful information - not generic filler.
       - Be conversational and helpful, like a knowledgeable researcher helping a colleague.
    
    3. Keywords: List 10-15 keywords targeting BUYER searches. Include high-value phrases. Also use: "${intent}", "buy ${product}", "buy ${product} online", "${product} supplier", "where to purchase ${product}", etc.
    
    4. Excerpt: A unique 150-160 char summary that's engaging and includes purchase intent.
    
    5. Meta Description: A highly optimized, unique meta description (max 160 chars) that stands out.
    
    DO NOT include a "Related Research Products" section at the end. Focus on the main content only.
    
    Output ONLY valid JSON in the following format:
    {
      "title": "...",
      "content": "...",
      "excerpt": "...",
      "keywords": ["..."],
      "metaDescription": "..."
    }
  `;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.9, // Higher temperature for more creative, varied content
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error("Invalid response format from Anthropic API");
    }

    const contentRaw = data.content[0].text;
    
    // Remove markdown code blocks if present
    let jsonStr = contentRaw.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();
    
    // Extract JSON object from response (in case there's extra text)
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    // Function to properly escape control characters within JSON string values
    function escapeControlCharsInStrings(jsonString: string): string {
      let result = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          result += char;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (inString) {
          // Inside a string - escape control characters
          if (char === '\n') {
            result += '\\n';
          } else if (char === '\r') {
            result += '\\r';
          } else if (char === '\t') {
            result += '\\t';
          } else if (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) {
            // Remove other control characters
            continue;
          } else {
            result += char;
          }
        } else {
          // Outside a string - keep as is
          result += char;
        }
      }
      
      return result;
    }
    
    try {
      const parsed = JSON.parse(jsonStr);
      // Reject truncated content: require minimum length and complete sentences
      const content = parsed.content || "";
      if (content.length < 800) {
        console.warn(`Content too short (${content.length} chars) - likely truncated, rejecting.`);
        return null;
      }
      const last100 = content.slice(-100).trim();
      if (last100.length > 20 && !/[.!?](\s|$)/.test(last100)) {
        console.warn("Content appears truncated (no sentence ending in last 100 chars), rejecting.");
        return null;
      }
      return parsed;
    } catch (parseError) {
      // If parsing fails, try to clean control characters within strings
      try {
        const cleaned = escapeControlCharsInStrings(jsonStr);
        return JSON.parse(cleaned);
      } catch (_secondError) {
        // If still failing, try manual extraction
        console.error("JSON parsing failed, attempting manual extraction:", parseError);
        
        // Try to extract fields manually using regex with multiline support
        // Use a more flexible regex that handles escaped quotes and newlines
        const titleMatch = jsonStr.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
        const contentMatch = jsonStr.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
        const excerptMatch = jsonStr.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
        const keywordsMatch = jsonStr.match(/"keywords"\s*:\s*\[([^\]]*)\]/s);
        const metaDescMatch = jsonStr.match(/"metaDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
        
        if (titleMatch && contentMatch && excerptMatch) {
          // Helper to unescape string values
          const unescape = (str: string) => {
            return str
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          };
          
          // Manually construct JSON object
          let keywords: string[] = [];
          if (keywordsMatch) {
            try {
              // Try to parse the keywords array
              const keywordsStr = `[${keywordsMatch[1]}]`;
              keywords = JSON.parse(keywordsStr);
            } catch {
              // Fallback: extract quoted strings (handles escaped quotes)
              const keywordPattern = /"((?:[^"\\]|\\.)*)"/g;
              let match;
              while ((match = keywordPattern.exec(keywordsMatch[1])) !== null) {
                keywords.push(unescape(match[1]));
              }
            }
          }
          
          const manual = {
            title: unescape(titleMatch[1]),
            content: unescape(contentMatch[1]),
            excerpt: unescape(excerptMatch[1]),
            keywords: keywords,
            metaDescription: metaDescMatch ? unescape(metaDescMatch[1]) : unescape(excerptMatch[1])
          };
          if ((manual.content?.length || 0) < 800) {
            console.warn("Manually extracted content too short, rejecting.");
            return null;
          }
          return manual;
        }
        
        throw new Error(`Failed to parse JSON response: ${parseError}. Raw content: ${contentRaw.substring(0, 200)}`);
      }
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
}

export interface GeneratePSEOOptions {
  batchSize?: number;
  dryRun?: boolean;
}

export interface GeneratePSEResult {
  success: boolean;
  generated: number;
  skipped: number;
  errors: number;
  message: string;
}

/**
 * Generate PSEO content in batches
 */
export async function generatePSEOContent(options: GeneratePSEOOptions = {}): Promise<GeneratePSEResult> {
  const batchSize = options.batchSize || 5;
  const dryRun = options.dryRun || false;

  console.log("🚀 Starting PSEO Content Generation (Powered by Claude)...");
  
  // Create a queue of combinations
  const queue = [];
  
  // Strategy: Product x Topic x Intent (Deep coverage)
  for (const product of PRODUCTS) {
    for (const topic of TOPICS) {
      for (const intent of INTENTS) {
        queue.push({ product, topic, intent, competitor: undefined });
      }
    }
  }

  // Product x Competitor
  for (const product of PRODUCTS) {
    for (const competitor of COMPETITORS) {
      queue.push({ 
        product, 
        topic: "Competitor Comparison", 
        intent: "buy online", 
        competitor 
      });
    }
  }

  console.log(`📋 Generated execution queue with ${queue.length} potential articles.`);
  
  // Shuffle queue to randomize order (better for SEO diversity)
  const shuffled = queue.sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, batchSize);

  console.log(`▶️ Processing ${batch.length} items from queue of ${queue.length}...`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of batch) {
    console.log(`\n📝 Generating: ${item.product} - ${item.topic} (${item.intent}) ${item.competitor ? `vs ${item.competitor}` : ''}`);
    
    // Check for duplicate titles first (before generating content)
    const potentialTitles = [
      `Where to Buy ${item.product} Online`,
      `Buy ${item.product} Online`,
      `${item.product} Buy Online`,
    ];
    
    const duplicateTitle = await prisma.blogPost.findFirst({
      where: {
        OR: potentialTitles.map(title => ({
          title: { contains: title, mode: 'insensitive' }
        }))
      }
    });

    if (duplicateTitle) {
      console.log(`⏩ Skipping (Duplicate title exists): ${duplicateTitle.title}`);
      skipped++;
      continue;
    }
    
    // Also check for similar slugs
    const slugBase = `${item.product}-${item.topic}-${item.competitor || item.intent}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
      
    const exists = await prisma.blogPost.findFirst({
      where: { slug: { startsWith: slugBase.substring(0, 50) } }
    });

    if (exists) {
      console.log(`⏩ Skipping (Similar content exists): ${slugBase}`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log("DRY RUN: Would generate content and image.");
      continue;
    }

    try {
      // 1. Generate Text Content
      const generatedContent = await generateContent(item.product, item.topic, item.intent, item.competitor);
      
      if (!generatedContent) {
        console.log("❌ Failed to generate content.");
        errors++;
        continue;
      }

      // 2. Generate/Fetch Featured Image
      console.log("🖼️ Generating featured image...");
      // Create unique, specific image prompt with product name and topic
      const imagePrompt = `${item.product} ${item.topic} research peptide laboratory scientific`;
      const imageData = await generateAIImage(imagePrompt);
      let imagePath = '';
      
      // Create Slug from Title for better SEO
      const finalSlug = generatedContent.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + 
        `-${Math.floor(Math.random() * 1000)}`;

      if (imageData) {
        imagePath = await saveImage(imageData, finalSlug);
        if (imagePath) {
          console.log(`✅ Featured image available at ${imagePath}`);
        } else {
          console.log("⚠️ Image generation returned data but save failed, using fallback.");
          imagePath = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1024&h=1024&fit=crop';
        }
      } else {
        console.log("⚠️ Failed to generate featured image, using fallback.");
        imagePath = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1024&h=1024&fit=crop';
      }

      // 3. Generate Article Images for key sections (extract H2 sections)
      const articleImages: string[] = [];
      const h2Sections = generatedContent.content.match(/^##\s+(.+)$/gm);
      if (h2Sections && h2Sections.length > 0) {
        console.log(`🖼️ Generating ${Math.min(3, h2Sections.length)} article images for sections...`);
        for (let i = 0; i < Math.min(3, h2Sections.length); i++) {
          const sectionTitle = h2Sections[i].replace(/^##\s+/, '').trim();
          // Create unique prompt with product, section title, and index for variation
          const sectionImagePrompt = `${item.product} ${sectionTitle} ${item.topic} research laboratory`;
          const sectionImage = await generateAIImage(sectionImagePrompt);
          if (sectionImage) {
            const sectionImagePath = await saveImage(sectionImage, `${finalSlug}-section-${i + 1}`);
            if (sectionImagePath) {
              articleImages.push(sectionImagePath);
              console.log(`✅ Article image ${i + 1} generated`);
            }
          }
          await sleep(1000); // Small delay between image generations
        }
      }

      // 4. Inject Internal Links - use our slug map so "Tirzepatide" → /products/glp-2-trz etc.
      const linksToAdd: Array<{ text: string; url: string }> = [];
      const resolvedSlug = resolveProductSlug(item.product);
      const productMatch = products.find(p => p.slug === resolvedSlug);

      if (productMatch) {
        linksToAdd.push({ text: productMatch.name, url: `/products/${productMatch.slug}` });
        // Add aliases so AI-written "Tirzepatide" / "GLP-2 TRZ" etc. link correctly
        for (const [alias, slug] of Object.entries(PRODUCT_ALIASES_TO_SLUG)) {
          if (slug === productMatch.slug) linksToAdd.push({ text: alias, url: `/products/${productMatch.slug}` });
        }
      } else {
        linksToAdd.push({ text: item.product, url: `/products/${resolvedSlug}` });
      }
      
      linksToAdd.push(
        { text: "Shop", url: "/products" },
        { text: "Products", url: "/products" },
        { text: "About", url: "/about" }
      );
      
      // Add links to comparison and peptide PSEO pages for interlinking
      const pseoLinks = await getPSEOPageLinks();
      linksToAdd.push(...pseoLinks);
      
      const contentWithLinks = injectInternalLinks(generatedContent.content, linksToAdd);

      // 5. Save to DB
      await prisma.blogPost.create({
        data: {
          title: generatedContent.title,
          slug: finalSlug,
          content: contentWithLinks,
          excerpt: generatedContent.excerpt,
          metaDescription: generatedContent.metaDescription,
          keywords: generatedContent.keywords,
          published: true,
          publishedAt: new Date(),
          featuredImage: imagePath || null,
          articleImages: articleImages.length > 0 ? articleImages : undefined
        }
      });

      console.log(`✅ Created Post: "${generatedContent.title}"`);
      generated++;
      
      // Sleep to be nice to API limits
      await sleep(2000); 

    } catch (e) {
      console.error(`Error processing ${item.product}:`, e);
      errors++;
    }
  }

  return {
    success: true,
    generated,
    skipped,
    errors,
    message: `Generated ${generated} posts, skipped ${skipped} duplicates, ${errors} errors`
  };
}

/** Generate comparison page content (Purgo Style Labs vs Competitor) */
async function generateComparisonPageContent(competitor: string): Promise<{ title: string; content: string; excerpt: string; keywords: string[]; metaDescription: string } | null> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return null;
  const systemPrompt = `You are an expert SEO content writer for "Purgo Style Labs", an Arizona activewear and apparel brand. Write in a professional, objective tone.`;
  const userPrompt = `Write a comparison article: "Purgo Style Labs vs ${competitor}".
Include: key differences (quality, shipping, pricing), why customers choose Purgo Style Labs, and when each option may suit different needs.
Use Markdown: ## for sections, ### for subsections, bullet points. 800-1200 words.
Output ONLY valid JSON: { "title": "...", "content": "...", "excerpt": "...", "keywords": ["..."], "metaDescription": "..." }`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.8,
      }),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;
    let jsonStr = text.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];
    return JSON.parse(jsonStr) as { title: string; content: string; excerpt: string; keywords: string[]; metaDescription: string };
  } catch (e) {
    console.error("Error generating comparison content:", e);
    return null;
  }
}

/** Generate product info page content */
async function generatePeptidePageContent(product: string): Promise<{ title: string; content: string; excerpt: string; keywords: string[]; metaDescription: string } | null> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return null;
  const systemPrompt = `You are an expert SEO content writer for "Purgo Style Labs", an Arizona activewear and apparel brand. Write in a professional tone.`;
  const userPrompt = `Write a guide about ${product}. Cover: what it is, quality considerations, how to shop (lead to Purgo Style Labs). Use Markdown: ## and ###, bullet points. 800-1200 words. Include natural internal link opportunities to products and about.
Output ONLY valid JSON: { "title": "...", "content": "...", "excerpt": "...", "keywords": ["..."], "metaDescription": "..." }`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.8,
      }),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;
    let jsonStr = text.replace(/^```json\n?/g, '').replace(/\n?```$/g, '').trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];
    return JSON.parse(jsonStr) as { title: string; content: string; excerpt: string; keywords: string[]; metaDescription: string };
  } catch (e) {
    console.error("Error generating peptide page content:", e);
    return null;
  }
}

export interface GeneratePSEOComparisonAndPeptideOptions {
  comparisonBatchSize?: number;
  peptideBatchSize?: number;
  dryRun?: boolean;
}

/** Generate comparison pages (Purgo Style Labs vs X) and product info pages; interlink with products and each other */
export async function generatePSEOComparisonAndPeptidePages(options: GeneratePSEOComparisonAndPeptideOptions = {}): Promise<GeneratePSEResult> {
  const comparisonBatch = options.comparisonBatchSize ?? 2;
  const peptideBatch = options.peptideBatchSize ?? 2;
  const dryRun = options.dryRun ?? false;
  let generated = 0;
  const skipped = 0;
  let errors = 0;

  const productLinks = buildProductLinksForPSEO();

  // Comparison pages
  const existingComparison = await prisma.pSEOPage.findMany({ where: { type: "COMPARISON", published: true }, select: { slug: true } });
  const existingComparisonSlugs = new Set(existingComparison.map(p => p.slug));
  const competitorsToAdd = COMPETITORS.filter(c => {
    const slug = `purgo-labs-vs-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return !existingComparisonSlugs.has(slug);
  }).slice(0, comparisonBatch);

  for (const competitor of competitorsToAdd) {
    const slug = `purgo-labs-vs-${competitor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (dryRun) {
      console.log(`DRY RUN: Would generate comparison page ${slug}`);
      generated++;
      continue;
    }
    try {
      const content = await generateComparisonPageContent(competitor);
      if (!content) {
        errors++;
        continue;
      }
      const pseoLinks = await getPSEOPageLinks();
      const linksToAdd = [...productLinks, ...pseoLinks];
      const contentWithLinks = injectInternalLinks(content.content, linksToAdd);
      await prisma.pSEOPage.create({
        data: {
          type: "COMPARISON",
          title: content.title,
          slug,
          content: contentWithLinks,
          excerpt: content.excerpt,
          metaDescription: content.metaDescription,
          keywords: content.keywords,
          published: true,
          publishedAt: new Date(),
        },
      });
      console.log(`✅ Created comparison page: ${slug}`);
      generated++;
      await sleep(2000);
    } catch (e) {
      console.error(`Error creating comparison page ${slug}:`, e);
      errors++;
    }
  }

  // Peptide pages
  const existingPeptide = await prisma.pSEOPage.findMany({ where: { type: "PEPTIDE", published: true }, select: { slug: true } });
  const existingPeptideSlugs = new Set(existingPeptide.map(p => p.slug));
  const productsToAdd = PRODUCTS.filter(p => {
    const slug = p.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return !existingPeptideSlugs.has(slug);
  }).slice(0, peptideBatch);

  for (const product of productsToAdd) {
    const slug = product.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (dryRun) {
      console.log(`DRY RUN: Would generate peptide page ${slug}`);
      generated++;
      continue;
    }
    try {
      const content = await generatePeptidePageContent(product);
      if (!content) {
        errors++;
        continue;
      }
      const pseoLinks = await getPSEOPageLinks();
      const linksToAdd = [...productLinks, ...pseoLinks];
      const contentWithLinks = injectInternalLinks(content.content, linksToAdd);
      await prisma.pSEOPage.create({
        data: {
          type: "PEPTIDE",
          title: content.title,
          slug,
          content: contentWithLinks,
          excerpt: content.excerpt,
          metaDescription: content.metaDescription,
          keywords: content.keywords,
          published: true,
          publishedAt: new Date(),
        },
      });
      console.log(`✅ Created peptide page: ${slug}`);
      generated++;
      await sleep(2000);
    } catch (e) {
      console.error(`Error creating peptide page ${slug}:`, e);
      errors++;
    }
  }

  return {
    success: true,
    generated,
    skipped,
    errors,
    message: `Generated ${generated} comparison/peptide pages, ${errors} errors`,
  };
}
