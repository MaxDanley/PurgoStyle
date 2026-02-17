import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { markdownContentToHtml } from "@/lib/blog-seo";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.summersteez.com";
const SITE_NAME = "Grade A Tree Care";

type FaqItem = { question: string; answer: string };

function stripFirstH1(content: string): string {
  return content.replace(/^#\s+.+\n?/, "").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: {
      title: true,
      metaDescription: true,
      keywords: true,
      excerpt: true,
      publishedAt: true,
      featuredImage: true,
    },
  });
  if (!post) return { title: "Post Not Found" };
  const url = `${BASE_URL}/blog/${slug}`;
  const imagePath = post.featuredImage ?? "/images/blog/defaults/default-1.webp";
  const imageUrl = imagePath.startsWith("http") ? imagePath : `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  const imageAlt = `${post.primaryKeyword ?? post.title} - ${post.title} | ${SITE_NAME} Kansas City`;
  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.metaDescription,
    keywords: post.keywords?.join(", "),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
  });
  if (!post) notFound();

  const contentNoH1 = stripFirstH1(post.content);
  const htmlContent = markdownContentToHtml(contentNoH1);
  const faqSchema = (post.faqSchema as FaqItem[] | null) ?? [];
  const publishedAt = post.publishedAt ?? post.createdAt;

  // Table of contents from H2s in content
  const h2Matches = contentNoH1.match(/^##\s+(.+)$/gm) ?? [];
  const toc = h2Matches.map((line, i) => {
    const title = line.replace(/^##\s+/, "").trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { id, title };
  });

  const related = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true },
  });

  const imagePath = post.featuredImage ?? "/images/blog/defaults/default-1.webp";
  const imageUrl = imagePath.startsWith("http") ? imagePath : `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  const imageAlt = `${post.primaryKeyword ?? post.title} - ${post.title} | ${SITE_NAME} Kansas City`;
  const imageCaption = `Professional ${post.primaryKeyword ?? "tree care"} services in the Kansas City metro area — ${SITE_NAME}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
    datePublished: publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${slug}` },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqSchema.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${BASE_URL}/blog/${slug}` },
    ],
  };

  return (
    <div className="container-custom py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
        <ol className="flex flex-wrap gap-x-2 gap-y-1">
          <li><Link href="/" className="hover:text-gray-700">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/blog" className="hover:text-gray-700">Blog</Link></li>
          <li aria-hidden>/</li>
          <li className="text-gray-900 font-medium" aria-current="page">{post.title}</li>
        </ol>
      </nav>

      <article>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-8">
          <time dateTime={publishedAt.toISOString()}>
            Published {publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </time>
          {post.updatedAt.getTime() !== publishedAt.getTime() && (
            <span>Updated {post.updatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          )}
        </div>
        <p className="text-lg text-gray-600 mb-2">By {SITE_NAME} team</p>

        <figure className="mb-10">
          <picture>
            {imagePath.endsWith(".webp") && (
              <source srcSet={imagePath.startsWith("http") ? imagePath : `${BASE_URL}${imagePath}`} type="image/webp" />
            )}
            <img
              src={imageUrl}
              alt={imageAlt}
              width={1200}
              height={630}
              loading="eager"
              fetchPriority="high"
              className="w-full aspect-[1200/630] object-cover rounded-xl"
            />
          </picture>
          <figcaption className="text-sm text-gray-500 mt-2 italic">
            {imageCaption}
          </figcaption>
        </figure>

        {toc.length > 0 && (
          <nav className="bg-gray-50 rounded-lg p-6 mb-10" aria-label="Table of contents">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Table of contents</h2>
            <ul className="space-y-2">
              {toc.map(({ id, title }) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-brand-600 hover:underline">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div
          className="prose prose-lg max-w-none blog-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {faqSchema.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-10" aria-label="FAQ">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqSchema.map((q, i) => (
                <details key={i} className="group rounded-lg border border-gray-200 bg-white p-4">
                  <summary className="font-medium text-gray-900 cursor-pointer list-none">
                    <span className="group-open:inline-hidden">{q.question}</span>
                  </summary>
                  <p className="mt-2 text-gray-600">{q.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 bg-brand-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional tree care in Kansas City</h2>
          <p className="text-gray-700 mb-4">
            Join our Annual Tree Care Program for $75/year and keep your trees healthy year-round.
          </p>
          <Link
            href="/tree-care-program"
            className="inline-block px-6 py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600"
          >
            Learn about the program
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related posts</h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="text-brand-600 hover:underline font-medium">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
