/**
 * Site indexes generated at build time: `sitemap.xml` and `llms.txt`.
 *
 * Both are built from `getIndexablePaths()` — the same list that drives
 * prerendering and the Markdown mirrors — so neither can advertise a page that
 * is not prerendered, or miss one that is.
 */

import {
  calculatorSeoPages,
  elevationGuideSeoPages,
  fuelSeoPages,
  planSeoPages,
  raceSeoPages,
} from "../../features/seo-pages/seoPages";
import blogData from "../../data/blog-posts.json";
import { getCourse, getIndexablePaths, getPostUpdated, getRaceGuide } from "./page-docs";
import { absoluteUrl, markdownPathForRoute } from "./markdown";
import type { SeoPageConfig } from "../seo/types";

// ── sitemap.xml ────────────────────────────────────────────────────────────

const blogUpdatedByPath = new Map(
  blogData.posts.map((p) => [`/blog/${p.slug}`, getPostUpdated(p)])
);

/**
 * `lastmod` is only written where we know the real date (blog posts, and the
 * blog index, which changes when a post does). A build date on every URL
 * tells search engines nothing and teaches them to ignore the field.
 * `changefreq` and `priority` are omitted: Google ignores both.
 */
export function buildSitemapXml(): string {
  const newestPost = [...blogUpdatedByPath.values()].sort().at(-1);

  const entries = getIndexablePaths().map((route) => {
    const lastmod =
      blogUpdatedByPath.get(route) ?? (route === "/blog" ? newestPost : undefined);
    return [
      "  <url>",
      `    <loc>${absoluteUrl(route)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

// ── llms.txt ───────────────────────────────────────────────────────────────

function mdLink(route: string, label: string, note?: string): string {
  const link = `- [${label}](${absoluteUrl(markdownPathForRoute(route))})`;
  return note ? `${link}: ${note}` : link;
}

function pageLinks(pages: SeoPageConfig[]): string[] {
  return pages.map((p) => mdLink(p.path, p.h1, p.description));
}

/**
 * llms.txt = the hand-written introduction (`scripts/llms-intro.txt`) followed
 * by generated link sections. Links point at the Markdown mirrors, per the
 * llms.txt convention, so an agent can fetch any of them without parsing HTML.
 */
export function buildLlmsTxt(intro: string): string {
  const racesWithCourseData = raceSeoPages.filter((p) =>
    getCourse(p.previewRouteKey)
  );

  const sections: [string, string[]][] = [
    [
      "Pace and race-time guides",
      pageLinks(calculatorSeoPages),
    ],
    ["Training plan guides", pageLinks(planSeoPages)],
    ["Race fueling guides", pageLinks(fuelSeoPages)],
    ["Elevation and GPX guides", pageLinks(elevationGuideSeoPages)],
    [
      "Race course guides",
      [
        ...racesWithCourseData.map((p) => {
          const course = getCourse(p.previewRouteKey)!;
          return mdLink(
            p.path,
            p.h1,
            `${course.elevationGain} m gain, segment pacing strategy, fueling notes`
          );
        }),
        ...raceSeoPages
          .filter((p) => !getCourse(p.previewRouteKey) && getRaceGuide(p.slug))
          .map((p) => {
            const guide = getRaceGuide(p.slug)!;
            return mdLink(
              p.path,
              guide.name,
              `${guide.city}, ${guide.terrain} ${guide.courseType} course, pacing by section`
            );
          }),
        mdLink(
          "/race",
          "All race prep pages",
          `index of ${raceSeoPages.length} marathon and half-marathon prep pages`
        ),
      ],
    ],
    [
      "Blog",
      blogData.posts.map((p) => mdLink(`/blog/${p.slug}`, p.title, p.excerpt)),
    ],
    [
      "Optional",
      [
        mdLink("/faq", "FAQ", "common questions about the tools, accounts, and data"),
        mdLink("/about", "About", "who builds TrainPace and why"),
        mdLink("/privacy", "Privacy policy"),
        mdLink("/terms", "Terms of service"),
        `- [llms-full.txt](${absoluteUrl("/llms-full.txt")}): every page's Markdown in one file (large)`,
        `- [llms-index.json](${absoluteUrl("/llms-index.json")}): machine-readable index of every page`,
        `- [Sitemap](${absoluteUrl("/sitemap.xml")}): all ${getIndexablePaths().length} indexable pages`,
      ],
    ],
  ];

  const body = sections
    .map(([heading, lines]) => `## ${heading}\n\n${lines.join("\n")}`)
    .join("\n\n");

  const notes = [
    "## Notes",
    "",
    "- No account, API key, or rate-limit negotiation is needed for anything listed above.",
    "- Content is free to quote with attribution to TrainPace (https://trainpace.com).",
    "- Pace and fueling numbers are training guidance, not medical advice.",
    "- `/dashboard`, `/settings`, `/onboarding`, and the auth routes are per-user application state with no public content — they have no Markdown mirror and are disallowed in robots.txt.",
  ].join("\n");

  return `${intro.trimEnd()}\n\n${body}\n\n${notes}\n`;
}
