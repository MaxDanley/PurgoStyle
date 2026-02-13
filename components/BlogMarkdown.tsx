"use client";

import Image from "next/image";
import { useEffect } from "react";
import { markdownLinksToHtml } from "@/lib/blog-seo";

interface BlogMarkdownProps {
  content: string;
  articleImages?: string[];
}

export default function BlogMarkdown({ content, articleImages = [] }: BlogMarkdownProps) {
  useEffect(() => {
    // Process markdown and convert to HTML
  }, [content]);

  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Links first so they work inside headers (replace [text](url) everywhere)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (_match, text, url) => {
      const isExternal = url.startsWith("http");
      return `<a href="${url}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""} class="text-cyan-600 hover:text-cyan-700 underline">${text}</a>`;
    });

    // Headers (process inner content for any remaining markdown; #### supported)
    html = html.replace(/^#### (.*)$/gim, (_, cap) => `<h4 class="text-xl font-bold text-gray-900 mb-2 mt-4">${markdownLinksToHtml(cap.trim())}</h4>`);
    html = html.replace(/^### (.*)$/gim, (_, cap) => `<h3 class="text-2xl font-bold text-gray-900 mb-3 mt-6">${markdownLinksToHtml(cap.trim())}</h3>`);
    html = html.replace(/^## (.*)$/gim, (_, cap) => {
      const trimmed = cap.trim();
      const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return `<h2 class="text-3xl font-bold text-gray-900 mb-4 mt-8" id="${id}">${markdownLinksToHtml(trimmed)}</h2>`;
    });
    html = html.replace(/^# (.*)$/gim, (_, cap) => `<h1 class="text-4xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">${markdownLinksToHtml(cap.trim())}</h1>`);

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

    // Lists
    html = html.replace(/^- (.*)$/gim, "<li class=\"mb-2 ml-4\">$1</li>");
    html = html.replace(/(<li.*?<\/li>)/gim, "<ul class=\"list-disc mb-4\">$1</ul>");

    // Paragraphs
    html = html.split("\n\n").map((para) => {
      if (para.trim() && !para.match(/^<[hul]/)) {
        return `<p class="text-lg text-gray-700 leading-relaxed mb-4">${para.trim()}</p>`;
      }
      return para;
    }).join("\n");

    html = html.replace(/<p class="text-lg text-gray-700 leading-relaxed mb-4"><\/p>/gim, "");
    return html;
  };

  const htmlContent = markdownToHtml(content);

  return (
    <div 
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

