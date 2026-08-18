/**
 * SEO gate.
 *
 * `src/lib/seo/validation.ts` has always been able to find these problems — it
 * was simply never run by anything, and every length breach it reports is a
 * *warning*, so `invalidPages` stayed at 0 while 84% of pages exceeded the
 * limits CLAUDE.md documents. This script makes it run, and splits its output
 * into two kinds of failure:
 *
 *   FAILURES  — states that are never acceptable (duplicate titles, broken
 *               internal links, a sitemap URL that robots.txt blocks, a host
 *               that disagrees with SITE_URL). Always exit 1.
 *   RATCHET   — the backlog of length/FAQ violations. Fails only when a count
 *               rises above `scripts/seo-baseline.json`, so existing debt does
 *               not block shipping but new debt does. When a count drops, the
 *               script tells you to lower the baseline.
 *
 * Run: npm run seo-check
 */

/* eslint-disable no-console -- this script's output is the point */

import fs from "node:fs";
import path from "node:path";

import { SITE_URL } from "../src/config/site";
import { getAllSeoPages } from "../src/features/seo-pages/seoPages";
import { SEO_THRESHOLDS, validateAllPages } from "../src/lib/seo/validation";

type Baseline = Record<string, number>;

const BASELINE_PATH = path.resolve(process.cwd(), "scripts", "seo-baseline.json");
const baseline: Baseline = fs.existsSync(BASELINE_PATH)
  ? (JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Baseline)
  : {};

const failures: string[] = [];
const counts: Baseline = {};
const examples: Record<string, string[]> = {};

function count(key: string, hit: boolean, example: string) {
  counts[key] ??= 0;
  if (!hit) return;
  counts[key] += 1;
  (examples[key] ??= []).push(example);
}

// ── Page-level checks ───────────────────────────────────────────────────────
const pages = getAllSeoPages();
const result = validateAllPages(pages);

for (const page of pages) {
  count("titleOver60", page.title.length > SEO_THRESHOLDS.maxTitleLength, `${page.id} (${page.title.length})`);
  count(
    "descriptionOver160",
    page.description.length > SEO_THRESHOLDS.maxDescriptionLength,
    `${page.id} (${page.description.length})`
  );
  count("noFaq", !page.faq?.length, page.id);
}

for (const r of result.pageResults) {
  for (const e of r.errors) failures.push(`validator error — ${r.pageId} · ${e.field}: ${e.message}`);
}

// Duplicates: two pages competing on identical metadata is never intentional.
for (const field of ["title", "path", "slug"] as const) {
  const seen = new Map<string, string>();
  for (const page of pages) {
    const prev = seen.get(page[field]);
    if (prev) failures.push(`duplicate ${field} — ${prev} and ${page.id} share "${page[field]}"`);
    else seen.set(page[field], page.id);
  }
}

// Internal links that point at nothing render as nothing.
for (const link of result.linkingIssues.brokenLinks) failures.push(`broken internal link — ${link}`);

// ── Artifact checks: what actually ships ────────────────────────────────────
const sitemapPath = path.resolve(process.cwd(), "public", "sitemap.xml");
const robotsPath = path.resolve(process.cwd(), "public", "robots.txt");

if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  for (const loc of locs) {
    if (!loc.startsWith(`${SITE_URL}/`) && loc !== `${SITE_URL}/`) {
      failures.push(`sitemap host mismatch — ${loc} is not under ${SITE_URL}`);
    }
  }

  const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
  for (const d of new Set(dupes)) failures.push(`sitemap lists ${d} more than once`);

  if (fs.existsSync(robotsPath)) {
    const disallow = fs
      .readFileSync(robotsPath, "utf8")
      .split("\n")
      .filter((l) => l.trim().toLowerCase().startsWith("disallow:"))
      .map((l) => l.split(":")[1].trim())
      .filter(Boolean);
    for (const loc of locs) {
      const p = loc.slice(SITE_URL.length) || "/";
      const blocked = disallow.find((d) => p === d || p.startsWith(`${d}/`));
      if (blocked) failures.push(`sitemap lists ${p}, which robots.txt disallows (${blocked})`);
    }
  }

  const stale = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  if (new Set(stale).size === 1 && stale.length > 20) {
    failures.push(
      `every one of ${stale.length} sitemap URLs claims lastmod ${stale[0]} — regenerate with npm run generate-sitemap`
    );
  }
} else {
  failures.push("public/sitemap.xml is missing — run npm run generate-sitemap");
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log(`SEO check — ${pages.length} programmatic pages, sitemap + robots\n`);

let ratchetFailed = false;
let ratchetImproved = false;
console.log("Ratcheted counts (baseline in scripts/seo-baseline.json):");
for (const [key, value] of Object.entries(counts).sort()) {
  const base = baseline[key];
  const mark = base === undefined ? "NEW " : value > base ? "OVER" : value < base ? "DOWN" : "ok  ";
  if (base !== undefined && value > base) ratchetFailed = true;
  if (base !== undefined && value < base) ratchetImproved = true;
  console.log(`  ${mark}  ${key.padEnd(20)} ${String(value).padStart(4)}  (baseline ${base ?? "unset"})`);
  if (mark === "OVER" || mark === "NEW ") {
    for (const e of (examples[key] ?? []).slice(-3)) console.log(`          e.g. ${e}`);
  }
}

if (failures.length) {
  console.log(`\nFailures (${failures.length}):`);
  for (const f of failures) console.log(`  FAIL  ${f}`);
} else {
  console.log("\nFailures: none");
}

if (ratchetImproved) {
  console.log(
    "\nSome counts dropped below the baseline. Lower them in scripts/seo-baseline.json so the gain is locked in:"
  );
  console.log(`  ${JSON.stringify(counts)}`);
}

const failed = failures.length > 0 || ratchetFailed;
console.log(`\n${failed ? "FAILED" : "PASSED"}`);
process.exit(failed ? 1 : 0);
