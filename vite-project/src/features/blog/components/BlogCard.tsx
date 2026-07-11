import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Calendar,
  ArrowRight,
  TrendingUp,
  Apple,
  Flag,
  Footprints,
  HeartPulse,
  Rocket,
  Zap,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { BlogPost, categoryLabels, categoryColors } from "../types";
import { formatDate } from "../utils";

type BlogCardVariant = "default" | "featured" | "horizontal" | "compact";

interface BlogCardProps {
  post: BlogPost;
  /** @deprecated use variant="featured" */
  featured?: boolean;
  variant?: BlogCardVariant;
}

// Deterministic gradient + icon per category, so image-less posts get a distinct
// cover WITHOUT repeating the title (which already appears as the card heading).
const categoryGradients: Record<string, string> = {
  training: "from-blue-500 to-indigo-600",
  nutrition: "from-emerald-500 to-green-600",
  "race-strategy": "from-purple-500 to-fuchsia-600",
  gear: "from-orange-500 to-amber-600",
  recovery: "from-teal-500 to-cyan-600",
  beginner: "from-yellow-500 to-amber-500",
  advanced: "from-rose-500 to-red-600",
};

const categoryIcons: Record<string, LucideIcon> = {
  training: TrendingUp,
  nutrition: Apple,
  "race-strategy": Flag,
  gear: Footprints,
  recovery: HeartPulse,
  beginner: Rocket,
  advanced: Zap,
};

function CoverFallback({
  post,
  showLabel = true,
  className = "",
}: {
  post: BlogPost;
  showLabel?: boolean;
  className?: string;
}) {
  const gradient =
    categoryGradients[post.category] || "from-emerald-500 to-emerald-700";
  const Icon = categoryIcons[post.category] || BookOpen;
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 p-4 text-white ${className}`}
    >
      <Icon className="w-1/4 h-1/4 min-w-6 min-h-6 max-w-12 max-h-12 opacity-90 group-hover:scale-110 transition-transform duration-500" />
      {showLabel && (
        <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
          {categoryLabels[post.category]}
        </span>
      )}
    </div>
  );
}

function CoverVisual({
  post,
  showLabel = true,
  className = "",
}: {
  post: BlogPost;
  showLabel?: boolean;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (post.coverImage && !errored) {
    return (
      <div className={`overflow-hidden bg-gray-100 ${className}`}>
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          onError={() => setErrored(true)}
          // Guard against a "200 but not an image" response (e.g. SPA fallback):
          // a decoded image with zero natural size means the file is missing.
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth === 0) setErrored(true);
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    );
  }
  return (
    <CoverFallback post={post} showLabel={showLabel} className={className} />
  );
}

export default function BlogCard({
  post,
  featured = false,
  variant,
}: BlogCardProps) {
  const resolved: BlogCardVariant = variant ?? (featured ? "featured" : "default");

  // Compact: text-only row for sidebars and "more like this" lists.
  if (resolved === "compact") {
    return (
      <Link
        to={`/blog/${post.slug}`}
        className="group flex gap-3 items-start py-2"
      >
        <CoverVisual
          post={post}
          showLabel={false}
          className="w-16 h-16 rounded-lg shrink-0"
        />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(post.date)}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal: image left, content right — good for dense list rows.
  if (resolved === "horizontal") {
    return (
      <article className="group flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all duration-300">
        <Link
          to={`/blog/${post.slug}`}
          className="sm:w-56 shrink-0"
          aria-label={post.title}
        >
          <CoverVisual post={post} className="aspect-video sm:h-full" />
        </Link>
        <div className="flex flex-col justify-center p-5 sm:pl-0 sm:pr-6 min-w-0">
          <div className="mb-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[post.category]}`}
            >
              {categoryLabels[post.category]}
            </span>
          </div>
          <Link to={`/blog/${post.slug}`}>
            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {post.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </article>
    );
  }

  const isFeatured = resolved === "featured";

  // Default / featured vertical card.
  return (
    <article
      className={`
        group bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col
        hover:border-emerald-300 hover:shadow-lg transition-all duration-300
        ${isFeatured ? "md:col-span-2 md:grid md:grid-cols-2 md:items-stretch" : ""}
      `}
    >
      <Link
        to={`/blog/${post.slug}`}
        aria-label={post.title}
        className={isFeatured ? "md:h-full" : ""}
      >
        <CoverVisual
          post={post}
          className={isFeatured ? "aspect-video md:h-full md:aspect-auto" : "aspect-video"}
        />
      </Link>

      <div className={`p-6 flex flex-col ${isFeatured ? "justify-center" : "flex-1"}`}>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[post.category]}`}
          >
            {categoryLabels[post.category]}
          </span>
          {post.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Featured
            </span>
          )}
        </div>

        <Link to={`/blog/${post.slug}`}>
          <h3
            className={`
              font-bold text-gray-900 group-hover:text-emerald-600 transition-colors
              ${isFeatured ? "text-2xl md:text-3xl mb-3" : "text-xl mb-2"}
            `}
          >
            {post.title}
          </h3>
        </Link>

        <p
          className={`text-gray-600 mb-4 line-clamp-2 ${isFeatured ? "text-base" : "text-sm"}`}
        >
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{post.readingTime} min read</span>
          </div>
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center mt-4 text-emerald-600 font-medium hover:text-emerald-800 transition-colors"
        >
          Read more
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
