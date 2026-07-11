import { Link } from "react-router-dom";
import { Flame, Layers, Hash, Sparkles } from "lucide-react";
import { BlogCategory, categoryLabels, categoryColors } from "../types";
import { getCategoryCounts, getPopularPosts, getAllTags } from "../utils";
import BlogCard from "./BlogCard";

interface BlogSidebarProps {
  /** Slug of the post currently being read, so it's excluded from popular list. */
  excludeSlug?: string;
  /** Highlight the active category (list page). */
  activeCategory?: BlogCategory | "all";
  /** Max tags to show in the tag cloud. */
  tagLimit?: number;
}

export default function BlogSidebar({
  excludeSlug,
  activeCategory,
  tagLimit = 16,
}: BlogSidebarProps) {
  const categoryCounts = getCategoryCounts();
  const popular = getPopularPosts(5, excludeSlug);
  const tags = getAllTags().slice(0, tagLimit);

  return (
    <aside className="space-y-8">
      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
          <Layers className="w-4 h-4 text-emerald-600" />
          Categories
        </h3>
        <ul className="space-y-1">
          <li>
            <Link
              to="/blog"
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === "all" || activeCategory === undefined
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>All Articles</span>
            </Link>
          </li>
          {categoryCounts.map(({ category, count }) => (
            <li key={category}>
              <Link
                to={`/blog?category=${category}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === category
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{categoryLabels[category]}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[category]}`}
                >
                  {count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular posts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
          <Flame className="w-4 h-4 text-orange-500" />
          Popular Reads
        </h3>
        <div className="divide-y divide-gray-100">
          {popular.map((post) => (
            <BlogCard key={post.slug} post={post} variant="compact" />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900 mb-4">
          <Hash className="w-4 h-4 text-emerald-600" />
          Browse by Topic
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              to={`/blog?search=${encodeURIComponent(tag)}`}
              className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-700 hover:border-emerald-300 hover:text-emerald-600 transition-all"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* CTA card */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
        <Sparkles className="w-6 h-6 mb-3 text-emerald-100" />
        <h3 className="text-lg font-bold mb-2">Train Smarter</h3>
        <p className="text-sm text-emerald-100 mb-4">
          Turn these tips into a plan with our free pace, VDOT, and fueling
          calculators.
        </p>
        <Link
          to="/calculator"
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-white text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
        >
          Open Pace Calculator
        </Link>
      </div>
    </aside>
  );
}
