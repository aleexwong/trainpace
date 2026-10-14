import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, X, BookOpen } from "lucide-react";
import BlogCard from "./BlogCard";
import BlogSidebar from "./BlogSidebar";
import { BlogCategory, categoryLabels, categoryColors } from "../types";
import { getAllPosts, getFeaturedPosts, getActiveCategories } from "../utils";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 9;

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get("category") as BlogCategory | null;
  const searchParam = searchParams.get("search") || "";

  const selectedCategory: BlogCategory | "all" = categoryParam || "all";
  const [searchInput, setSearchInput] = useState(searchParam);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const trimmedSearch = searchInput.trim();

  // Keep the input in sync when the URL changes externally (e.g. sidebar tag links).
  useEffect(() => {
    if (searchParam !== searchInput) setSearchInput(searchParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam]);

  // Debounce writing the (live) search term back to the URL so it stays shareable
  // without a page reload per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (trimmedSearch !== searchParam) {
        const params = new URLSearchParams(searchParams);
        if (trimmedSearch) params.set("search", trimmedSearch);
        else params.delete("search");
        setSearchParams(params, { replace: true });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedSearch]);

  // Reset pagination whenever the filters change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, trimmedSearch]);

  const allPosts = useMemo(() => getAllPosts(), []);
  const featuredPosts = useMemo(() => getFeaturedPosts(), []);
  const categories = useMemo(() => getActiveCategories(), []);

  const isFiltering = selectedCategory !== "all" || !!trimmedSearch;

  const filteredPosts = useMemo(() => {
    const query = trimmedSearch.toLowerCase();
    return allPosts.filter((post) => {
      if (selectedCategory !== "all" && post.category !== selectedCategory) {
        return false;
      }
      if (query) {
        return (
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [allPosts, selectedCategory, trimmedSearch]);

  const heroPost = featuredPosts[0] || allPosts[0];
  // On the default view the hero is shown separately, so drop it from the grid.
  const gridPosts = useMemo(() => {
    if (isFiltering) return filteredPosts;
    return filteredPosts.filter((post) => post.slug !== heroPost?.slug);
  }, [filteredPosts, isFiltering, heroPost]);

  const visiblePosts = gridPosts.slice(0, visibleCount);

  const setCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category && category !== "all") params.set("category", category);
    else params.delete("category");
    setSearchParams(params, { replace: true });
  };

  const clearSearch = () => setSearchInput("");

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchParams({}, { replace: true });
  };

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
    <div className="bg-gray-50 text-gray-900 min-h-screen">
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

      {/* Masthead */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            The TrainPace Blog
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Run Smarter, Race Better
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Training tips, race strategy, and nutrition advice — written by
            runners, backed by the science.
          </p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-[72px] z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Search articles"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0">
              <button
                onClick={() => setCategory("all")}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategory === "all"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategory(category)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedCategory === category
                      ? `${categoryColors[category]} border-transparent`
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero featured post (default view only) */}
      {!isFiltering && heroPost && (
        <section className="max-w-6xl mx-auto px-6 pt-10">
          <BlogCard post={heroPost} variant="featured" />
        </section>
      )}

      {/* Main content + sidebar */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_320px] gap-8 lg:gap-10">
          <main>
            <div className="flex items-baseline justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold">
                {trimmedSearch
                  ? `Results for "${trimmedSearch}"`
                  : selectedCategory === "all"
                    ? "Latest Articles"
                    : `${categoryLabels[selectedCategory]} Articles`}
              </h2>
              {isFiltering && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-emerald-600 hover:text-emerald-800 whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>

            {visiblePosts.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {visiblePosts.map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>

                {visibleCount < gridPosts.length && (
                  <div className="text-center mt-10">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="px-8"
                    >
                      Load more articles
                    </Button>
                    <p className="text-sm text-gray-500 mt-3">
                      Showing {visiblePosts.length} of {gridPosts.length}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-700">
                  No articles found.
                </p>
                <p className="mt-2 text-gray-500">
                  Try a different search or category.
                </p>
                <Button onClick={clearAllFilters} className="mt-6">
                  View all articles
                </Button>
              </div>
            )}
          </main>

          <div className="hidden md:block">
            <div className="sticky top-[140px]">
              <BlogSidebar activeCategory={selectedCategory} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to Train Smarter?</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Use our free tools to calculate your paces, plan your nutrition, and
            analyze your race courses.
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
          </div>
        </div>
      </section>
    </div>
  );
}
