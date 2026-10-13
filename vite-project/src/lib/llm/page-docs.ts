/**
 * Route → PageDoc
 *
 * The single definition of what every prerendered route says, in structured
 * form. `prerender.jsx` renders these blocks to static HTML; the Markdown
 * generator renders the same blocks to `.md`.
 *
 * Previously this content lived inline in `prerender.jsx` as React
 * `createElement` calls, which meant the only machine-readable version of a
 * page was HTML. Keeping it as data lets both formats come from one place.
 */

import {
  calculatorSeoPages,
  comparisonLinks,
  elevationGuideSeoPages,
  fuelSeoPages,
  raceSeoPages,
  planSeoPages,
  getAllSeoPaths,
} from "../../features/seo-pages/seoPages";
import blogData from "../../data/blog-posts.json";
import faqData from "../../data/faq-data.json";
import marathonData from "../../data/marathon-data.json";
import { stripLeadingH1 } from "../../features/blog/utils";
import {
  equivalentRaceTimeTable,
  fuelReferenceTable,
  fuelTimelineTable,
  planStructureTable,
  trainingPaceTable,
} from "./reference-tables";
import type { DocBlock, PageDoc } from "./types";

// ── Shared copy ────────────────────────────────────────────────────────────

export const BLOG_LIST_TITLE =
  "Running Blog - Training Tips, Race Strategy & Nutrition | TrainPace";
export const BLOG_LIST_DESCRIPTION =
  "Expert running advice for marathoners and distance runners. Training tips, race strategy guides, nutrition planning, and more from TrainPace.";

/** Blog posts keyed by their public URL. */
const blogPostsByUrl: Record<string, (typeof blogData.posts)[number]> =
  Object.fromEntries(blogData.posts.map((p) => [`/blog/${p.slug}`, p]));

export const marathonSeoData: Record<
  string,
  { name: string; elevation: string; highlight: string; difficulty: string }
> = {
  boston: {
    name: "Boston Marathon",
    elevation: "156m",
    highlight: "Heartbreak Hill",
    difficulty: "Challenging",
  },
  nyc: {
    name: "NYC Marathon",
    elevation: "234m",
    highlight: "Five Boroughs",
    difficulty: "Moderate-Hard",
  },
  chicago: {
    name: "Chicago Marathon",
    elevation: "89m",
    highlight: "Flat & Fast",
    difficulty: "Easy (PR Course)",
  },
  berlin: {
    name: "Berlin Marathon",
    elevation: "67m",
    highlight: "World Records",
    difficulty: "Easy (Fastest Course)",
  },
  london: {
    name: "London Marathon",
    elevation: "145m",
    highlight: "Tower Bridge",
    difficulty: "Moderate",
  },
  tokyo: {
    name: "Tokyo Marathon",
    elevation: "198m",
    highlight: "Cultural Experience",
    difficulty: "Moderate",
  },
  sydney: {
    name: "Sydney Marathon",
    elevation: "234m",
    highlight: "Harbour Bridge",
    difficulty: "Moderate-Hard",
  },
};

// ── Programmatic SEO metadata ──────────────────────────────────────────────

const seoPagesByPath = Object.fromEntries(
  [
    ...calculatorSeoPages,
    ...fuelSeoPages,
    ...elevationGuideSeoPages,
    ...raceSeoPages,
    ...planSeoPages,
  ].map((p) => [p.path, p])
);

function getSeoMeta(url: string) {
  return seoPagesByPath[url];
}

/** The programmatic-SEO config for a route, if it is one. */
export function getSeoPage(url: string) {
  return seoPagesByPath[url];
}

/** A post's last-modified date: its `updated` field, or its publish date. */
export function getPostUpdated(post: { date: string; updated?: string }): string {
  return post.updated ?? post.date;
}

/** The blog post published at a route, if there is one. */
export function getBlogPost(url: string) {
  return blogPostsByUrl[url];
}

/**
 * Routes that render the same page as another route. Each is still
 * prerendered (so the URL keeps working without JavaScript), but its canonical
 * points at the primary path and it is left out of the sitemap and agent
 * indexes so search engines and agents see one copy.
 */
const ALIAS_ROUTES: Record<string, string> = {
  "/elevationfinder": "/elevation-finder",
  "/ethos": "/about",
};

/** The canonical path for a route (itself, unless it is an alias). */
export function getCanonicalPath(url: string): string {
  return ALIAS_ROUTES[url] ?? url;
}

/**
 * The person behind TrainPace. Used for blog bylines and as the `author` /
 * `founder` in structured data, so AI answer engines can attribute the
 * content to a real, verifiable person rather than an anonymous site.
 */
export const SITE_AUTHOR = {
  name: "Alex",
  url: "/about",
  sameAs: ["https://www.linkedin.com/in/aleexwong/"],
  jobTitle: "Software developer and runner",
} as const;

// ── Race course data ───────────────────────────────────────────────────────

type MarathonCourse = (typeof marathonData)[keyof typeof marathonData];

