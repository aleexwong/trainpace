/**
 * Check the gzipped JavaScript assets referenced by prerendered HTML and the
 * transitive client chunk graph. Route numbers cover entry and modulepreload
 * assets. The graph also follows lazy imports, so it measures the whole app
 * rather than what one visitor downloads. Run after npm run build.
 */
import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

interface RouteBudget {
  /** Route as it appears in dist, without leading slash. "" is the root. */
  route: string;
  /** What this route is for, shown in the report. */
  label: string;
  /** Gzipped entry and modulepreload limit in KiB. */
  budgetKb: number;
}

const BUDGETS: RouteBudget[] = [
  { route: "", label: "landing", budgetKb: 225 },
  { route: "calculator/5k-pace-calculator", label: "SEO landing", budgetKb: 225 },
  { route: "calculator", label: "pace calculator", budgetKb: 225 },
  { route: "fuel", label: "fuel planner", budgetKb: 225 },
  { route: "elevation-finder", label: "elevation", budgetKb: 225 },
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
    const code = readFileSync(file, "utf8");
    for (const m of code.matchAll(/["'`](\.\/[A-Za-z0-9_.-]+\.js)["'`]/g)) {
      const next = `/assets/${m[1].slice(2)}`;
      if (!seen.has(next) && existsSync(path.join(DIST, next))) queue.push(next);
    }
  }
  return [...seen];
}

function gzipKb(assetPath: string): number {
  const file = path.join(DIST, assetPath.replace(/^\//, ""));
  return gzipSync(readFileSync(file)).length / 1024;
}

let failed = false;
const rows: string[] = [];
const entryAssets: string[] = [];

for (const { route, label, budgetKb } of BUDGETS) {
  const htmlPath = path.join(DIST, route, "index.html");
  if (!existsSync(htmlPath)) {
    console.error(`MISSING  ${route || "/"} — no prerendered HTML at ${htmlPath}`);
    failed = true;
    continue;
  }
  const assets = assetsFor(readFileSync(htmlPath, "utf8"));
  if (!assets.length || assets.some((asset) => !existsSync(path.join(DIST, asset)))) {
    console.error(`MISSING  ${route || "/"} — missing or incomplete client assets`);
    failed = true;
    continue;
  }
  const initialKb = assets.reduce((sum, asset) => sum + gzipKb(asset), 0);
  entryAssets.push(...assets);

  const over = initialKb > budgetKb;
  if (over) failed = true;
  rows.push(
    `${over ? "FAIL" : "ok  "}  ${(`/${route}`).padEnd(32)} ${label.padEnd(18)}` +
      `${initialKb.toFixed(1).padStart(7)} KiB (budget ${budgetKb})`
  );
}

console.log("\nJS per route, gzipped:\n");
console.log(rows.join("\n"));
console.log("");

// Compare against the client graph from the production build on main.
const APP_TOTAL_BUDGET_KB = 880;
const appTotalKb = reachableAssets([...new Set(entryAssets)]).reduce(
  (sum, a) => sum + gzipKb(a),
  0
);
const overApp = appTotalKb > APP_TOTAL_BUDGET_KB;
if (overApp) failed = true;
console.log(
  `${overApp ? "FAIL" : "ok  "}  whole client bundle (all reachable chunks)   ` +
    `${appTotalKb.toFixed(1)} KiB (budget ${APP_TOTAL_BUDGET_KB})\n`
);

if (failed) {
  console.error("Bundle budget exceeded. Either reduce the payload or raise the budget deliberately.\n");
  process.exit(1);
}
