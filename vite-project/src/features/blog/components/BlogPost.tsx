import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Clock, Calendar, Tag, Share2, ChevronRight } from "lucide-react";
import { categoryLabels, categoryColors } from "../types";
import { getPostBySlug, formatDate, getRelatedPosts } from "../utils";
import { Button } from "@/components/ui/button";
import BlogElevationChart from "./BlogElevationChart";
import BlogRouteMap from "./BlogRouteMap";

function stripLeadingH1(content: string): string {
  return content.replace(/^#[^\n]+\n+/, "");
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug || "");

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
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

  const relatedPosts = getRelatedPosts(post.slug, 3);
  const bodyContent = stripLeadingH1(post.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: "TrainPace", url: "https://trainpace.com" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://trainpace.com/blog/${post.slug}` },
    keywords: post.tags.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://trainpace.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://trainpace.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://trainpace.com/blog/${post.slug}` },
    ],
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt, url }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen text-left">
      <Helmet>
        <title>{post.title} | TrainPace Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://trainpace.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://trainpace.com/blog/${post.slug}`} />
        {post.coverImage && <meta property="og:image" content={post.coverImage} />}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Breadcrumb */}
      <nav className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-gray-400">
            <li><Link to="/" className="hover:text-gray-700 transition-colors">Home</Link></li>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <li><Link to="/blog" className="hover:text-gray-700 transition-colors">Blog</Link></li>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <li className="text-gray-600 truncate">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Header */}
      <header className="pt-12 pb-10 px-6 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-left">
          <Link
            to={`/blog?category=${post.category}`}
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5 ${categoryColors[post.category]}`}
          >
            {categoryLabels[post.category]}
          </Link>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] mb-5 text-gray-950">
            {post.title}
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-2xl">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400 border-t border-gray-100 pt-5">
            <span className="font-semibold text-gray-700">{post.author.name}</span>
            {post.author.bio && (
              <span className="hidden sm:inline text-gray-400">{post.author.bio}</span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </header>

      {/* Article Body */}
      <article className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Prose column narrower than header for comfortable reading */}
          <div className="max-w-2xl">
            <div
              className="
                prose prose-gray prose-lg max-w-none text-left
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-950 prose-headings:text-left
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:border-0
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
                prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
                prose-p:text-gray-700 prose-p:leading-[1.85] prose-p:text-[1.05rem] prose-p:text-left
                prose-li:text-gray-700 prose-li:leading-relaxed
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-a:text-emerald-600 prose-a:no-underline prose-a:font-normal hover:prose-a:underline
                prose-blockquote:not-italic prose-blockquote:border-l-[3px] prose-blockquote:border-emerald-400
                prose-blockquote:pl-5 prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:rounded-r
                prose-ul:text-left prose-ol:text-left
                prose-table:text-sm
                prose-thead:bg-gray-50
                prose-th:font-semibold prose-th:text-gray-800
                prose-code:text-sm prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:rounded prose-code:px-1
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) =>
                    href?.startsWith("/") ? (
                      <Link to={href} className="text-emerald-600 hover:underline">{children}</Link>
                    ) : (
                      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
                      <table className="min-w-full">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-200">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-0">{children}</td>
                  ),
                  code: ({ className, children }) =>
                    !className ? (
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[0.875em] text-gray-800 font-mono">{children}</code>
                    ) : (
                      <code className={className}>{children}</code>
                    ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-[3px] border-emerald-400 pl-5 text-gray-600 my-6 not-italic bg-gray-50 py-3 rounded-r-lg">{children}</blockquote>
                  ),
                  hr: () => <hr className="border-gray-200 my-10" />,
                  // Embed syntax: ![elevation-chart](routeKey "caption") or ![route-map](routeKey "caption")
                  img: ({ alt, src, title }) => {
                    if (!src) return null;
                    if (alt === "elevation-chart") {
                      return <BlogElevationChart routeKey={src} caption={title} />;
                    }
                    if (alt === "route-map") {
                      return <BlogRouteMap routeKey={src} caption={title} />;
                    }
                    return <img src={src} alt={alt ?? ""} title={title} className="rounded-lg w-full" />;
                  },
                }}
              >
                {bodyContent}
              </ReactMarkdown>
            </div>
          </div>

          {/* Tags + Share */}
          <div className="max-w-2xl mt-12 pt-8 border-t border-gray-100 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-300 shrink-0" />
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/blog?search=${tag}`}
                  className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Share this article:</span>
              <Button onClick={handleShare} variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Share2 className="w-3.5 h-3.5" />
                Copy link
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Tool nudge */}
      <section className="border-t border-gray-100 bg-gray-50 py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-gray-500 mb-3">Put it into practice — free TrainPace tools:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { to: "/calculator", label: "Pace Calculator" },
              { to: "/vdot", label: "VDOT Score" },
              { to: "/fuel", label: "Fuel Planner" },
              { to: "/elevation-finder", label: "Elevation Finder" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-gray-100 py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Keep reading</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="group block"
                >
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColors[related.category]}`}>
                    {categoryLabels[related.category]}
                  </span>
                  <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug text-sm mb-1">
                    {related.title}
                  </p>
                  <p className="text-xs text-gray-400">{related.readingTime} min read</p>
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700">
                <ArrowLeft className="w-4 h-4" />
                All articles
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
