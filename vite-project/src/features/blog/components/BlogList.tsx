import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, Tag, Filter } from "lucide-react";
import BlogCard from "./BlogCard";
import {
  BlogCategory,
  categoryLabels,
  categoryColors,
} from "../types";
import {
  getAllPosts,
  getFeaturedPosts,
  getActiveCategories,
  getAllTags,
} from "../utils";

export default function BlogList() {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const categories = getActiveCategories();
  const tags = getAllTags();

  // Filter posts
  const filteredPosts = allPosts.filter((post) => {
    // Category filter
    if (selectedCategory !== "all" && post.category !== selectedCategory) {
      return false;
    }

    // Search filter
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

  // Schema for blog listing
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "TrainPace Blog",
    description: "Running tips, training guides, and race strategy advice for marathoners and distance runners",
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
      author: {
        "@type": "Person",
        name: post.author.name,
      },
    })),
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Helmet>
        <title>Running Blog - Training Tips, Race Strategy & Nutrition | TrainPace</title>
        <meta
          name="description"
          content="Expert running advice for marathoners and distance runners. Training tips, race strategy guides, nutrition planning, and more from TrainPace."
        />
        <link rel="canonical" href="https://trainpace.com/blog" />
        <script type="application/ld+json">{JSON.stringify(blogSchema)}</script>
      </Helmet>

      {/* Header */}
      <section className="py-12 px-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            TrainPace Blog
          </h1>
          <p className="text-lg text-gray-600">
            Training tips, race strategy, and nutrition advice for runners
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="sticky top-[71px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Filter toggle (mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>

            {/* Category filters (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${
                      selectedCategory === category
                        ? categoryColors[category]
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile filters dropdown */}
          {showFilters && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setShowFilters(false);
                  }}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowFilters(false);
                    }}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${
                        selectedCategory === category
                          ? categoryColors[category]
                          : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === "all" && !searchQuery && featuredPosts.length > 0 && (
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post) => (
                <BlogCard key={post.slug} post={post} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">
            {selectedCategory === "all"
              ? "All Articles"
              : `${categoryLabels[selectedCategory]} Articles`}
            {searchQuery && ` matching "${searchQuery}"`}
          </h2>

          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No articles found.</p>
              <p className="mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Tags Section */}
      {selectedCategory === "all" && !searchQuery && (
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Tag className="w-6 h-6" />
              Browse by Topic
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to Train Smarter?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Use our free tools to calculate your paces, plan your nutrition, and analyze your race courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/calculator"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Pace Calculator
            </a>
            <a
              href="/fuel"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Fuel Planner
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
