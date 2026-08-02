/**
 * Regenerates public/sitemap.xml from the canonical route list.
 *
 * The route list lives in src/lib/seo/routes.ts and is shared with
 * vite.config.ts's prerender config, so a URL can no longer appear in the
 * sitemap without also being prerendered. Run `npm run generate-sitemap`
 * after adding routes; `npm run check:seo-routes` verifies the two agree.
 */

import fs from "fs";
import path from "path";

import { BASE_URL, getSitemapRoutes } from "../src/lib/seo/routes";

const today = new Date().toISOString().slice(0, 10);

function urlEntry(loc: string, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function main() {
  const routes = getSitemapRoutes();

  const entries = routes.map((route) =>
    urlEntry(`${BASE_URL}${route.path}`, route.changefreq, route.priority)
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  const outPath = path.resolve(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf8");

  console.log(`Wrote sitemap: ${outPath} (urls: ${entries.length})`);
}

main();
