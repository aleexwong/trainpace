/**
 * Markdown mirror generator.
 *
 * Writes a `.md` twin for every prerendered route into the build output, plus
 * `llms-full.txt` (every page's Markdown in one file). Runs after `vite build`
 * so the files land in `dist/` alongside the prerendered HTML — they are build
 * artifacts, not checked-in source, and can never go stale relative to the
 * content they mirror.
 *
 * Routing:
 *   /calculator      → dist/calculator.md   (served at /calculator.md)
 *   /                → dist/index.md        (served at /index.md)
 *
 * `middleware.ts` rewrites to these when a request carries
 * `Accept: text/markdown` or `?format=md`.
 */

import fs from "fs";
import path from "path";

import {
  getAllDocPaths,
  getIndexablePaths,
  getPageDoc,
} from "../src/lib/llm/page-docs";
import { buildLlmsTxt, buildSitemapXml } from "../src/lib/llm/indexes";
import {
  renderMarkdown,
  renderMarkdownSection,
  markdownPathForRoute,
  absoluteUrl,
} from "../src/lib/llm/markdown";

const OUT_DIR = path.resolve(process.cwd(), "dist");

function writeFile(relativePath: string, contents: string) {
  const target = path.join(OUT_DIR, relativePath.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, "utf8");
}

function buildLlmsFullTxt(paths: string[]): string {
  const header = [
    "# TrainPace — Full Content",
    "",
    "> Every page of https://trainpace.com in Markdown, concatenated. Generated at build time from the same content that renders the site, so it is never out of date with the pages themselves.",
    "",
    "TrainPace is a free set of running-training tools: pace calculator, VDOT fitness scoring, training plan builder, race-day fuel planner, and GPX elevation analysis. The calculations use established sports science — Daniels & Gilbert VDOT formulas for training paces and race predictions, grade-adjusted pacing from real elevation data, and evidence-based carbohydrate targets for fueling — rather than model estimates.",
    "",
    "The same math is callable as tools via a free public MCP server at https://api.trainpace.com/api/mcp (Streamable HTTP, no auth). See https://trainpace.com/mcp.",
    "",
    "Any single page is also available on its own: append `.md` to its path, or request the HTML URL with an `Accept: text/markdown` header.",
    "",
    "---",
    "",
  ].join("\n");

  const sections = paths.map((p) => renderMarkdownSection(getPageDoc(p)));

  return `${header}${sections.join("\n---\n\n")}`;
}

/**
 * The HTML served for every route that is not prerendered (dashboard, auth,
 * shared routes, unknown URLs). It is the prerendered home page with the
 * home page's content, canonical, and structured data stripped, plus
 * `noindex` — otherwise every such URL would be a duplicate of "/" in the
 * index. vercel.json rewrites unmatched paths here.
 */
function writeAppShell() {
  const home = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
  const shell = home
    // Tags React Helmet manages (description, canonical, OG, JSON-LD).
    .replace(/<(meta|link)\b[^>]*\bdata-rh="true"[^>]*>\s*/g, "")
    .replace(/<script\b[^>]*\bdata-rh="true"[^>]*>[\s\S]*?<\/script>\s*/g, "")
    .replace(/<link\b[^>]*type="text\/markdown"[^>]*>\s*/g, "")
    .replace(/<title>[\s\S]*?<\/title>/, '<title>TrainPace</title>\n    <meta name="robots" content="noindex">')
    // #root is the last element in <body>: everything up to its closing tag.
    .replace(/<div id="root">[\s\S]*<\/div>(?=\s*<\/body>)/, '<div id="root"></div>');

  if (shell.includes("canonical") || !shell.includes('<div id="root"></div>')) {
    throw new Error("app-shell.html: failed to strip the home page content");
  }
  writeFile("/app-shell.html", shell);
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    throw new Error(
      `No build output at ${OUT_DIR}. Run \`vite build\` before generating Markdown mirrors.`
    );
  }

  const paths = getAllDocPaths();
  // Aliases still get a .md file (so negotiation works on either URL) but are
  // left out of the indexes, which list each page once.
  const indexable = getIndexablePaths();
  const seen = new Set<string>();
  let written = 0;

  for (const route of paths) {
    const mdPath = markdownPathForRoute(route);
    // /elevationfinder and /elevation-finder are aliases of one page; both get
    // a file so either URL negotiates correctly.
    if (seen.has(mdPath)) continue;
    seen.add(mdPath);

    writeFile(mdPath, renderMarkdown(getPageDoc(route)));
    written++;
  }

  writeFile("/llms-full.txt", buildLlmsFullTxt(indexable));
  writeFile("/sitemap.xml", buildSitemapXml());
  writeFile(
    "/llms.txt",
    buildLlmsTxt(
      fs.readFileSync(path.resolve(process.cwd(), "scripts/llms-intro.txt"), "utf8")
    )
  );
  writeAppShell();

  // A machine-readable index of every Markdown mirror, so an agent can
  // enumerate the site in one request instead of crawling for .md files.
  writeFile(
    "/llms-index.json",
    `${JSON.stringify(
      {
        site: absoluteUrl("/"),
        generated: new Date().toISOString().slice(0, 10),
        mcp: "https://api.trainpace.com/api/mcp",
        full: absoluteUrl("/llms-full.txt"),
        pages: indexable.map((route) => {
          const doc = getPageDoc(route);
          return {
            url: absoluteUrl(route),
            markdown: absoluteUrl(markdownPathForRoute(route)),
            title: doc.title,
            description: doc.description,
          };
        }),
      },
      null,
      2
    )}\n`
  );

  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${written} Markdown mirrors + llms.txt + llms-full.txt + llms-index.json + sitemap.xml + app-shell.html to ${OUT_DIR}`
  );
}

main();
