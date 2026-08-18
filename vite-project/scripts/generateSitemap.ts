import crypto from "node:crypto";
import fs from "fs";
import path from "path";

import { getAllSeoPaths } from "../src/features/seo-pages/seoPages";
import blogPosts from "../src/data/blog-posts.json";
import { SITE_URL } from "../src/config/site";
import { getPageDoc } from "../src/lib/llm/page-docs";

const BASE_URL = SITE_URL;

const staticPaths: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
  { loc: `${BASE_URL}/calculator`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE_URL}/vdot`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE_URL}/fuel`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE_URL}/plan`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE_URL}/elevation-finder`, changefreq: "monthly", priority: "0.8" },
  { loc: `${BASE_URL}/race`, changefreq: "weekly", priority: "0.7" },
  { loc: `${BASE_URL}/blog`, changefreq: "weekly", priority: "0.8" },
  { loc: `${BASE_URL}/about`, changefreq: "yearly", priority: "0.6" },
  { loc: `${BASE_URL}/mcp`, changefreq: "monthly", priority: "0.6" },
  { loc: `${BASE_URL}/faq`, changefreq: "monthly", priority: "0.7" },
  { loc: `${BASE_URL}/privacy`, changefreq: "yearly", priority: "0.5" },
  { loc: `${BASE_URL}/terms`, changefreq: "yearly", priority: "0.5" },
  // Preview routes
  { loc: `${BASE_URL}/preview-route/boston`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/nyc`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/chicago`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/berlin`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/london`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/tokyo`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/sydney`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE_URL}/preview-route/oslo`, changefreq: "yearly", priority: "0.7" },
  // Blog posts
  ...(blogPosts.posts as Array<{ slug: string; date?: string }>).map((p) => ({
    loc: `${BASE_URL}/blog/${p.slug}`,
    changefreq: "monthly",
    priority: "0.7",
  })),
];

const today = new Date().toISOString().slice(0, 10);

/**
 * Stable `lastmod`.
 *
 * Stamping every URL with today's date on every build makes the whole sitemap
 * claim it changed whenever anything did, which is exactly the signal search
 * engines learn to ignore. Instead each URL carries a fingerprint of its own
 * content — the same PageDoc model that renders its HTML and its .md mirror —
 * and only advances `lastmod` when that fingerprint actually changes.
 *
 * The map lives in `scripts/sitemap-lastmod.json` and is committed; deleting it
 * re-seeds every date to today, so don't.
 */
const STORE_PATH = path.resolve(process.cwd(), "scripts", "sitemap-lastmod.json");
type LastmodEntry = { hash: string; lastmod: string };
const store: Record<string, LastmodEntry> = fs.existsSync(STORE_PATH)
  ? (JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Record<string, LastmodEntry>)
  : {};

function fingerprint(routePath: string): string {
  let source: string;
  try {
    source = JSON.stringify(getPageDoc(routePath));
  } catch {
    // Not a documented route (preview routes, aliases): the path itself is all
    // the content model we have, so its lastmod pins on first sight.
    source = routePath;
  }
  return crypto.createHash("sha1").update(source).digest("hex").slice(0, 12);
}

/** Date to use the first time a URL is seen, before any fingerprint history exists. */
function seedDate(routePath: string): string {
  const slug = routePath.startsWith("/blog/") ? routePath.slice("/blog/".length) : null;
  if (slug) {
    const post = (blogPosts.posts as Array<{ slug: string; date?: string }>).find((p) => p.slug === slug);
    if (post?.date) return post.date.slice(0, 10);
  }
  return today;
}

function lastmodFor(loc: string): string {
  const routePath = loc.slice(BASE_URL.length) || "/";
  const hash = fingerprint(routePath);
  const prev = store[loc];
  const lastmod = prev ? (prev.hash === hash ? prev.lastmod : today) : seedDate(routePath);
  store[loc] = { hash, lastmod };
  return lastmod;
}

function urlEntry(loc: string, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmodFor(loc)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function main() {
  const seoPaths = getAllSeoPaths();

  const seoEntries = seoPaths.map((p) => {
    const loc = `${BASE_URL}${p}`;

    if (p.startsWith("/calculator/")) return urlEntry(loc, "monthly", "0.8");
    if (p.startsWith("/fuel/")) return urlEntry(loc, "monthly", "0.8");
    if (p.startsWith("/elevationfinder/guides/")) return urlEntry(loc, "monthly", "0.7");
    if (p.startsWith("/race/")) return urlEntry(loc, "weekly", "0.7");

    return urlEntry(loc, "monthly", "0.6");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPaths.map((s) => urlEntry(s.loc, s.changefreq, s.priority)),
    "",
    "  <!-- Programmatic SEO Pages -->",
    ...seoEntries,
    "</urlset>",
    "",
  ].join("\n");

  const outPath = path.resolve(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf8");

  const sorted = Object.fromEntries(Object.entries(store).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");

  // eslint-disable-next-line no-console
  const changed = Object.values(store).filter((e) => e.lastmod === today).length;
  console.log(
    `Wrote sitemap: ${outPath} (urls: ${staticPaths.length + seoEntries.length}, lastmod=${today} on ${changed})`
  );
}

main();
