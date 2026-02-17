import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.summersteez.com";

export const metadata: Metadata = {
  title: "Tree Care Blog | Expert Tips & Guides | Grade A Tree Care",
  description:
    "Expert tree care tips, guides, and advice from Grade A Tree Care. Learn about tree removal, trimming, storm damage, and seasonal care in the Kansas City area.",
  openGraph: {
    title: "Tree Care Blog | Expert Tips & Guides | Grade A Tree Care",
    description: "Expert tree care tips and guides for the Kansas City metro.",
    url: `${BASE_URL}/blog`,
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/blog` },
};

const POSTS_PER_PAGE = 12;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(String(pageParam), 10) || 1);
  const skip = (page - 1) * POSTS_PER_PAGE;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: POSTS_PER_PAGE,
      skip,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        primaryKeyword: true,
        featuredImage: true,
      },
    }),
    prisma.blogPost.count({ where: { published: true } }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
      <p className="text-lg text-gray-600 mb-10">
        Expert tree care tips, guides, and seasonal advice for the Kansas City area.
      </p>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              {post.featuredImage ? (
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={post.featuredImage}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  No image
                </div>
              )}
              <div className="p-5">
                <time
                  dateTime={post.publishedAt?.toISOString() ?? ""}
                  className="text-sm text-gray-500"
                >
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </time>
                <h2 className="text-xl font-semibold text-gray-900 mt-1 line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mt-2 line-clamp-2 text-sm">{post.excerpt}</p>
                {post.primaryKeyword && (
                  <span className="inline-block mt-2 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {post.primaryKeyword}
                  </span>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-12 flex justify-center gap-2" aria-label="Blog pagination">
          {page > 1 && (
            <Link
              href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
