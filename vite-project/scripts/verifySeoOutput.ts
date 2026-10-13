/**
 * Verifies the SEO and agent-facing build output in dist/.
 *
 * Runs at the end of `npm run build`, so a regression fails the build instead
 * of shipping. It checks what a crawler actually receives — the static files —
 * not the code that produced them:
 *
 * - every prerendered page has exactly one title, description, and canonical,
 *   on the www host, pointing at the page's own canonical path;
 * - no page silently fell back to the generic "TrainPace – Free Running Tools"
 *   content, and no deep page claims the home page as its canonical;
 * - every page's JSON-LD parses;
 * - the sitemap lists exactly the indexable pages;
 * - every link in llms.txt resolves to a file in dist;
 * - the app shell (served for non-prerendered routes) is noindex with no
 *   canonical;
 * - no output file uses the bare trainpace.com host.
 *
 * Title and description length are reported as warnings: search engines
 * truncate rather than penalize, so they should not block a release.
 *
 * Run with: npm run verify-seo (after vite build + generate-markdown)
 */

/* eslint-disable no-console -- this script's output is the point */

import fs from "fs";
import path from "path";

import {
  getAllDocPaths,
  getCanonicalPath,
  getIndexablePaths,
} from "../src/lib/llm/page-docs";
import { absoluteUrl, markdownPathForRoute } from "../src/lib/llm/markdown";

const DIST = path.resolve(process.cwd(), "dist");
const GENERIC_TITLE = "TrainPace – Free Running Tools";
const BARE_HOST = /https?:\/\/trainpace\.com/;

const errors: string[] = [];
const warnings: string[] = [];

function htmlFileFor(route: string): string {
  return route === "/"
    ? path.join(DIST, "index.html")
    : path.join(DIST, route.replace(/^\//, ""), "index.html");
}

function all(re: RegExp, text: string): RegExpExecArray[] {
  return [...text.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`))];
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// ── Prerendered pages ──────────────────────────────────────────────────────

for (const route of getAllDocPaths()) {
  const file = htmlFileFor(route);
  if (!fs.existsSync(file)) {
    errors.push(`${route}: no prerendered HTML at ${path.relative(DIST, file)}`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const head = html.slice(0, html.indexOf("</head>"));

  const titles = all(/<title>([\s\S]*?)<\/title>/, head);
  const descriptions = all(/<meta[^>]*name="description"[^>]*content="([^"]*)"/, head);
  const canonicals = all(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/, head);

  if (titles.length !== 1) errors.push(`${route}: ${titles.length} <title> tags`);
  if (descriptions.length !== 1) errors.push(`${route}: ${descriptions.length} meta descriptions`);
  if (canonicals.length !== 1) errors.push(`${route}: ${canonicals.length} canonical links`);

  const title = titles[0] ? decode(titles[0][1]) : "";
  const description = descriptions[0] ? decode(descriptions[0][1]) : "";
  const canonical = canonicals[0]?.[1] ?? "";

  const expected = absoluteUrl(getCanonicalPath(route));
  if (canonical && canonical !== expected) {
    errors.push(`${route}: canonical ${canonical}, expected ${expected}`);
  }
  if (title === GENERIC_TITLE) {
    errors.push(`${route}: generic fallback title — add it to getPageTitle/getContentBlocks`);
  }
  if (!/<h1[\s>]/.test(html)) errors.push(`${route}: no <h1> in prerendered body`);

  for (const [, json] of all(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/, html)) {
    try {
      JSON.parse(json);
    } catch {
      errors.push(`${route}: JSON-LD does not parse`);
    }
  }

  if (title.length > 60) warnings.push(`${route}: title ${title.length} chars`);
  if (description.length > 160) warnings.push(`${route}: description ${description.length} chars`);

  const md = path.join(DIST, markdownPathForRoute(route).replace(/^\//, ""));
  if (!fs.existsSync(md)) errors.push(`${route}: no Markdown mirror`);
}

// ── Sitemap ────────────────────────────────────────────────────────────────

const sitemapPath = path.join(DIST, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  errors.push("dist/sitemap.xml missing");
} else {
  const locs = all(/<loc>([^<]+)<\/loc>/, fs.readFileSync(sitemapPath, "utf8")).map((m) => m[1]);
  const expected = getIndexablePaths().map(absoluteUrl);
  const missing = expected.filter((u) => !locs.includes(u));
  const extra = locs.filter((u) => !expected.includes(u));
  if (missing.length) errors.push(`sitemap missing: ${missing.join(", ")}`);
  if (extra.length) errors.push(`sitemap lists non-indexable: ${extra.join(", ")}`);
}

// ── llms.txt ───────────────────────────────────────────────────────────────

const llmsPath = path.join(DIST, "llms.txt");
if (!fs.existsSync(llmsPath)) {
  errors.push("dist/llms.txt missing");
} else {
  const origin = absoluteUrl("/").replace(/\/$/, "");
  for (const [, href] of all(/\]\((https:\/\/www\.trainpace\.com[^)]*)\)/, fs.readFileSync(llmsPath, "utf8"))) {
    const rel = href.slice(origin.length).replace(/^\//, "") || "index.html";
    const candidates = [rel, path.join(rel, "index.html")];
    if (!candidates.some((c) => fs.existsSync(path.join(DIST, c)))) {
      errors.push(`llms.txt links to ${href}, which is not in dist`);
    }
  }
}

// ── App shell ──────────────────────────────────────────────────────────────

const shellPath = path.join(DIST, "app-shell.html");
if (!fs.existsSync(shellPath)) {
  errors.push("dist/app-shell.html missing");
} else {
  const shell = fs.readFileSync(shellPath, "utf8");
  if (!/<meta name="robots" content="noindex">/.test(shell)) errors.push("app-shell.html is not noindex");
  if (/rel="canonical"/.test(shell)) errors.push("app-shell.html has a canonical");
  if (/application\/ld\+json/.test(shell)) errors.push("app-shell.html has JSON-LD");
}

// ── Host consistency across all text output ────────────────────────────────

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "assets" ? [] : walk(full);
    return /\.(html|md|txt|json|xml)$/.test(e.name) ? [full] : [];
  });
}
const bareHostFiles = walk(DIST).filter((f) => BARE_HOST.test(fs.readFileSync(f, "utf8")));
if (bareHostFiles.length) {
  errors.push(
    `bare trainpace.com host (use https://www.trainpace.com) in: ${bareHostFiles
      .slice(0, 5)
      .map((f) => path.relative(DIST, f))
      .join(", ")}${bareHostFiles.length > 5 ? ` and ${bareHostFiles.length - 5} more` : ""}`
  );
}

// ── Report ─────────────────────────────────────────────────────────────────

console.log(
  `verify-seo: ${getAllDocPaths().length} pages, ${getIndexablePaths().length} indexable`
);
if (warnings.length) {
  console.log(`${warnings.length} length warnings (not blocking), e.g.:`);
  for (const w of warnings.slice(0, process.env.VERBOSE ? Infinity : 5)) console.log(`  warn  ${w}`);
}
if (errors.length) {
  for (const e of errors) console.log(`  FAIL  ${e}`);
  console.log(`\n${errors.length} FAILURES`);
  process.exit(1);
}
console.log("ALL PASS");
