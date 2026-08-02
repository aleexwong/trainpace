/**
 * CI guard against SEO route drift.
 *
 * Historically the sitemap and the prerender list were maintained separately and
 * fell out of step: /faq, /about, /privacy and /terms were advertised to Google
 * but shipped as an empty shell, and /dashboard was in the sitemap while
 * robots.txt disallowed it. Both lists now derive from src/lib/seo/routes.ts;
 * this script proves that stayed true, and that the committed sitemap.xml is
 * not stale.
 *
 * Checks:
 *   1. Committed sitemap.xml lists exactly the routes the generator would emit.
 *   2. Every sitemap URL has a prerendered HTML file (skipped if dist/ absent).
 *   3. No sitemap URL is Disallow'd in robots.txt.
 *
 * Run: npm run check:seo-routes   (after npm run build, for check 2)
 */

import fs from "fs";
import path from "path";

import { BASE_URL, getSitemapRoutes, getPrerenderPaths } from "../src/lib/seo/routes";

const root = process.cwd();
const sitemapPath = path.resolve(root, "public", "sitemap.xml");
const robotsPath = path.resolve(root, "public", "robots.txt");
const distDir = path.resolve(root, "dist");

const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

/** Paths listed in the committed sitemap.xml, root-relative. */
function readSitemapPaths(): string[] {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs.map((loc) => loc.replace(BASE_URL, "") || "/");
}

/** Disallow rules from the `User-agent: *` block of robots.txt. */
function readWildcardDisallows(): string[] {
  const lines = fs.readFileSync(robotsPath, "utf8").split("\n");
  const disallows: string[] = [];
  let inWildcardBlock = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;

    const uaMatch = line.match(/^User-agent:\s*(.+)$/i);
    if (uaMatch) {
      inWildcardBlock = uaMatch[1].trim() === "*";
      continue;
    }

    const disallowMatch = line.match(/^Disallow:\s*(.+)$/i);
    if (disallowMatch && inWildcardBlock) {
      disallows.push(disallowMatch[1].trim());
    }
  }

  return disallows;
}

/** Where the prerenderer writes a route's HTML. */
function htmlPathFor(route: string): string {
  return route === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, route, "index.html");
}

function main() {
  const expected = getSitemapRoutes().map((r) => r.path);
  const expectedSet = new Set(expected);

  // 1. Committed sitemap matches the generator.
  const actual = readSitemapPaths();
  const actualSet = new Set(actual);

  for (const route of expected) {
    if (!actualSet.has(route)) {
      fail(`sitemap.xml is missing ${route} — run \`npm run generate-sitemap\``);
    }
  }
  for (const route of actual) {
    if (!expectedSet.has(route)) {
      fail(`sitemap.xml lists ${route}, which is not in src/lib/seo/routes.ts — run \`npm run generate-sitemap\``);
    }
  }

  // 2. Every advertised URL is actually prerendered.
  if (fs.existsSync(distDir)) {
    for (const route of expected) {
      if (!fs.existsSync(htmlPathFor(route))) {
        fail(`${route} is in the sitemap but has no prerendered HTML in dist/ — crawlers get an empty shell`);
      }
    }
  } else {
    console.log("dist/ not found — skipping prerender-output check (run `npm run build` first)");
  }

  // 3. Nothing advertised is also blocked.
  const disallows = readWildcardDisallows();
  for (const route of expected) {
    const blocked = disallows.find(
      (rule) => rule !== "/" && (route === rule || route.startsWith(`${rule}/`))
    );
    if (blocked) {
      fail(`${route} is in the sitemap but robots.txt has \`Disallow: ${blocked}\` — contradictory signal to crawlers`);
    }
  }

  // Prerender-only routes (sitemap: false) still need to be prerendered.
  const sitemapOnly = new Set(expected);
  const prerenderExtras = getPrerenderPaths().filter((p) => !sitemapOnly.has(p));

  if (errors.length > 0) {
    console.error(`\nSEO route check failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):\n`);
    for (const error of errors) {
      console.error(`  ✗ ${error}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(
    `SEO routes OK — ${expected.length} sitemap URLs, ` +
      `${prerenderExtras.length} prerender-only alias${prerenderExtras.length === 1 ? "" : "es"}, no robots.txt conflicts.`
  );
}

main();
