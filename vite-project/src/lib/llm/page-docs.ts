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
  getAllSeoPaths,
} from "../../features/seo-pages/seoPages";
import blogData from "../../data/blog-posts.json";
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
  ].map((p) => [p.path, p])
);

function getSeoMeta(url: string) {
  return seoPagesByPath[url];
}

/** The programmatic-SEO config for a route, if it is one. */
export function getSeoPage(url: string) {
  return seoPagesByPath[url];
}

/** The blog post published at a route, if there is one. */
export function getBlogPost(url: string) {
  return blogPostsByUrl[url];
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
    case "/import":
      return "Apple Health Import - Your Runs in TrainPace or Claude";
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop()!;
        const marathon = marathonSeoData[slug];
        if (marathon) {
          return `${marathon.name} Elevation Profile – Course Map, Hills & Pace Strategy | TrainPace`;
        }
        const cityFormatted = slug.charAt(0).toUpperCase() + slug.slice(1);
        return `${cityFormatted} Marathon Elevation Profile – Course Map & Hill Analysis | TrainPace`;
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
      return "Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles.";
    case "/calculator":
      return "Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes Yasso 800s, race predictor for 5K to marathon, and printable pace charts.";
    case "/vdot":
      return "Free VDOT calculator using the Daniels & Gilbert formula. Turn any race result into a VDOT fitness score, Daniels training zones, and equivalent race times from 5K to marathon.";
    case "/plan":
      return "Build a free periodized running plan for 5K, 10K, half marathon, or marathon. Week-by-week base, development, sharpening, and taper phases sized to your fitness and run days.";
    case "/fuel":
      return "Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall.";
    case "/elevationfinder":
    case "/elevation-finder":
      return "Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day.";
    case "/race":
      return "Race prep pages for popular running events. Use TrainPace to plan pacing, fueling, and course strategy with free calculators and GPX elevation analysis.";
    case "/mcp":
      return "Connect any AI assistant to TrainPace's free public MCP server: training paces, VDOT, race plans, fueling strategy, and GPX route analysis as agent tools.";
    case "/import":
      return "Turn an Apple Health export into training paces, VDOT, and a one-page summary you can paste into Claude. Runs entirely in your browser - nothing is uploaded.";
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop()!;
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
    {
      href: "/import",
      label: "Apple Health Import",
      note: "read your own runs out of an Apple Health export",
    },
  ].filter((t) => t.href !== currentPath);

  return [
    { type: "heading", level: 2, text: "Other TrainPace tools" },
    { type: "linkList", label: "TrainPace tools", items: tools },
  ];
}

/** Pointer to the agent-facing entry points, included on every page. */
function agentFooter(): DocBlock[] {
  return [
    { type: "heading", level: 2, text: "For AI agents" },
    {
      type: "paragraph",
      text: "Every page on this site has a Markdown mirror at the same path with a .md suffix (for example /calculator.md), and honors an Accept: text/markdown request header on the HTML URL. The calculations here are also available as callable tools through a free public MCP server — no account or API key.",
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
      text: 'curl -H "Accept: text/markdown" https://trainpace.com/calculator\ncurl https://trainpace.com/calculator.md',
    },
  ];
}

function importBlocks(): DocBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Apple Health Import - Your Runs in TrainPace or Claude",
    },
    {
      type: "paragraph",
      text: "Apple Health can export everything it knows about you, but the file it produces is a few hundred megabytes of XML - too big to read and far too big to paste into an AI chat. TrainPace reads that export in your browser and gives the running parts back: weekly volume, fastest efforts at 5K, 10K, half marathon and marathon, a VDOT estimate, and a one-page summary any assistant can use.",
    },
    {
      type: "paragraph",
      text: "Nothing is uploaded. The file is parsed on your device, no account is needed, and nothing is stored once the tab closes. That matters because an Apple Health export contains your whole health record; TrainPace reads only workouts, VO2 max, resting heart rate and body mass.",
    },
    { type: "heading", level: 2, text: "Getting the file off an iPhone" },
    {
      type: "list",
      ordered: true,
      items: [
        "Open the Health app and tap your profile picture in the top right.",
        "Scroll to the bottom, tap Export All Health Data, then Export. It takes a few minutes.",
        "In the share sheet choose Save to Files and keep export.zip somewhere you can find it.",
        "Open trainpace.com/import on the same phone, tap Choose file, and pick that zip.",
      ],
    },
    { type: "heading", level: 2, text: "What you get back" },
    {
      type: "list",
      items: [
        "Volume: total runs, distance and time, plus a week-by-week breakdown.",
        "Fastest efforts at 5K, 10K, half marathon and marathon, each with pace and a VDOT value. Treadmill runs are excluded because their distance depends on the machine's calibration.",
        "One-tap links into the pace calculator and VDOT calculator, pre-filled with an effort.",
        "The GPX track for every recorded run, ready for the elevation analyzer.",
        "A copy-for-Claude summary of roughly a page, so an assistant can read your training without the raw export.",
      ],
    },
    {
      type: "paragraph",
      text: "The summary tells the assistant to call TrainPace's MCP server for pace, VDOT, plan, fueling and route math rather than estimating. See /mcp for how to connect one.",
    },
    {
      type: "paragraph",
      text: "Supported input: export.zip from Health, or the export.xml inside it. Requires a browser with DecompressionStream - Safari 16.4+, Chrome 103+, or Firefox 113+.",
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
      text: `By ${post.author?.name || "TrainPace"} · ${post.readingTime} min read`,
    },
    ...markdownToBlocks(stripLeadingH1(post.content)),
  ];
}

function previewRouteBlocks(url: string): DocBlock[] {
  const slug = url.split("/").pop()!;
  const marathon = marathonSeoData[slug];

  if (marathon) {
    return [
      {
        type: "heading",
        level: 1,
        text: `${marathon.name} Elevation Profile & Course Analysis`,
      },
      {
        type: "paragraph",
        text: `Complete ${marathon.name} course analysis with ${marathon.elevation} elevation gain. Get mile-by-mile pace strategy, fueling recommendations, and race day tips. Known for: ${marathon.highlight}. Difficulty: ${marathon.difficulty}.`,
      },
      {
        type: "table",
        caption: `${marathon.name} at a glance`,
        headers: ["Metric", "Value"],
        rows: [
          ["Elevation gain", marathon.elevation],
          ["Known for", marathon.highlight],
          ["Difficulty", marathon.difficulty],
        ],
      },
      { type: "heading", level: 2, text: "What you'll find" },
      {
        type: "list",
        items: [
          "Interactive elevation profile and course map",
          "Mile-by-mile pace strategy breakdown",
          "Race-specific fueling recommendations",
          "Frequently asked questions about the course",
        ],
      },
    ];
  }

  const cityFormatted = slug.charAt(0).toUpperCase() + slug.slice(1);
  return [
    {
      type: "heading",
      level: 1,
      text: `${cityFormatted} Marathon Elevation Profile & Course Map`,
    },
    {
      type: "paragraph",
      text: `${cityFormatted} Marathon elevation profile with interactive course map. See every hill, grade percentage, and total elevation gain. Plan your pacing strategy for race day.`,
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
    case "/import":
      return importBlocks();
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

  return {
    path: url,
    title: getPageTitle(url),
    description: getPageDescription(url),
    blocks: [...blocks, ...nav, ...footer],
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
    "/import",
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