/** Course data for a race, keyed by its preview-route slug (e.g. "boston"). */
export function getCourse(key: string | undefined): MarathonCourse | undefined {
  if (!key) return undefined;
  return (marathonData as Record<string, MarathonCourse>)[key];
}

// ── Markdown helpers ───────────────────────────────────────────────────────

/**
 * Strip inline markdown (bold/italic/code/links) down to readable text.
 *
 * All patterns use negated character classes (no nested/backref quantifiers)
 * so they run in linear time — no catastrophic backtracking on odd input.
 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images -> alt
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold **
    .replace(/__([^_]+)__/g, "$1") // bold __
    .replace(/\*([^*]+)\*/g, "$1") // italic *
    .replace(/_([^_]+)_/g, "$1") // italic _
    .trim();
}

/**
 * Convert a markdown string into doc blocks. Handles the subset used by the
 * blog: headings, lists, blockquotes, and paragraphs. Table rows are skipped —
 * the source posts use them for decoration, not data.
 */
export function markdownToBlocks(markdown: string): DocBlock[] {
  const lines = markdown.split("\n");
  const blocks: DocBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({
        type: "paragraph",
        text: stripInlineMarkdown(paragraph.join(" ")),
      });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({
        type: "list",
        ordered: list.ordered,
        items: list.items.map(stripInlineMarkdown),
      });
      list = null;
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trimEnd().trim();

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }
    // Skip table rows / separators
    if (/^\|.*\|$/.test(trimmed)) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const depth = Math.min(heading[1].length, 3);
      blocks.push({
        type: "heading",
        level: (depth <= 1 ? 2 : depth) as 1 | 2 | 3,
        text: stripInlineMarkdown(heading[2]),
      });
      continue;
    }
    const ordered = /^\d+\.\s+(.*)$/.exec(trimmed);
    const unordered = /^[-*]\s+(.*)$/.exec(trimmed);
    if (ordered || unordered) {
      flushParagraph();
      const item = ordered ? ordered[1] : unordered![1];
      const isOrdered = !!ordered;
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push(item);
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "quote",
        text: stripInlineMarkdown(trimmed.replace(/^>\s?/, "")),
      });
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return blocks;
}

// ── Titles & descriptions ──────────────────────────────────────────────────

export function getPageTitle(url: string): string {
  const seoMeta = getSeoMeta(url);
  if (seoMeta?.title) return seoMeta.title;

  if (url === "/blog") return BLOG_LIST_TITLE;
  const blogPost = blogPostsByUrl[url];
  if (blogPost) return `${blogPost.title} | TrainPace Blog`;

  switch (url) {
    case "/":
      return "TrainPace – Free Running Pace Calculator & Race Day Tools";
    case "/calculator":
      return "Running Pace Calculator – VDOT Training Zones, Easy to Tempo Pace | TrainPace";
    case "/vdot":
      return "VDOT Calculator – Fitness Score & Equivalent Race Times | TrainPace";
    case "/plan":
      return "Training Plan Builder – Free 5K to Marathon Plans | TrainPace";
    case "/fuel":
      return "Marathon Fuel Calculator – How Many Gels & When to Take Them | TrainPace";
    case "/elevationfinder":
    case "/elevation-finder":
      return "GPX Elevation Profile Viewer – Free Route Analysis & Climb Stats | TrainPace";
    case "/race":
      return "Race Prep Pages – Pacing, Fueling, Elevation Strategy | TrainPace";
    case "/mcp":
      return "MCP Server - TrainPace Tools for AI Agents";
    case "/about":
    case "/ethos":
      return "About TrainPace – Built by a Self-Coached Runner";
    case "/faq":
      return "TrainPace FAQ – Pace, GPX, Fuel & Plan Questions";
    case "/privacy":
      return "Privacy Policy | TrainPace";
    case "/terms":
      return "Terms of Service | TrainPace";
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop()!;
        const name =
          getCourse(slug)?.name ??
          marathonSeoData[slug]?.name ??
          `${slug.charAt(0).toUpperCase()}${slug.slice(1)} Marathon`;
        return `${name} Elevation Profile & Course Map | TrainPace`;
      }
      return "TrainPace – Free Running Tools";
  }
}

