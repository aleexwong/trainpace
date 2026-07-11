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

// Get the most recent posts (optionally excluding one slug)
export function getRecentPosts(
  limit: number = 5,
  excludeSlug?: string
): BlogPost[] {
  return getAllPosts()
    .filter((post) => post.slug !== excludeSlug)
    .slice(0, limit);
}

// Get "popular" posts — featured first, then newest (optionally excluding one slug)
export function getPopularPosts(
  limit: number = 5,
  excludeSlug?: string
): BlogPost[] {
  return getAllPosts()
    .filter((post) => post.slug !== excludeSlug)
    .sort((a, b) => {
      const fa = a.featured ? 1 : 0;
      const fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, limit);
}

// Get more posts from the same category (excluding the current post)
export function getMoreFromCategory(
  category: BlogCategory,
  excludeSlug: string,
  limit: number = 4
): BlogPost[] {
  return getAllPosts()
    .filter((post) => post.category === category && post.slug !== excludeSlug)
    .slice(0, limit);
}

// Count posts per category (for sidebar navigation)
export function getCategoryCounts(): { category: BlogCategory; count: number }[] {
  const counts = new Map<BlogCategory, number>();
  posts.forEach((post) => {
    counts.set(post.category, (counts.get(post.category) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// Drop a leading H1 from markdown so the page header can own the single H1.
// Every post starts with "# Title", which would otherwise duplicate the header.
export function stripLeadingH1(content: string): string {
  const lines = content.split("\n");
  let i = 0;
  // Skip any leading blank lines
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && /^#\s+/.test(lines[i])) {
    lines.splice(0, i + 1);
    // Also drop the blank line(s) immediately after the removed heading
    while (lines.length && lines[0].trim() === "") lines.shift();
    return lines.join("\n");
  }
  return content;
}

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

// Slugify heading text into an anchor id (mirrors what we set on rendered headings)
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Extract h2/h3 headings from markdown content for a table of contents
export function extractHeadings(content: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const seen = new Map<string, number>();
  // Only match top-level markdown headings, skip fenced code blocks
  let inCodeBlock = false;
  content.split("\n").forEach((line) => {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;
    const match = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!match) return;
    const level = match[1].length;
    const text = match[2].trim();
    let id = slugifyHeading(text);
    // Ensure unique ids for duplicate headings
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    headings.push({ id, text, level });
  });
  return headings;
}
