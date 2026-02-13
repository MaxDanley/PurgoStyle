/**
 * SEO Utilities for Blog Posts
 * Generates structured data, internal links, and SEO optimizations
 */

import { products } from "@/lib/products";

export interface SEOData {
  structuredData: object;
  internalLinks: Array<{ text: string; url: string; }>;
  keywords: string[];
  metaDescription: string;
}

/**
 * Generate structured data (JSON-LD) for a blog post
 */
export function generateStructuredData(
  title: string,
  slug: string,
  excerpt: string,
  content: string,
  publishedAt: Date,
  featuredImage?: string,
  articleImages?: string[]
): object {
  const url = `https://www.purgostyle.com/blog/${slug}`;
  
  // Generate ImageObject for featured image
  const imageObjects: any[] = [];
  
  if (featuredImage) {
    const imageAlt = generateImageAltText(title, content);
    imageObjects.push({
      "@type": "ImageObject",
      "url": featuredImage,
      "width": 1024,
      "height": 1024,
      "caption": imageAlt,
      "description": imageAlt,
      "name": title,
      "license": "https://www.purgostyle.com",
      "creator": {
        "@type": "Organization",
        "name": "Purgo Style Labs"
      }
    });
  }
  
  // Add article images
  if (articleImages && articleImages.length > 0) {
    articleImages.forEach((imgUrl, index) => {
      // Extract section title from content
      const headings = content.match(/^##\s+(.+)$/gm);
      const sectionTitle = headings && headings[index] 
        ? headings[index].replace(/^##\s+/, "").trim()
        : null;
      const imageAlt = generateImageAltText(sectionTitle || title, content);
      imageObjects.push({
        "@type": "ImageObject",
        "url": imgUrl,
        "width": 1024,
        "height": 1024,
        "caption": imageAlt,
        "description": imageAlt,
        "name": sectionTitle || `${title} - Image ${index + 1}`,
        "license": "https://www.purgostyle.com",
        "creator": {
          "@type": "Organization",
          "name": "Purgo Style Labs"
        }
      });
    });
  }
  
  const baseImage = featuredImage || "https://www.purgostyle.com/logo-small-copy.png";
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": excerpt,
    "image": imageObjects.length > 0 ? imageObjects : baseImage,
    "datePublished": publishedAt.toISOString(),
    "dateModified": publishedAt.toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Purgo Style Labs",
      "url": "https://www.purgostyle.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Purgo Style Labs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.purgostyle.com/logo-small-copy.png",
        "width": 512,
        "height": 512
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "keywords": extractKeywordsFromContent(content),
    "articleSection": "Research Peptides",
    "inLanguage": "en-US",
    // Add images array for better SEO
    "associatedMedia": imageObjects.length > 0 ? imageObjects : undefined
  };
}

/**
 * Generate SEO-optimized alt text for images
 */
export function generateImageAltText(title: string, content: string): string {
  const keywords = extractKeywordsFromContent(content);
  const primaryKeyword = keywords[0] || "peptide research";
  
  // Create descriptive alt text with keywords
  let altText = `${primaryKeyword} research illustration`;
  
  // Add product name if found
  const productKeywords = ["BPC-157", "tirzepatide", "retatrutide", "IGF-1", "glutathione", "tesamorelin"];
  for (const product of productKeywords) {
    if (title.toLowerCase().includes(product.toLowerCase()) || content.toLowerCase().includes(product.toLowerCase())) {
      altText = `${product} ${altText}`;
      break;
    }
  }
  
  // Add context
  altText += " - Purgo Style Labs";
  
  return altText;
}

// Aliases so "Tirzepatide" etc. in content link to our product pages (e.g. /products/glp-2-trz)
const PRODUCT_ALIASES: Record<string, string> = {
  "tirzepatide": "glp-2-trz", "trizepitide": "glp-2-trz", "glp-2 trz": "glp-2-trz",
  "retatrutide": "glp-3-rt", "reta-trutide": "glp-3-rt", "glp-3 rt": "glp-3-rt",
  "melanotan ii": "melatonin-ii", "melatonin ii": "melatonin-ii", "melatonin 2": "melatonin-ii",
  "semaglutide": "sema-glutide", "bpc157": "bpc-157", "tb500": "tb-500", "nad+": "nad-plus", "ss31": "ss-31", "mots-c": "mots-c",
};

/**
 * Extract relevant products from content and generate internal links
 */
export function generateInternalLinks(
  content: string,
  maxLinks: number = 5
): Array<{ text: string; url: string; }> {
  const links: Array<{ text: string; url: string; }> = [];
  const contentLower = content.toLowerCase();
  const seenSlugs = new Set<string>();

  for (const product of products) {
    if (seenSlugs.has(product.slug)) continue;
    const productNameLower = product.name.toLowerCase();
    const slug = product.slug;
    let matches = contentLower.includes(productNameLower) || contentLower.includes(product.slug.toLowerCase());
    if (!matches) {
      for (const [alias, aliasSlug] of Object.entries(PRODUCT_ALIASES)) {
        if (aliasSlug === slug && contentLower.includes(alias)) {
          matches = true;
          break;
        }
      }
    }
    if (matches) {
      seenSlugs.add(slug);
      links.push({ text: product.name, url: `/products/${slug}` });
      for (const [alias, aliasSlug] of Object.entries(PRODUCT_ALIASES)) {
        if (aliasSlug === slug) links.push({ text: alias, url: `/products/${slug}` });
      }
      if (links.length >= maxLinks) break;
    }
  }

  if (links.length < maxLinks) {
    links.push({ text: "Research Peptides", url: "/products" });
  }
  return links;
}

/**
 * Extract keywords from content
 */
function extractKeywordsFromContent(content: string): string[] {
  const keywords: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Product keywords
  const productKeywords = [
    "BPC-157", "GLP-2 TRZ", "Reta-trutide", "GLP-3 RT", "IGF-1", "glutathione",
    "tesamorelin", "MOTS-c", "melatonin", "peptide", "peptides"
  ];
  
  for (const keyword of productKeywords) {
    if (contentLower.includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  }
  
  return keywords.slice(0, 10);
}

/**
 * Generate enhanced meta description with keywords
 */
export function generateMetaDescription(
  excerpt: string,
  keywords: string[],
  maxLength: number = 160
): string {
  let description = excerpt;
  
  // Add primary keyword if not present
  if (keywords.length > 0 && !description.toLowerCase().includes(keywords[0].toLowerCase())) {
    description = `${keywords[0]} research: ${description}`;
  }
  
  // Truncate to max length
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + "...";
  }
  
  return description;
}

/**
 * Inject internal links into markdown content
 * Only links first occurrence per paragraph to avoid spammy linking
 */
export function injectInternalLinks(
  content: string,
  links: Array<{ text: string; url: string; }>
): string {
  // Split content into paragraphs (double newline or after headings)
  const paragraphs = content.split(/\n\n+/);
  const processedParagraphs: string[] = [];
  
  for (const paragraph of paragraphs) {
    let processedParagraph = paragraph;
    const linkedTerms = new Set<string>(); // Track what's been linked in this paragraph
    
    // Process each link, but only once per paragraph
    for (const link of links) {
      const linkKey = link.text.toLowerCase();
      
      // Skip if already linked in this paragraph
      if (linkedTerms.has(linkKey) || processedParagraph.includes(`[${link.text}](${link.url})`)) {
        continue;
      }
      
      // Escape special regex characters in link text
      const escapedText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Only link if it's a standalone word (word boundary) and not already in a markdown link
      // Use a more sophisticated regex that checks we're not inside brackets
      const regex = new RegExp(`\\b${escapedText}\\b`, "gi");
      
      // Find first match that's not inside a markdown link
      let matchFound = false;
      processedParagraph = processedParagraph.replace(regex, (match, offset) => {
        if (matchFound) return match; // Already linked one in this paragraph
        
        // Check if we're inside a markdown link by counting brackets before this position
        const beforeMatch = processedParagraph.substring(0, offset);
        const openBrackets = (beforeMatch.match(/\[/g) || []).length;
        const closeBrackets = (beforeMatch.match(/\]/g) || []).length;
        const openParens = (beforeMatch.match(/\(/g) || []).length;
        const closeParens = (beforeMatch.match(/\)/g) || []).length;
        
        // If we're inside a markdown link (more [ than ] or inside parentheses after ]), don't link
        if (openBrackets > closeBrackets || (closeBrackets === openBrackets && openParens > closeParens)) {
          return match;
        }
        
        // Link this occurrence
        matchFound = true;
        linkedTerms.add(linkKey);
        return `[${link.text}](${link.url})`;
      });
    }
    
    processedParagraphs.push(processedParagraph);
  }
  
  return processedParagraphs.join('\n\n');
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(slug: string, title: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.purgostyle.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://www.purgostyle.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://www.purgostyle.com/blog/${slug}`
      }
    ]
  };
}

