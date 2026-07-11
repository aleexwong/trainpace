import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Tag,
  Share2,
  ChevronRight,
  List,
} from "lucide-react";
import { categoryLabels, categoryColors } from "../types";
import {
  getPostBySlug,
  formatDate,
  getRelatedPosts,
  getMoreFromCategory,
  getPopularPosts,
  extractHeadings,
  slugifyHeading,
  stripLeadingH1,
} from "../utils";
import BlogCard from "./BlogCard";
import { Button } from "@/components/ui/button";

// Flatten React markdown children into a plain string for heading anchors.
function nodeToText(children: React.ReactNode): string {
  if (children == null) return "";
  if (typeof children === "string" || typeof children === "number")
    return String(children);
  if (Array.isArray(children)) return children.map(nodeToText).join("");
  if (
    typeof children === "object" &&
    "props" in (children as { props?: { children?: React.ReactNode } }) &&
    (children as { props?: { children?: React.ReactNode } }).props
  ) {
    return nodeToText(
      (children as { props: { children?: React.ReactNode } }).props.children
    );
  }
  return "";
}

// Self-contained reading-progress bar. Owns its own scroll listener and state so
// scrolling never re-renders the (expensive) article/markdown tree.
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("article-body");
      if (!el) return;
      const start = el.offsetTop;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - start;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-emerald-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug || "");

  // Scroll to top when navigating between posts.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const headings = useMemo(
    () => (post ? extractHeadings(post.content) : []),
    [post]
  );

  const relatedPosts = useMemo(
    () => (post ? getRelatedPosts(post.slug, 3) : []),
    [post]
  );

  const moreFromCategory = useMemo(() => {
    if (!post) return [];
    const relatedSlugs = new Set(relatedPosts.map((p) => p.slug));
    return getMoreFromCategory(post.category, post.slug, 6).filter(
      (p) => !relatedSlugs.has(p.slug)
    );
  }, [post, relatedPosts]);

  // Sidebar list is intentionally DIFFERENT from the bottom "Related Articles"
  // grid so the same posts aren't shown twice on one page.
  const sidebarPosts = useMemo(() => {
    if (!post) return [];
    const relatedSlugs = new Set(relatedPosts.map((p) => p.slug));
    return getPopularPosts(8, post.slug)
      .filter((p) => !relatedSlugs.has(p.slug))
      .slice(0, 4);
  }, [post, relatedPosts]);

  // Render the markdown once per post — not on every scroll/interaction.
  const renderedContent = useMemo(() => {
    if (!post) return null;
    const headingSeen = new Map<string, number>();
    const makeHeadingId = (children: React.ReactNode): string => {
      let id = slugifyHeading(nodeToText(children));
      const count = headingSeen.get(id) || 0;
      headingSeen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;
      return id;
    };
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={makeHeadingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={makeHeadingId(children)}>{children}</h3>,
          a: ({ href, children }) => {
            const h = href || "";
            // Internal route → client-side link.
            if (h.startsWith("/")) {
              return (
                <Link
                  to={h}
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  {children}
                </Link>
              );
            }
            // In-page anchor → plain link, no new tab.
            if (h.startsWith("#")) {
              return (
                <a href={h} className="text-emerald-600 hover:text-emerald-800">
                  {children}
                </a>
              );
            }
            // Only render an href for safe protocols; otherwise degrade to text
            // (guards against javascript:/data: URLs sneaking through markdown).
            if (!/^(https?:\/\/|mailto:)/i.test(h)) {
              return <span>{children}</span>;
            }
            return (
              <a
                href={h}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-800"
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm text-gray-800">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-gray-700 my-6">
              {children}
            </blockquote>
          ),
        }}
      >
        {stripLeadingH1(post.content)}
      </ReactMarkdown>
    );
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Post Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author.name },
    publisher: {
      "@type": "Organization",
      name: "TrainPace",
      url: "https://trainpace.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://trainpace.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://trainpace.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://trainpace.com/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://trainpace.com/blog/${post.slug}`,
      },
    ],
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url });
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <Helmet>
        <title>{post.title} | TrainPace Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://trainpace.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://trainpace.com/blog/${post.slug}`} />
        {post.coverImage && <meta property="og:image" content={post.coverImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <ReadingProgressBar />

      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link to="/" className="text-gray-500 hover:text-emerald-600">
                Home
              </Link>
            </li>
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <li>
              <Link to="/blog" className="text-gray-500 hover:text-emerald-600">
                Blog
              </Link>
            </li>
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <li className="text-gray-900 font-medium truncate max-w-[200px]">
              {post.title}
            </li>
          </ol>
        </div>
      </nav>

      {/* Article Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="max-w-3xl">
            <div className="mb-4">
              <Link
                to={`/blog?category=${post.category}`}
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${categoryColors[post.category]}`}
              >
                {categoryLabels[post.category]}
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {post.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {post.author.name}
                  </div>
                  {post.author.bio && (
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {post.author.bio}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {post.readingTime} min read
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body: article + sidebar */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px] gap-8 lg:gap-10">
          {/* Article */}
          <article id="article-body">
            {post.coverImage && (
              <CoverImage post={post} />
            )}

            <div className="prose prose-lg max-w-none text-left prose-headings:scroll-mt-28 prose-a:text-emerald-600 hover:prose-a:text-emerald-800">
              {renderedContent}
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-5 h-5 text-gray-400" aria-hidden="true" />
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-gray-600 font-medium">
                Share this article:
              </span>
              <Button onClick={handleShare} variant="outline" className="gap-2">
                <Share2 className="w-5 h-5" aria-hidden="true" />
                Share
              </Button>
            </div>

            {/* Author box */}
            <div className="mt-10 p-6 bg-white rounded-xl border border-gray-200 flex gap-4">
              <div className="w-14 h-14 shrink-0 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                {post.author.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm text-gray-500">Written by</div>
                <div className="text-lg font-bold text-gray-900">
                  {post.author.name}
                </div>
                {post.author.bio && (
                  <p className="text-sm text-gray-600 mt-1">{post.author.bio}</p>
                )}
              </div>
            </div>
          </article>

          {/* Sticky sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-[96px] space-y-8">
              {headings.length >= 3 && (
                <nav
                  className="bg-white rounded-xl border border-gray-200 p-5"
                  aria-label="Table of contents"
                >
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
                    <List className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    In this article
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                        <a
                          href={`#${h.id}`}
                          className="text-gray-600 hover:text-emerald-600 focus-visible:text-emerald-600 focus-visible:underline outline-none transition-colors block leading-snug"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {sidebarPosts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
                    Popular Reads
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {sidebarPosts.map((rp) => (
                      <BlogCard key={rp.slug} post={rp} variant="compact" />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
                <h2 className="text-lg font-bold mb-2">Put it into practice</h2>
                <p className="text-sm text-emerald-100 mb-4">
                  Dial in your paces with the free calculator.
                </p>
                <Link
                  to="/calculator"
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-white text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                >
                  Open Pace Calculator
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-6 bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Related Articles</h2>
              <Link
                to="/blog"
                className="text-sm text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* More from this category */}
      {moreFromCategory.length > 0 && (
        <section className="py-12 px-6 bg-gray-50 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                More in {categoryLabels[post.category]}
              </h2>
              <Link
                to={`/blog?category=${post.category}`}
                className="text-sm text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                See all <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-4">
              {moreFromCategory.map((cp) => (
                <BlogCard key={cp.slug} post={cp} variant="horizontal" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 text-center bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Put This Knowledge to Use</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Try our free tools to apply what you've learned.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/calculator"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
            >
              Pace Calculator
            </Link>
            <Link
              to="/fuel"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Fuel Planner
            </Link>
            <Link
              to="/elevation-finder"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Elevation Finder
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Article hero image with graceful fallback if the cover 404s.
function CoverImage({ post }: { post: { coverImage?: string; title: string } }) {
  const [errored, setErrored] = useState(false);
  if (!post.coverImage || errored) return null;
  return (
    <img
      src={post.coverImage}
      alt={post.title}
      onError={() => setErrored(true)}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth === 0) setErrored(true);
      }}
      className="w-full rounded-xl mb-8 object-cover"
    />
  );
}
