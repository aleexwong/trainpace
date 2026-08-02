/**
 * Canonical crawlable-route list.
 *
 * This is the SINGLE source of truth for which URLs are prerendered and which
 * URLs appear in sitemap.xml. It is consumed by:
 *   - `vite.config.ts`            → `additionalPrerenderRoutes`
 *   - `scripts/generateSitemap.ts` → sitemap.xml
 *   - `scripts/checkSeoRoutes.ts`  → CI drift check against built output
 *
 * Previously these were two hand-maintained lists that silently drifted: /faq,
 * /about, /privacy and /terms were submitted to Google but never prerendered
 * (crawlers got an empty shell), and /dashboard was in the sitemap while
 * robots.txt disallowed it. Add a route here and all three stay in step.
 *
 * Rules:
 *   - Anything auth-gated (/dashboard, /settings, /onboarding) or auth-flow
 *     (/login, /register, ...) must NOT be listed. Those are `Disallow`ed in
 *     public/robots.txt; listing them here contradicts robots and burns crawl
 *     budget on a login wall.
 *   - `sitemap: false` prerenders a route without advertising it — use it for
 *     duplicate-content aliases that canonicalise elsewhere.
 *
 * Imports must stay relative: this module is loaded by `vite.config.ts`, which
 * is evaluated before the `@` alias exists.
 */

import blogPosts from "../../data/blog-posts.json";
import { getAllSeoPaths } from "../../features/seo-pages/seoPages";

export const BASE_URL = "https://www.trainpace.com";

export interface CrawlableRoute {
  /** Path, root-relative, no trailing slash (except "/"). */
  path: string;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: string;
  /**
   * Set false to prerender the route but keep it out of sitemap.xml.
   * Used for alias routes that canonicalise to another URL.
   */
  sitemap?: boolean;
}

/**
 * Hand-maintained routes: the app's fixed pages.
 * Programmatic SEO pages and blog posts are appended automatically below.
 */
const STATIC_ROUTES: CrawlableRoute[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/calculator", changefreq: "monthly", priority: "0.9" },
  { path: "/vdot", changefreq: "monthly", priority: "0.9" },
  { path: "/fuel", changefreq: "monthly", priority: "0.9" },
  { path: "/plan", changefreq: "monthly", priority: "0.9" },
  { path: "/elevation-finder", changefreq: "monthly", priority: "0.8" },
  // Legacy alias — must keep working, but /elevation-finder is canonical.
  { path: "/elevationfinder", changefreq: "monthly", priority: "0.8" },
  { path: "/race", changefreq: "weekly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "yearly", priority: "0.6" },
  // /ethos renders the same component as /about; prerender it so the URL in
  // robots.txt resolves, but keep it out of the sitemap to avoid duplicate content.
  { path: "/ethos", changefreq: "yearly", priority: "0.6", sitemap: false },
  { path: "/mcp", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.5" },
  { path: "/terms", changefreq: "yearly", priority: "0.5" },
  { path: "/preview-route/boston", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/nyc", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/chicago", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/berlin", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/london", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/tokyo", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/sydney", changefreq: "yearly", priority: "0.7" },
  { path: "/preview-route/oslo", changefreq: "yearly", priority: "0.7" },
];

/** Priority/changefreq for a programmatic SEO path, by URL prefix. */
function seoRouteMeta(path: string): Omit<CrawlableRoute, "path"> {
  if (path.startsWith("/calculator/")) return { changefreq: "monthly", priority: "0.8" };
  if (path.startsWith("/fuel/")) return { changefreq: "monthly", priority: "0.8" };
  if (path.startsWith("/elevationfinder/guides/"))
    return { changefreq: "monthly", priority: "0.7" };
  if (path.startsWith("/race/")) return { changefreq: "weekly", priority: "0.7" };
  return { changefreq: "monthly", priority: "0.6" };
}

/**
 * Every crawlable route: static pages, programmatic SEO pages, blog posts.
 */
export function getCrawlableRoutes(): CrawlableRoute[] {
  const seoRoutes = getAllSeoPaths().map((path) => ({
    path,
    ...seoRouteMeta(path),
  }));

  const blogRoutes = (blogPosts.posts as Array<{ slug: string }>).map((post) => ({
    path: `/blog/${post.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  }));

  return [...STATIC_ROUTES, ...seoRoutes, ...blogRoutes];
}

/** Paths to prerender — every crawlable route, including sitemap-excluded aliases. */
export function getPrerenderPaths(): string[] {
  return getCrawlableRoutes().map((route) => route.path);
}

/** Routes that belong in sitemap.xml. */
export function getSitemapRoutes(): CrawlableRoute[] {
  return getCrawlableRoutes().filter((route) => route.sitemap !== false);
}