export function getPageDescription(url: string): string {
  const seoMeta = getSeoMeta(url);
  if (seoMeta?.description) return seoMeta.description;

  if (url === "/blog") return BLOG_LIST_DESCRIPTION;
  const blogPost = blogPostsByUrl[url];
  if (blogPost) return blogPost.excerpt;

  switch (url) {
    case "/":
      return "Free running tools: VDOT training paces, race-day fueling and gel counts, training plans, and GPX elevation analysis. No signup required.";
    case "/calculator":
      return "Free running pace calculator. Enter a race time to get Easy, Tempo, Threshold, and Interval paces, plus race predictions from 5K to marathon.";
    case "/vdot":
      return "Free VDOT calculator (Daniels & Gilbert formula). Turn a race result into a VDOT score, training zones, and equivalent times from 5K to marathon.";
    case "/plan":
      return "Free periodized running plans for 5K to marathon: week-by-week base, development, sharpening, and taper phases sized to your fitness.";
    case "/fuel":
      return "How many gels you need for a marathon or half: a fueling schedule with 60-90 g/hr carb targets and timing, so you don't hit the wall.";
    case "/elevationfinder":
    case "/elevation-finder":
      return "Free GPX elevation profile viewer. Upload a route to see elevation gain, grades, and climb difficulty on a map, and plan race-day pacing.";
    case "/race":
      return "Race prep pages for popular running events. Use TrainPace to plan pacing, fueling, and course strategy with free calculators and GPX elevation analysis.";
    case "/mcp":
      return "Connect any AI assistant to TrainPace's free public MCP server: training paces, VDOT, race plans, fueling strategy, and GPX route analysis as agent tools.";
    case "/about":
    case "/ethos":
      return "Why TrainPace exists: a runner who cut his half marathon from 3:01 to 2:06 in a year built the free, ad-free tools he wished he had.";
    case "/faq":
      return "Answers about TrainPace's VDOT pace calculator, GPX elevation analysis, race fuel planner, training plans, accounts, and data privacy.";
    case "/privacy":
      return "How TrainPace collects, uses, and protects your data. Calculators work without an account, and we never sell personal information.";
    case "/terms":
      return "The terms for using TrainPace's free running calculators, training plan builder, fuel planner, and GPX elevation analysis tools.";
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop()!;
        const course = getCourse(slug);
        if (course) {
          return `${course.name} elevation profile: ${course.elevationGain} m gain and ${course.elevationLoss} m loss over ${course.distance} km, with segment pacing, fueling notes, and race tips.`;
        }
        const marathon = marathonSeoData[slug];
        if (marathon) {
          return `${marathon.name} elevation profile with ${marathon.elevation} gain. Course analysis, mile-by-mile pace strategy, and fueling tips. Known for: ${marathon.highlight}. Difficulty: ${marathon.difficulty}.`;
        }
        const cityFormatted = slug.charAt(0).toUpperCase() + slug.slice(1);
        return `${cityFormatted} Marathon elevation profile with interactive course map. See every hill, grade percentage, and total elevation gain. Plan your pacing strategy for race day.`;
      }
      return "Free running tools: pace calculator with VDOT zones, marathon fuel planner, and GPX elevation analyzer. No signup required.";
  }
}

// ── Internal linking ───────────────────────────────────────────────────────

const comparisonPaths = new Set(comparisonLinks.map((c) => c.path));

/** A crawlable list of comparison-page links, excluding the current path. */
function comparisonNav(currentPath: string | null): DocBlock[] {
  const others = comparisonLinks.filter((c) => c.path !== currentPath);
  if (!others.length) return [];
  return [
    { type: "heading", level: 2, text: "Compare TrainPace with other apps" },
    {
      type: "linkList",
      label: "Compare TrainPace with other apps",
      items: others.map((c) => ({ href: c.path, label: c.label })),
    },
  ];
}

/**
 * Cross-links to the other calculators. Every tool page carries these so an
 * agent that lands on one page can reach the rest without guessing URLs.
 */
function toolNav(currentPath: string): DocBlock[] {
  const tools = [
    {
      href: "/calculator",
      label: "Pace Calculator",
      note: "training paces from a recent race result",
    },
    {
      href: "/vdot",
      label: "VDOT Calculator",
      note: "fitness score and equivalent race times",
    },
    {
      href: "/plan",
      label: "Training Plan Builder",
      note: "week-by-week 5K to marathon plans",
    },
    {
      href: "/fuel",
      label: "Race Fuel Planner",
      note: "carbs per hour and gel counts",
    },
    {
      href: "/elevation-finder",
      label: "Elevation Finder",
      note: "GPX route and climb analysis",
    },
  ].filter((t) => t.href !== currentPath);

  return [
    { type: "heading", level: 2, text: "Other TrainPace tools" },
    { type: "linkList", label: "TrainPace tools", items: tools },
  ];
}

const DANIELS_SOURCES = [
  "Daniels, J. Daniels' Running Formula. Human Kinetics — VDOT, training zones, and equivalent race times.",
  "Daniels, J. & Gilbert, J. (1979). Oxygen Power: Performance Tables for Distance Runners — the oxygen-cost and %VO2max equations behind VDOT.",
];

const FUEL_SOURCES = [
  "Jeukendrup, A. (2014). A step towards personalized sports nutrition: carbohydrate intake during exercise. Sports Medicine 44(Suppl 1), S25–S33 — carbohydrate targets by event duration, and glucose + fructose for intakes above 60 g/hr.",
  "Thomas, D.T., Erdman, K.A. & Burke, L.M. (2016). Nutrition and Athletic Performance (joint position statement of the ACSM, Academy of Nutrition and Dietetics, and Dietitians of Canada). Medicine & Science in Sports & Exercise 48(3), 543–568.",
];

/**
 * Where a page's numbers come from. Answer engines weigh cited, verifiable
 * methods over unsourced claims, and it tells a reader the tables are not
 * invented.
 */
