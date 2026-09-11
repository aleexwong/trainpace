/**
 * Bundle budget check.
 *
 * Measures the INITIAL payload for a route: every script and modulepreload
 * referenced by that route's prerendered HTML, gzipped. This is the JS that
 * blocks first paint.
 *
 * IMPORTANT — this is not total JS for the route. Once the entry runs, React
 * Router loads the matched route's chunk, which pulls its own dependencies.
 * A route whose component imports Firebase will still fetch Firebase a moment
 * after paint, and this number will not show it. Verified with a real browser
 * on 2026-09-11: /calculator/5k-pace-calculator reports 166.6 KB here but
 * fetches 21 scripts in total, Firebase among them.
 *
 * So treat this as "time to first paint" pressure, not a total-bytes budget.
 * To check total bytes, drive the built app in a browser and record requests
 * (see .claude/skills/verify-in-browser).
 *
 * Budgets are a RATCHET, not a target. They are set just above the current
 * measurement so any regression fails CI; when a route gets faster, lower its
 * budget in the same commit. The `target` column records where each route is
 * meant to end up so the gap stays visible.
 *
 * Run after `npm run build`:  npm run budget
 */
import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

interface RouteBudget {
  /** Route as it appears in dist, without leading slash. "" is the root. */
  route: string;
  /** What this route is for, shown in the report. */
  label: string;
  /** Fails the build above this, in KB gzip. */
  budgetKb: number;
  /** Where this route should end up. Documentation only. */
  targetKb: number;
}

const BUDGETS: RouteBudget[] = [
  { route: "", label: "landing", budgetKb: 175, targetKb: 90 },
  { route: "calculator/5k-pace-calculator", label: "SEO landing", budgetKb: 175, targetKb: 90 },
  { route: "calculator", label: "pace calculator", budgetKb: 175, targetKb: 140 },
  { route: "fuel", label: "fuel planner", budgetKb: 175, targetKb: 140 },
  { route: "elevation-finder", label: "elevation", budgetKb: 175, targetKb: 140 },
];

const DIST = path.resolve(import.meta.dirname, "../dist");

/** Every JS asset the HTML tells the browser to fetch up front. */
function assetsFor(html: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /<script[^>]+src="(\/assets\/[^"]+\.js)"/g,
    /<link[^>]+rel="modulepreload"[^>]+href="(\/assets\/[^"]+\.js)"/g,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) found.add(m[1]);
  }
  return [...found];
}

function gzipKb(assetPath: string): number {
  const file = path.join(DIST, assetPath.replace(/^\//, ""));
  if (!existsSync(file)) return 0;
  return gzipSync(readFileSync(file)).length / 1024;
}

let failed = false;
const rows: string[] = [];

for (const { route, label, budgetKb, targetKb } of BUDGETS) {
  const htmlPath = path.join(DIST, route, "index.html");
  if (!existsSync(htmlPath)) {
    console.error(`MISSING  ${route || "/"} — no prerendered HTML at ${htmlPath}`);
    failed = true;
    continue;
  }
  const assets = assetsFor(readFileSync(htmlPath, "utf8"));
  const totalKb = assets.reduce((sum, a) => sum + gzipKb(a), 0);
  const over = totalKb > budgetKb;
  if (over) failed = true;
  rows.push(
    `${over ? "FAIL" : "ok  "}  ${(`/${route}`).padEnd(32)} ${label.padEnd(18)}` +
      `${totalKb.toFixed(1).padStart(7)} KB  (budget ${budgetKb}, target ${targetKb})`
  );
}

console.log("\nRender-blocking JS per route, gzipped (not total — see file header):\n");
console.log(rows.join("\n"));
console.log("");

if (failed) {
  console.error("Bundle budget exceeded. Either reduce the payload or raise the budget deliberately.\n");
  process.exit(1);
}
