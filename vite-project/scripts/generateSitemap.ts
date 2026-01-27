import fs from "fs";
import path from "path";

import { getAllSeoPaths } from "../src/features/seo-pages/seoPages";

const BASE_URL = "https://www.trainpace.com";

const staticPaths: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: `${BASE_URL}/`, changefreq: "weekly", priority: "1.0" },
  { loc: `${BASE_URL}/calculator`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE_URL}/fuel`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE_URL}/elevationfinder`, changefreq: "monthly", priority: "0.8" },
  { loc: `${BASE_URL}/race`, changefreq: "weekly", priority: "0.7" },
  { loc: `${BASE_URL}/dashboard`, changefreq: "weekly", priority: "0.7" },
  { loc: `${BASE_URL}/about`, changefreq: "yearly", priority: "0.6" },
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
];

const today = new Date().toISOString().slice(0, 10);

function urlEntry(loc: string, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
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

  // eslint-disable-next-line no-console
  console.log(`Wrote sitemap: ${outPath} (urls: ${staticPaths.length + seoEntries.length})`);
}

main();