function methodSources(url: string): DocBlock[] {
  const tool = getSeoMeta(url)?.tool;
  const sources =
    ["/calculator", "/vdot", "/plan"].includes(url) || tool === "pace" || tool === "plan"
      ? DANIELS_SOURCES
      : url === "/fuel" || tool === "fuel"
        ? FUEL_SOURCES
        : null;
  if (!sources) return [];
  return [
    { type: "heading", level: 2, text: "Method and sources" },
    {
      type: "paragraph",
      text: "The numbers on this page are computed with the same code as the TrainPace calculators, from these published methods. They are training guidance, not medical advice.",
    },
    { type: "list", items: sources },
  ];
}

/** Pointer to the agent-facing entry points, included on every page. */
function agentFooter(): DocBlock[] {
  return [
    { type: "heading", level: 2, text: "For AI agents" },
    {
      type: "paragraph",
      text: "Every public page on this site has a Markdown mirror at the same path with a .md suffix (for example /calculator.md), and honors an Accept: text/markdown request header on the HTML URL. The calculations here are also available as callable tools through a free public MCP server — no account or API key.",
    },
    {
      type: "linkList",
      items: [
        {
          href: "/llms.txt",
          label: "llms.txt",
          note: "site index for agents",
        },
        {
          href: "/llms-full.txt",
          label: "llms-full.txt",
          note: "every page's Markdown in one file",
        },
        {
          href: "/mcp",
          label: "MCP server docs",
          note: "endpoint, tools, and client setup",
        },
      ],
    },
  ];
}

// ── Per-route content ──────────────────────────────────────────────────────

/**
 * Course facts, segment pacing, tips, and FAQ for a race we have real data
 * for. Shared by the /race/* prep pages and the /preview-route/* course pages
 * so both carry the same quotable numbers.
 */
function courseBlocks(course: MarathonCourse, opts: { faq: boolean }): DocBlock[] {
  const ft = (m: number) => Math.round(m * 3.28084);
  const blocks: DocBlock[] = [
    { type: "heading", level: 2, text: `${course.name} course facts` },
    { type: "paragraph", text: course.description },
    {
      type: "table",
      caption: `${course.name} at a glance`,
      headers: ["Metric", "Value"],
      rows: [
        ["Location", `${course.city}, ${course.country}`],
        ["Distance", `${course.distance} km`],
        ["Elevation gain", `${course.elevationGain} m (${ft(course.elevationGain)} ft)`],
        ["Elevation loss", `${course.elevationLoss} m (${ft(course.elevationLoss)} ft)`],
        ["Start / finish elevation", `${course.startElevation} m / ${course.endElevation} m`],
        ["Official site", course.website],
      ],
    },
  ];

  if (course.paceStrategy) {
    blocks.push(
      { type: "heading", level: 2, text: `${course.name} pacing strategy` },
      { type: "paragraph", text: course.paceStrategy.summary },
      {
        type: "table",
        caption: "Pacing by course segment (miles)",
        headers: ["Miles", "Terrain", "Advice"],
        rows: course.paceStrategy.segments.map((seg) => [
          seg.miles,
          seg.terrain,
          seg.advice,
        ]),
      }
    );
  }

  if (course.fuelingNotes) {
    blocks.push(
      { type: "heading", level: 2, text: "Fueling notes" },
      { type: "paragraph", text: course.fuelingNotes }
    );
  }

  if (course.tips?.length) {
    blocks.push(
      { type: "heading", level: 2, text: "Race-day tips" },
      { type: "list", items: course.tips }
    );
  }

  if (opts.faq && course.faq?.length) {
    blocks.push({ type: "heading", level: 2, text: "Frequently asked questions" });
    for (const item of course.faq) {
      blocks.push({ type: "heading", level: 3, text: item.question });
      blocks.push({ type: "paragraph", text: item.answer });
    }
  }

  return blocks;
}

