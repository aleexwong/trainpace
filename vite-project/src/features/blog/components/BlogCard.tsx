import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { BlogPost, BlogCategory, categoryLabels, categoryColors } from "../types";
import { formatDate } from "../utils";

const categoryAccent: Record<BlogCategory, string> = {
  training:        "bg-blue-500",
  "race-strategy": "bg-violet-500",
  nutrition:       "bg-green-500",
  gear:            "bg-teal-500",
  recovery:        "bg-sky-500",
  beginner:        "bg-emerald-500",
  advanced:        "bg-rose-500",
};

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <article
      className={`
        group bg-white rounded-xl border border-gray-200 overflow-hidden
        hover:border-gray-300 hover:shadow-md transition-all duration-200
        ${featured ? "md:col-span-2 md:flex" : "flex flex-col"}
      `}
    >
      {/* Category color stripe */}
      <div className={`h-1 w-full ${categoryAccent[post.category]} ${featured ? "md:h-auto md:w-1" : ""}`} />

      {/* Content */}
      <div className={`p-5 flex flex-col flex-1 ${featured ? "md:p-7" : ""}`}>
        {/* Category + featured badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[post.category]}`}>
            {categoryLabels[post.category]}
          </span>
          {post.featured && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/blog/${post.slug}`} className="flex-1">
          <h3
            className={`
              font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug
              ${featured ? "text-xl md:text-2xl mb-3" : "text-base mb-2"}
            `}
          >
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className={`text-gray-500 line-clamp-2 mb-4 ${featured ? "text-sm md:text-base" : "text-sm"}`}>
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{formatDate(post.date)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readingTime} min
            </span>
          </div>
          <Link
            to={`/blog/${post.slug}`}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  );
}
