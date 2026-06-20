import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Clock,
  Calendar,
  ChevronRight,
  Dumbbell,
  Apple,
  Trophy,
  Backpack,
  Heart,
  Star,
  Zap,
  ArrowRight,
} from "lucide-react";
import BlogCard from "./BlogCard";
import { BlogCategory, categoryLabels, categoryColors } from "../types";
import {
  getAllPosts,
  getFeaturedPosts,
  getActiveCategories,
  formatDate,
} from "../utils";

const categoryIcons: Record<BlogCategory, typeof Dumbbell> = {
  training: Dumbbell,
  nutrition: Apple,
  "race-strategy": Trophy,
  gear: Backpack,
  recovery: Heart,
  beginner: Star,
  advanced: Zap,
};


export default function BlogList() {
  const [selectedCategory, setSelectedCategory] = useState<
    BlogCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const categories = getActiveCategories();

  const filteredPosts = allPosts.filter((post) => {
    if (selectedCategory !== "all" && post.category !== selectedCategory)
      return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const heroPost = featuredPosts[0] ?? allPosts[0];
  const isFiltering = selectedCategory !== "all" || searchQuery;

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "TrainPace Blog",
    description:
      "Running tips, training guides, and race strategy advice for marathoners and distance runners",
    url: "https://trainpace.com/blog",
    publisher: {
      "@type": "Organization",
      name: "TrainPace",
      url: "https://trainpace.com",
    },
    blogPost: allPosts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      url: `https://trainpace.com/blog/${post.slug}`,
      author: { "@type": "Person", name: post.author.name },
    })),
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Helmet>
        <title>
          Running Blog - Training Tips, Race Strategy & Nutrition | TrainPace
        </title>
        <meta
          name="description"
          content="Expert running advice for marathoners and distance runners. Training tips, race strategy guides, nutrition planning, and more from TrainPace."
        />
        <link rel="canonical" href="https://trainpace.com/blog" />
        <script type="application/ld+json">{JSON.stringify(blogSchema)}</script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-900 text-white overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left: headline + search */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-5">
                TrainPace Journal
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                Run smarter.
                <br />
                <span className="text-emerald-400">Race faster.</span>
              </h1>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Science-backed guides for every level — from first 5K to Boston
                qualifier.
              </p>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-8">
                <div>
                  <p className="text-2xl font-bold text-white">{allPosts.length}+</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Articles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{categories.length}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Topics</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Free</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Always</p>
                </div>
              </div>
            </div>

            {/* Right: hero article card */}
            {heroPost && (
              <Link
                to={`/blog/${heroPost.slug}`}
                className="group block bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-500/40 transition-all duration-300"
              >
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${categoryColors[heroPost.category]}`}
                >
                  {categoryLabels[heroPost.category]}
                </span>
                <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-3">
                  {heroPost.title}
                </h2>
                <p className="text-gray-400 text-sm line-clamp-3 mb-5">
                  {heroPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(heroPost.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {heroPost.readingTime} min
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Category tiles ── */}
      {!isFiltering && (
        <section className="border-b border-gray-100 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">
              Browse by topic
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat];
                const count = allPosts.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all duration-200 group text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 leading-tight">
                      {categoryLabels[cat]}
                    </span>
                    <span className="text-xs text-gray-400">{count} articles</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Active filter bar ── */}
      {isFiltering && (
        <section className="sticky top-[71px] z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="text-sm text-gray-500 hover:text-emerald-600 underline"
            >
              ← All topics
            </button>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
            {searchQuery && (
              <span className="ml-auto text-sm text-gray-500">
                Results for "<strong>{searchQuery}</strong>"
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Featured articles (default view only) ── */}
      {!isFiltering && featuredPosts.length > 1 && (
        <section className="py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                Editor's picks
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(1, 3).map((post) => (
                <BlogCard key={post.slug} post={post} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Tool CTA strip ── */}
      {!isFiltering && (
        <section className="py-10 px-6 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-1">
                Free tools for runners
              </p>
              <h3 className="text-2xl font-bold">Put the advice into action.</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/calculator"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors text-sm"
              >
                Pace Calculator <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/fuel"
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700/40 text-white font-semibold rounded-xl hover:bg-emerald-700/60 transition-colors text-sm border border-white/20"
              >
                Fuel Planner <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/vdot"
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700/40 text-white font-semibold rounded-xl hover:bg-emerald-700/60 transition-colors text-sm border border-white/20"
              >
                VDOT Score <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── All articles grid ── */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory === "all"
                ? "Latest articles"
                : `${categoryLabels[selectedCategory]}`}
              {searchQuery && (
                <span className="text-gray-500 font-normal ml-2 text-base">
                  matching "{searchQuery}"
                </span>
              )}
            </h2>
            <span className="text-sm text-gray-400">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium text-gray-600">No articles found.</p>
              <p className="mt-1 text-sm">
                Try a different search or{" "}
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                  className="text-emerald-600 underline"
                >
                  browse all topics
                </button>
                .
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