/**
 * Replace markdown links [text](url) in a string with HTML anchors.
 * Use for header text and any inline content so links render correctly.
 */
export function markdownLinksToHtml(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
    const isExternal = url.startsWith("http");
    return `<a href="${url}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""} class="text-cyan-600 hover:text-cyan-700 underline">${linkText}</a>`;
  });
}

/**
 * Convert markdown content to HTML (shared for blog and PSEO pages)
 * Handles headers (including ####), lists, paragraphs, and markdown links
 */
export function markdownContentToHtml(content: string): string {
  const lines = content.split("\n");
  let inList = false;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      const text = markdownLinksToHtml(line.substring(2).trim());
      processedLines.push(`<h1 class="text-4xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">${text}</h1>`);
    } else if (line.startsWith("## ")) {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      const raw = line.substring(3).trim();
      const text = markdownLinksToHtml(raw);
      const id = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      processedLines.push(`<h2 class="text-3xl font-bold text-gray-900 mb-4 mt-8" id="${id}">${text}</h2>`);
    } else if (line.startsWith("### ")) {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      const text = markdownLinksToHtml(line.substring(4).trim());
      processedLines.push(`<h3 class="text-2xl font-bold text-gray-900 mb-3 mt-6">${text}</h3>`);
    } else if (line.startsWith("#### ")) {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      const text = markdownLinksToHtml(line.substring(5).trim());
      processedLines.push(`<h4 class="text-xl font-bold text-gray-900 mb-2 mt-4">${text}</h4>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        processedLines.push('<ul class="list-disc mb-4 ml-6">');
        inList = true;
      }
      const processedListContent = markdownLinksToHtml(line.substring(2));
      processedLines.push(`<li class="mb-2">${processedListContent}</li>`);
    } else if (line.trim() === '') {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push('<br />');
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      const processedLine = markdownLinksToHtml(line);
      processedLines.push(`<p class="text-lg text-gray-700 leading-relaxed mb-4">${processedLine}</p>`);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('\n');
}

/**
 * Breadcrumb for PSEO pages (compare / peptides)
 */
export function generatePSEOPageBreadcrumb(type: 'compare' | 'peptides', slug: string, title: string): object {
  const basePath = type === 'compare' ? '/compare' : '/peptides';
  const sectionName = type === 'compare' ? 'Comparisons' : 'Peptides';
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.purgostyle.com" },
      { "@type": "ListItem", "position": 2, "name": sectionName, "item": `https://www.purgostyle.com${basePath}` },
      { "@type": "ListItem", "position": 3, "name": title, "item": `https://www.purgostyle.com${basePath}/${slug}` }
    ]
  };
}