function seoPageBlocks(url: string): DocBlock[] {
  const page = getSeoMeta(url);
  if (!page) return [];

  const blocks: DocBlock[] = [
    { type: "heading", level: 1, text: page.h1 || page.title.replace(" | TrainPace", "") },
    { type: "paragraph", text: page.description },
  ];

  if (page.intro) {
    blocks.push({ type: "paragraph", text: page.intro });
  }
  if (page.bullets?.length) {
    blocks.push({ type: "list", items: page.bullets });
  }
  if (page.howTo?.steps?.length) {
    blocks.push({ type: "heading", level: 2, text: page.howTo.name });
    if (page.howTo.description) {
      blocks.push({ type: "paragraph", text: page.howTo.description });
    }
    blocks.push({
      type: "list",
      ordered: true,
      items: page.howTo.steps.map((s) => `${s.name}: ${s.text}`),
    });
  }
  // Race prep pages with real course data carry it. The config's own FAQ
  // takes precedence; otherwise the course FAQ is used.
  const course = page.tool === "race" ? getCourse(page.previewRouteKey) : undefined;
  if (course) {
    blocks.push(...courseBlocks(course, { faq: !page.faq?.length }));
    blocks.push({
      type: "linkList",
      items: [
        {
          href: `/preview-route/${page.previewRouteKey}`,
          label: `${course.name} elevation profile and course map`,
        },
      ],
    });
  }

  if (page.faq?.length) {
    blocks.push({ type: "heading", level: 2, text: "Frequently asked questions" });
    for (const item of page.faq) {
      blocks.push({ type: "heading", level: 3, text: item.question });
      blocks.push({ type: "paragraph", text: item.answer });
    }
  }
  if (page.cta) {
    blocks.push({
      type: "linkList",
      items: [{ href: page.cta.href, label: page.cta.label }],
    });
  }

  // The pace pages share the reference table — a crawler landing on
  // "/calculator/5k-pace-calculator" gets numbers, not just a CTA.
  if (page.tool === "pace") {
    blocks.push({ type: "heading", level: 2, text: "Training pace reference" });
    blocks.push(trainingPaceTable("km"));
  } else if (page.tool === "fuel") {
    blocks.push({ type: "heading", level: 2, text: "Fueling reference" });
    blocks.push(fuelReferenceTable());
  } else if (page.tool === "plan") {
    blocks.push({ type: "heading", level: 2, text: "Plan length and phase structure" });
    blocks.push(planStructureTable());
  }

  if (comparisonPaths.has(url)) {
    blocks.push(...comparisonNav(url));
  }

  return blocks;
}

function calculatorBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Running Pace Calculator – VDOT Training Zones",
    },
    {
      type: "paragraph",
      text: "Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes Yasso 800s, race predictor for 5K to marathon, and printable pace charts.",
    },
    {
      type: "paragraph",
      text: "Paces come from the Daniels & Gilbert running formula: your race result is converted to a VDOT fitness score, and each training zone is a fixed percentage of the velocity that VDOT sustains. The tables below are generated from that same formula, so they are usable directly — the interactive calculator only adds your exact race result, unit preference, heart-rate zones, and hot-weather adjustments.",
    },
    { type: "heading", level: 2, text: "Training paces by 5K time" },
    trainingPaceTable("km"),
    trainingPaceTable("mile"),
    { type: "heading", level: 2, text: "How the zones are used" },
    {
      type: "list",
      items: [
        "Easy — most weekly mileage, conversational effort, builds aerobic base and aids recovery.",
        "Marathon — sustained race-effort work for marathon-specific fitness.",
        "Threshold — comfortably hard tempo runs and cruise intervals, roughly one-hour race effort.",
        "Interval — 3-5 minute repeats at near-maximum aerobic capacity to raise VO2max.",
        "Repetition — short 200-400m reps for speed, running economy, and neuromuscular power.",
      ],
    },
  ];
}

function vdotBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "VDOT Calculator – Fitness Score & Equivalent Race Times",
    },
    {
      type: "paragraph",
      text: "VDOT is a single number describing current running fitness, derived from a race result rather than a lab test. It combines the oxygen cost of running at a given velocity with the fraction of VO2max a runner can hold for a given duration — the Daniels & Gilbert formula.",
    },
    {
      type: "paragraph",
      text: "Because VDOT is distance-independent, one race result predicts times at every other distance. The table below is computed with the same functions the calculator uses.",
    },
    { type: "heading", level: 2, text: "Equivalent race times" },
    equivalentRaceTimeTable(),
    { type: "heading", level: 2, text: "Training paces for the same VDOT" },
    trainingPaceTable("km"),
    {
      type: "paragraph",
      text: "Predictions assume training appropriate to the distance. A marathon prediction from a 5K result is an upper bound on what fitness allows, not a guarantee of endurance on the day.",
    },
  ];
}

function planBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Training Plan Builder – 5K to Marathon",
    },
    {
      type: "paragraph",
      text: "Build a free periodized running plan for 5K, 10K, half marathon, or marathon. Plans follow a four-phase model: base building for aerobic foundation, development for tempo work, sharpening for race-pace intervals and tune-up races, then a taper into race week.",
    },
    { type: "heading", level: 2, text: "Plan length and phase structure" },
    planStructureTable(),
    {
      type: "paragraph",
      text: "Every plan ends with a race week in addition to the taper weeks shown. Weekly volume starts from your current fitness level and builds with down weeks for recovery; workout paces come from the same VDOT zones as the pace calculator.",
    },
  ];
}

function fuelBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Marathon Fuel Calculator – How Many Gels Do You Need?",
    },
    {
      type: "paragraph",
      text: "Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall.",
    },
    {
      type: "paragraph",
      text: "Targets scale with race distance and duration: a 10K baseline of 30g/hr rises to 45g/hr for a half and 75g/hr for a marathon, and body weight raises the floor (0.7g of carbohydrate per kg per hour). Marathons cap at 100g/hr — the practical ceiling of glucose plus fructose co-ingestion — and shorter races at 90g/hr.",
    },
    { type: "heading", level: 2, text: "Carb and gel targets by finish time" },
    fuelReferenceTable(),
    { type: "heading", level: 2, text: "Example fuel-stop timeline" },
    fuelTimelineTable(),
    {
      type: "paragraph",
      text: "Fueling is front-loaded: stops start at 15 minutes and repeat every ~17 minutes early, stretching to 25 and then 30 minute intervals as the race goes on, and stop about 15 minutes before the finish because nothing taken later will be absorbed in time.",
    },
  ];
}

function elevationBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "GPX Elevation Profile Viewer – Free Route Analysis",
    },
    {
      type: "paragraph",
      text: "Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day.",
    },
    { type: "heading", level: 2, text: "What the analysis returns" },
    {
      type: "list",
      items: [
        "Total distance and cumulative elevation gain and loss",
        "An elevation profile plotted against distance",
        "Categorized climbs with length, average grade, and difficulty",
        "Grade-adjusted pacing per split, so effort stays even over hills",
        "Optional weather impact on the projected finish time",
      ],
    },
    {
      type: "paragraph",
      text: "Route analysis requires a GPX file, so this page has no static equivalent — but the same analysis is callable as the analyze_route tool on the MCP server, which accepts a GPX URL or file contents.",
    },
  ];
}

function mcpBlocks(): DocBlock[] {
  return [
    { type: "heading", level: 1, text: "Use TrainPace from Your AI Assistant" },
    {
      type: "paragraph",
      text: "TrainPace runs a free, public Model Context Protocol (MCP) server at https://api.trainpace.com/api/mcp — Streamable HTTP, no account or API key required. Connect Claude, ChatGPT, or any MCP client and ask training questions in plain English; the agent calls the same math that powers this site.",
    },
    { type: "heading", level: 2, text: "Available tools" },
    {
      type: "list",
      items: [
        "calculate_training_paces — training paces (easy, tempo, interval, speed, long run, Yasso 800s) from a recent race result, plus heart-rate zones and hot-weather adjustments.",
        "calculate_vdot — VDOT fitness score (Daniels & Gilbert formula) with training zones and equivalent race-time predictions for 5K through marathon.",
        "generate_training_plan — a periodized week-by-week plan for 5K to marathon, sized to fitness level and available run days.",
        "calculate_fuel_plan — carbs per hour, total gels, and a fuel-stop timeline for a 10K, half, or full marathon.",
        "analyze_route — GPX route analysis: distance, elevation gain, climbs, split-by-split grade-adjusted pacing, and weather impact.",
      ],
    },
    { type: "heading", level: 2, text: "How to connect" },
    {
      type: "list",
      items: [
        "Claude.ai / Claude Desktop: Settings → Connectors → Add custom connector. Name it trainpace and paste the server URL — no login step.",
        "Claude Code: claude mcp add --transport http trainpace https://api.trainpace.com/api/mcp",
        "Cursor, Windsurf, and other MCP clients: add the server URL to your client's MCP config file as an HTTP server named trainpace.",
        "Any other agent: paste the agent briefing from this page as your first message — it describes the server URL and every tool so the agent can connect or defer correctly.",
      ],
    },
    { type: "heading", level: 2, text: "Fetching pages instead" },
    {
      type: "paragraph",
      text: "If you are reading the site rather than calling tools, request any page with an Accept: text/markdown header, or append .md to its path, to get clean Markdown instead of a JavaScript app shell.",
    },
    {
      type: "code",
      lang: "bash",
      text: 'curl -H "Accept: text/markdown" https://www.trainpace.com/calculator\ncurl https://www.trainpace.com/calculator.md',
    },
  ];
}

function homeBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "TrainPace – Free Running Pace Calculator & Race Day Tools",
    },
    {
      type: "paragraph",
      text: "Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles. No signup required.",
    },
    { type: "heading", level: 2, text: "Tools" },
    {
      type: "linkList",
      label: "TrainPace tools",
      items: [
        {
          href: "/calculator",
          label: "Pace Calculator",
          note: "Easy, tempo, threshold, and interval paces from a recent race result",
        },
        {
          href: "/vdot",
          label: "VDOT Calculator",
          note: "Fitness score and equivalent race times for 5K through marathon",
        },
        {
          href: "/plan",
          label: "Training Plan Builder",
          note: "Periodized week-by-week plans for 5K to marathon",
        },
        {
          href: "/fuel",
          label: "Race Fuel Planner",
          note: "Carbs per hour, gel counts, and a fuel-stop timeline",
        },
        {
          href: "/elevation-finder",
          label: "Elevation Finder",
          note: "GPX elevation profiles, climb analysis, and grade-adjusted pacing",
        },
        {
          href: "/race",
          label: "Race Prep Guides",
          note: "Course-specific pacing and prep for 100+ marathons and halfs",
        },
        { href: "/blog", label: "Blog", note: "Training, pacing, and fueling articles" },
      ],
    },
    { type: "heading", level: 2, text: "Training paces at a glance" },
    trainingPaceTable("km"),
    ...comparisonNav(null),
  ];
}

function raceIndexBlocks(): DocBlock[] {
  return [
    { type: "heading", level: 1, text: "Race Prep Pages" },
    {
      type: "paragraph",
      text: "Browse race-specific prep pages for pacing, fueling, and course strategy.",
    },
    {
      type: "linkList",
      label: "Race prep pages",
      items: raceSeoPages.map((p) => ({
        href: p.path,
        label: p.h1 || p.title.replace(" | TrainPace", ""),
      })),
    },
  ];
}

