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
  /** Fails the build above this, in KB gzip. Render-blocking only. */
  budgetKb: number;
  /** Where the render-blocking figure should end up. Documentation only. */
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

/**
 * Every chunk reachable from a set of entry chunks, following both static
 * (`from"./x.js"`) and dynamic (`import("./x.js")`) specifiers transitively.
 *
 * This is a static approximation of what the browser ends up fetching. It can
 * over-count — a dynamic import behind a branch the user never takes is still
 * counted — so treat it as an upper bound on route weight, which is the right
 * direction for a budget to err in.
 */
function reachableAssets(entries: string[]): string[] {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const asset = queue.shift()!;
    if (seen.has(asset)) continue;
    seen.add(asset);
    const file = path.join(DIST, asset.replace(/^\//, ""));
    if (!existsSync(file)) continue;
    const code = readFileSync(file, "utf8");
    for (const m of code.matchAll(/["'`](\.\/[A-Za-z0-9_.-]+\.js)["'`]/g)) {
      const next = `/assets/${m[1].slice(2)}`;
      if (!seen.has(next)) queue.push(next);
    }
  }
  return [...seen];
}

function gzipKb(assetPath: string): number {
  const file = path.join(DIST, assetPath.replace(/^\//, ""));
  if (!existsSync(file)) return 0;
  return gzipSync(readFileSync(file)).length / 1024;
}

let failed = false;
const rows: string[] = [];
const entryAssets: string[] = [];

for (const { route, label, budgetKb, targetKb } of BUDGETS) {
  const htmlPath = path.join(DIST, route, "index.html");
  if (!existsSync(htmlPath)) {
    console.error(`MISSING  ${route || "/"} — no prerendered HTML at ${htmlPath}`);
    failed = true;
    continue;
  }
  const assets = assetsFor(readFileSync(htmlPath, "utf8"));
  const blockingKb = assets.reduce((sum, a) => sum + gzipKb(a), 0);
  entryAssets.push(...assets);

  const over = blockingKb > budgetKb;
  if (over) failed = true;
  rows.push(
    `${over ? "FAIL" : "ok  "}  ${(`/${route}`).padEnd(32)} ${label.padEnd(18)}` +
      `${blockingKb.toFixed(1).padStart(7)} KB  (budget ${budgetKb}, target ${targetKb})`
  );
}

console.log("\nJS per route, gzipped:\n");
console.log(rows.join("\n"));
console.log("");

// App-wide total. Every route's entry transitively reaches every chunk,
// because App.tsx lazily imports all of them — so this is NOT a per-route
// number and must not be presented as one. It is a single ratchet on the
// whole client bundle, which is what catches a heavy new dependency landing
// anywhere in the app. It over-counts what any one visitor downloads: a real
// browser fetches only the chunks a route actually needs (measured at about
// 379 KB for /calculator/5k-pace-calculator), so treat it as an upper bound.
const APP_TOTAL_BUDGET_KB = 780;
const appTotalKb = reachableAssets([...new Set(entryAssets)]).reduce(
  (sum, a) => sum + gzipKb(a),
  0
);
const overApp = appTotalKb > APP_TOTAL_BUDGET_KB;
if (overApp) failed = true;
console.log(
  `${overApp ? "FAIL" : "ok  "}  whole client bundle (all reachable chunks)   ` +
    `${appTotalKb.toFixed(1)} KB  (budget ${APP_TOTAL_BUDGET_KB})\n`
);

if (failed) {
  console.error("Bundle budget exceeded. Either reduce the payload or raise the budget deliberately.\n");
  process.exit(1);
}
