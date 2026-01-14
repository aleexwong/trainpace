import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { BlogPost, categoryLabels, categoryColors } from "../types";
import { formatDate } from "../utils";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <article
      className={`
        group bg-white rounded-xl border border-gray-200 overflow-hidden
        hover:border-blue-300 hover:shadow-lg transition-all duration-300
        ${featured ? "md:col-span-2 md:grid md:grid-cols-2" : ""}
      `}
    >
      {/* Image placeholder - can be enabled if coverImage is provided */}
      {post.coverImage && (
        <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className={`p-6 ${featured ? "flex flex-col justify-center" : ""}`}>
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${categoryColors[post.category]}
            `}
          >
            {categoryLabels[post.category]}
          </span>
          {post.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3
            className={`
              font-bold text-gray-900 group-hover:text-blue-600 transition-colors
              ${featured ? "text-2xl md:text-3xl mb-3" : "text-xl mb-2"}
            `}
          >
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p
          className={`
            text-gray-600 mb-4 line-clamp-2
            ${featured ? "text-base" : "text-sm"}
          `}
        >
          {post.excerpt}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{post.readingTime} min read</span>
          </div>
        </div>

        {/* Read more link */}
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center mt-4 text-blue-600 font-medium hover:text-blue-800 transition-colors"
        >
          Read more
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}
