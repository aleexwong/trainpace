import blogData from "@/data/blog-posts.json";
import { BlogPost, BlogCategory } from "./types";

// Type assertion for imported JSON data
const posts = blogData.posts as BlogPost[];

// Get all blog posts, sorted by date (newest first)
export function getAllPosts(): BlogPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Get a single post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

// Get posts by category
export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((post) => post.category === category);
}

// Get featured posts
export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter((post) => post.featured);
}

// Get posts by tag
export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

// Get all unique tags
export function getAllTags(): string[] {
  const tags = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

// Get all categories that have posts
export function getActiveCategories(): BlogCategory[] {
  const categories = new Set<BlogCategory>();
  posts.forEach((post) => {
    categories.add(post.category);
  });
  return Array.from(categories);
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Get related posts (same category or shared tags, excluding current)
export function getRelatedPosts(
  currentSlug: string,
  limit: number = 3
): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return [];

  const otherPosts = getAllPosts().filter((post) => post.slug !== currentSlug);

  // Score posts by relevance
  const scored = otherPosts.map((post) => {
    let score = 0;

    // Same category = high relevance
    if (post.category === currentPost.category) {
      score += 3;
    }

    // Shared tags = additional relevance
    const sharedTags = post.tags.filter((tag) =>
      currentPost.tags.includes(tag)
    );
    score += sharedTags.length;

    return { post, score };
  });

  // Sort by score, then by date
  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    })
    .slice(0, limit)
    .map((item) => item.post);
}

// Get all post slugs (useful for prerendering)
export function getAllPostSlugs(): string[] {
  return posts.map((post) => post.slug);
}