function blogListBlocks(): DocBlock[] {
  return [
    { type: "heading", level: 1, text: "Run Smarter, Race Better" },
    { type: "paragraph", text: BLOG_LIST_DESCRIPTION },
    {
      type: "linkList",
      label: "Blog posts",
      items: blogData.posts.map((p) => ({
        href: `/blog/${p.slug}`,
        label: p.title,
        note: p.excerpt,
      })),
    },
  ];
}

function blogPostBlocks(url: string): DocBlock[] {
  const post = blogPostsByUrl[url];
  return [
    { type: "heading", level: 1, text: post.title },
    { type: "paragraph", text: post.excerpt },
    {
      type: "paragraph",
      text: `By ${post.author?.name || SITE_AUTHOR.name} · Published ${post.date}${
        getPostUpdated(post) !== post.date ? ` · Updated ${getPostUpdated(post)}` : ""
      } · ${post.readingTime} min read`,
    },
    ...markdownToBlocks(stripLeadingH1(post.content)),
  ];
}

function previewRouteBlocks(url: string): DocBlock[] {
  const slug = url.split("/").pop()!;
  const marathon = marathonSeoData[slug];
  const course = getCourse(slug);
  const name = course?.name ?? marathon?.name ?? `${slug.charAt(0).toUpperCase()}${slug.slice(1)} Marathon`;

  const blocks: DocBlock[] = [
    {
      type: "heading",
      level: 1,
      text: `${name} Elevation Profile & Course Analysis`,
    },
    { type: "paragraph", text: getPageDescription(url) },
  ];

  if (course) {
    blocks.push(...courseBlocks(course, { faq: true }));
  }

  const racePage = raceSeoPages.find((p) => p.previewRouteKey === slug);
  if (racePage) {
    blocks.push({
      type: "linkList",
      items: [{ href: racePage.path, label: `${name} race prep: paces and fueling` }],
    });
  }

  return blocks;
}

function aboutBlocks(): DocBlock[] {
  return [
    { type: "heading", level: 1, text: "From 3:01 to 2:06: Why I Built TrainPace" },
    {
      type: "paragraph",
      text: "TrainPace is built and run by Alex, a software developer and self-coached runner in Vancouver, BC. He built it during the training block that took his BMO Vancouver Half Marathon time from 3:01:00 (May 2024) to 2:06:00 (May 2025) — 55 minutes faster, after 24 weeks of structured training.",
    },
    {
      type: "table",
      caption: "The numbers",
      headers: ["Race", "Time", "Average pace"],
      rows: [
        ["BMO Vancouver Half Marathon, May 2024", "3:01:00", "8:38/km (13:54/mi)"],
        ["BMO Vancouver Half Marathon, May 2025", "2:06:00", "5:58/km (9:37/mi)"],
      ],
    },
    { type: "heading", level: 2, text: "What changed" },
    {
      type: "list",
      items: [
        "One long run per week at Zone 2/3 intensity",
        "One speed workout per week: tempo runs, intervals, and threshold work",
        "Easy runs about 2 minutes per kilometer slower than race pace",
        "A km-by-km race plan built from the course elevation profile",
        "A fueling plan from the TrainPace fuel planner: it said 3 gels, and 3 would have been enough",
      ],
    },
    { type: "heading", level: 2, text: "Why TrainPace exists" },
    {
      type: "list",
      items: [
        "Pace calculators were buried in ads",
        "Switching between min/km and min/mile was a pain on every site",
        "Strava does not offer a pace calculator in its mobile app",
        "Elevation analysis meant staring at a static chart instead of seeing grades and climbs",
        "There was no simple way to work out how many gels a race needs",
      ],
    },
    {
      type: "paragraph",
      text: "TrainPace is for self-coached runners who want to train with data without paying for a coach. Every calculator is free, needs no account, and uses published methods: Daniels & Gilbert VDOT formulas for paces and race predictions, grade-adjusted pacing from real elevation data, and carbohydrate targets from sports-nutrition research.",
    },
    {
      type: "linkList",
      label: "Contact",
      items: [
        { href: "https://www.linkedin.com/in/aleexwong/", label: "Alex on LinkedIn" },
        { href: "mailto:alex@trainpace.com", label: "alex@trainpace.com" },
      ],
    },
  ];
}

function faqBlocks(): DocBlock[] {
  const blocks: DocBlock[] = [
    { type: "heading", level: 1, text: "Frequently Asked Questions" },
    { type: "paragraph", text: getPageDescription("/faq") },
  ];
  for (const section of faqData.sections) {
    // Section titles carry a leading emoji for the UI; drop it here.
    const title = section.title.replace(/^[^\p{L}\p{N}]+/u, "");
    blocks.push({ type: "heading", level: 2, text: title });
    for (const q of section.questions) {
      blocks.push({ type: "heading", level: 3, text: q.question });
      blocks.push({ type: "paragraph", text: q.answer });
    }
  }
  return blocks;
}

