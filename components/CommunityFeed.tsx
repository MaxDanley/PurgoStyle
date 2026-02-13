"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface SocialPost {
  id: string;
  platform: "twitter" | "facebook" | "reddit";
  author: string;
  authorHandle?: string;
  authorAvatar?: string;
  content: string;
  url: string;
  timestamp: string;
  likes?: number;
  shares?: number;
  comments?: number;
  imageUrl?: string;
  relatedProduct?: string;
}

interface CommunityFeedProps {
  productKeywords: string;
}

export default function CommunityFeed({ productKeywords }: CommunityFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch posts immediately
    fetchCommunityPosts();

    // Set up automatic refresh every hour (3600000 milliseconds)
    const intervalId = setInterval(() => {
      fetchCommunityPosts();
    }, 3600000); // 1 hour

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchCommunityPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/blog/community-posts", {
        // Add cache-busting query parameter to ensure fresh data
        cache: "no-store",
        next: { revalidate: 0 }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setError(null); // Clear any previous errors
      } else {
        setError("Failed to load community posts");
      }
    } catch (err) {
      console.error("Error fetching community posts:", err);
      setError("Error loading community posts");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchCommunityPosts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Found</h3>
        <p className="text-gray-600 mb-6">
          We're gathering the latest community discussions about research peptides.
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
        >
          Explore Our Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Latest Community Discussions</h2>
        <p className="text-gray-600 mt-1">
          {posts.length} {posts.length === 1 ? "post" : "posts"} about research peptides
          <span className="text-sm text-gray-500 ml-2">(Updates hourly)</span>
        </p>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            itemScope
            itemType="https://schema.org/SocialMediaPosting"
          >
            {/* Platform Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {post.authorAvatar ? (
                  <Image
                    src={post.authorAvatar}
                    alt={post.author}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900" itemProp="author">
                      {post.author}
                    </span>
                    {post.authorHandle && (
                      <span className="text-gray-500 text-sm">@{post.authorHandle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        post.platform === "twitter"
                          ? "bg-blue-100 text-blue-700"
                          : post.platform === "facebook"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {post.platform === "twitter" ? "X" : post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    </span>
                    <span itemProp="datePublished">{post.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed" itemProp="text">
                {post.content}
              </p>
              {post.imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <Image
                    src={post.imageUrl}
                    alt={post.content.substring(0, 100)}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    itemProp="image"
                  />
                </div>
              )}
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              {post.likes !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  {post.likes}
                </span>
              )}
              {post.comments !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                  </svg>
                  {post.comments}
                </span>
              )}
              {post.shares !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  {post.shares}
                </span>
              )}
            </div>

            {/* Related Product CTA */}
            {post.relatedProduct && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Related Product:</p>
                <Link
                  href={`/products/${post.relatedProduct.toLowerCase().replace(/\s+/g, "-")}`}
                  className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Learn more about {post.relatedProduct}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* View Original Post */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-sm text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-1"
                itemProp="url"
              >
                View original post
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-12 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 text-center border border-cyan-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Explore Premium Research Peptides
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Join researchers worldwide who trust Purgo Labs for high-purity, lab-tested research peptides. 
          Browse our complete catalog of premium research-grade compounds.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/products"
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            View All Products
          </Link>
          <Link
            href="/lab-reports"
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
          >
            View Lab Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