/** All FAQ entries, flattened — feeds the FAQPage structured data. */
export function getFaqEntries(): { question: string; answer: string }[] {
  return faqData.sections.flatMap((section) =>
    section.questions.map((q) => ({ question: q.question, answer: q.answer }))
  );
}

function privacyBlocks(): DocBlock[] {
  return [
    { type: "heading", level: 1, text: "Privacy Policy" },
    { type: "paragraph", text: getPageDescription("/privacy") },
    {
      type: "list",
      items: [
        "The Training Pace Calculator and Fuel Planner work without an account, and no data is stored for visitors who are not signed in.",
        "Signing in creates an account through Firebase Authentication (email address and name).",
        "GPX files you upload while signed in are stored in Firebase Cloud Storage and are visible only to you unless you share a link.",
        "Google Analytics measures how the site is used; Mapbox draws course maps; Vercel hosts the site.",
        "TrainPace does not sell personal data or share it with advertisers. You can ask for a copy of your data or for its deletion.",
      ],
    },
    {
      type: "paragraph",
      text: "The full policy — data collected, third-party services, security, retention, and your rights — is shown on this page in the app. Questions: alex@trainpace.com.",
    },
  ];
}

function termsBlocks(): DocBlock[] {
  return [
    { type: "heading", level: 1, text: "Terms of Service" },
    { type: "paragraph", text: getPageDescription("/terms") },
    {
      type: "paragraph",
      text: "TrainPace's calculators and plans are general training information, not medical advice. Check with a doctor before starting a new training program. The full terms — accounts, acceptable use, disclaimers, and liability — are shown on this page in the app. Questions: alex@trainpace.com.",
    },
  ];
}

// ── Entry point ────────────────────────────────────────────────────────────

/** The content blocks for a route, without the shared navigation footer. */
function getContentBlocks(url: string): DocBlock[] {
  if (url === "/blog") return blogListBlocks();
  if (blogPostsByUrl[url]) return blogPostBlocks(url);
  if (getSeoMeta(url)) return seoPageBlocks(url);

  switch (url) {
    case "/":
      return homeBlocks();
    case "/calculator":
      return calculatorBlocks();
    case "/vdot":
      return vdotBlocks();
    case "/plan":
      return planBlocks();
    case "/fuel":
      return fuelBlocks();
    case "/elevationfinder":
    case "/elevation-finder":
      return elevationBlocks();
    case "/race":
      return raceIndexBlocks();
    case "/mcp":
      return mcpBlocks();
    case "/about":
    case "/ethos":
      return aboutBlocks();
    case "/faq":
      return faqBlocks();
    case "/privacy":
      return privacyBlocks();
    case "/terms":
      return termsBlocks();
    default:
      if (url.includes("/preview-route/")) return previewRouteBlocks(url);
      return [
        { type: "heading", level: 1, text: "TrainPace – Free Running Tools" },
        {
          type: "paragraph",
          text: "Free running tools: pace calculator with VDOT zones, marathon fuel planner, and GPX elevation analyzer. No signup required.",
        },
      ];
  }
}

/**
 * The full document for a route: content plus the shared tool navigation and
 * agent footer that make every page a usable entry point on its own.
 */
export function getPageDoc(url: string): PageDoc {
  const blocks = getContentBlocks(url);

  // The MCP page already is the agent footer; the home page already lists the
  // tools. Avoid repeating either.
  const nav = url === "/" || url === "/mcp" ? [] : toolNav(url);
  const footer = url === "/mcp" ? [] : agentFooter();

  const post = blogPostsByUrl[url];

  return {
    path: url,
    title: getPageTitle(url),
    description: getPageDescription(url),
    canonicalPath: getCanonicalPath(url),
    ...(post ? { published: post.date, updated: getPostUpdated(post) } : {}),
    blocks: [...blocks, ...methodSources(url), ...nav, ...footer],
  };
}

/**
 * Every route that gets a prerendered page and a Markdown mirror.
 * Mirrors the prerender list in `vite.config.ts`.
 */
export function getAllDocPaths(): string[] {
  return [
    "/",
    "/calculator",
    "/vdot",
    "/fuel",
    "/plan",
    "/elevationfinder",
    "/elevation-finder",
    "/race",
    "/mcp",
    "/about",
    "/ethos",
    "/faq",
    "/privacy",
    "/terms",
    ...getAllSeoPaths(),
    "/preview-route/boston",
    "/preview-route/nyc",
    "/preview-route/chicago",
    "/preview-route/berlin",
    "/preview-route/london",
    "/preview-route/tokyo",
    "/preview-route/sydney",
    "/preview-route/oslo",
    "/blog",
    ...blogData.posts.map((p) => `/blog/${p.slug}`),
  ];
}

/**
 * The routes search engines and agents should index: every doc path except
 * aliases, which canonicalize to another route. Feeds the sitemap and
 * llms-index.json.
 */
export function getIndexablePaths(): string[] {
  return getAllDocPaths().filter((p) => getCanonicalPath(p) === p);
}
