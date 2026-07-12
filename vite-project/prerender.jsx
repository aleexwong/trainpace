import React from "react";
import { renderToString } from "react-dom/server";

import {
  calculatorSeoPages,
  elevationGuideSeoPages,
  fuelSeoPages,
  raceSeoPages,
} from "./src/features/seo-pages/seoPages";
import blogData from "./src/data/blog-posts.json";
import { stripLeadingH1 } from "./src/features/blog/utils";

// Blog posts keyed by their public URL, for prerendered SEO content.
const blogPostsByUrl = Object.fromEntries(
  blogData.posts.map((p) => [`/blog/${p.slug}`, p])
);

const BLOG_LIST_TITLE =
  "Running Blog - Training Tips, Race Strategy & Nutrition | TrainPace";
const BLOG_LIST_DESCRIPTION =
  "Expert running advice for marathoners and distance runners. Training tips, race strategy guides, nutrition planning, and more from TrainPace.";

// Strip inline markdown (bold/italic/code/links) down to readable text. The static
// HTML only needs crawlable prose — the live app renders the rich version.
function stripInlineMarkdown(text) {
  // All patterns use negated character classes (no nested/backref quantifiers)
  // so they run in linear time — no catastrophic backtracking on odd input.
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

// Convert a markdown string into a flat list of React block elements. Handles the
// subset used by the blog: headings, lists, blockquotes, tables, and paragraphs.
function markdownToReactBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let key = 0;
  let paragraph = [];
  let list = null; // { ordered, items: [] }

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        React.createElement("p", { key: key++ }, stripInlineMarkdown(paragraph.join(" ")))
      );
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(
        React.createElement(
          list.ordered ? "ol" : "ul",
          { key: key++ },
          list.items.map((it, i) =>
            React.createElement("li", { key: i }, stripInlineMarkdown(it))
          )
        )
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }
    // Skip table rows / separators — not worth rendering for SEO text
    if (/^\|.*\|$/.test(trimmed)) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 3);
      const tag = level <= 1 ? "h2" : `h${level}`;
      blocks.push(
        React.createElement(tag, { key: key++ }, stripInlineMarkdown(heading[2]))
      );
      continue;
    }
    const ordered = /^\d+\.\s+(.*)$/.exec(trimmed);
    const unordered = /^[-*]\s+(.*)$/.exec(trimmed);
    if (ordered || unordered) {
      flushParagraph();
      const item = (ordered ? ordered[1] : unordered[1]);
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
      blocks.push(
        React.createElement(
          "blockquote",
          { key: key++ },
          stripInlineMarkdown(trimmed.replace(/^>\s?/, ""))
        )
      );
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return blocks;
}

// Marathon-specific SEO data (defined first so all functions can use it)
const marathonSeoData = {
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

// Programmatic SEO routes (generated from the same config the app uses)
const seoRouteMeta = Object.fromEntries(
  [
    ...calculatorSeoPages,
    ...fuelSeoPages,
    ...elevationGuideSeoPages,
    ...raceSeoPages,
  ].map((p) => [p.path, { title: p.title, description: p.description }])
);

function getSeoMeta(url) {
  return seoRouteMeta[url];
}

function getBreadcrumbForUrl(url, pageTitle) {
  const homeItem = {
    "@type": "ListItem",
    position: 1,
    name: "TrainPace",
    item: "https://trainpace.com/",
  };

  if (url.startsWith("/calculator/")) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        homeItem,
        {
          "@type": "ListItem",
          position: 2,
          name: "Pace Calculator",
          item: "https://trainpace.com/calculator",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: pageTitle,
          item: `https://trainpace.com${url}`,
        },
      ],
    };
  }

  if (url.startsWith("/fuel/")) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        homeItem,
        {
          "@type": "ListItem",
          position: 2,
          name: "Fuel Planner",
          item: "https://trainpace.com/fuel",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: pageTitle,
          item: `https://trainpace.com${url}`,
        },
      ],
    };
  }

  if (url.startsWith("/elevationfinder/guides/")) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        homeItem,
        {
          "@type": "ListItem",
          position: 2,
          name: "ElevationFinder",
          item: "https://trainpace.com/elevationfinder",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Guides",
          item: "https://trainpace.com/elevationfinder/guides",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: pageTitle,
          item: `https://trainpace.com${url}`,
        },
      ],
    };
  }

  if (url.startsWith("/race/")) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        homeItem,
        {
          "@type": "ListItem",
          position: 2,
          name: "Race Prep",
          item: "https://trainpace.com/race",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: pageTitle,
          item: `https://trainpace.com${url}`,
        },
      ],
    };
  }

  return null;
}

function getPageTitle(url) {
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
    case "/fuel":
      return "Marathon Fuel Calculator – How Many Gels & When to Take Them | TrainPace";
    case "/elevationfinder":
      return "GPX Elevation Profile Viewer – Free Route Analysis & Climb Stats | TrainPace";
    case "/race":
      return "Race Prep Pages – Pacing, Fueling, Elevation Strategy | TrainPace";
    case "/mcp":
      return "MCP Server - TrainPace Tools for AI Agents";
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop();
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

function getPageDescription(url) {
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
    case "/fuel":
      return "Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall.";
    case "/elevationfinder":
      return "Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day.";
    case "/race":
      return "Race prep pages for popular running events. Use TrainPace to plan pacing, fueling, and course strategy with free calculators and GPX elevation analysis.";
    case "/mcp":
      return "Connect any AI assistant to TrainPace's free public MCP server: training paces, VDOT, race plans, fueling strategy, and GPX route analysis as agent tools.";
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop();
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

// Helper function to get page content for prerendering
function getPageContent(url) {
  // Blog list: heading + description + a crawlable list of every post.
  if (url === "/blog") {
    return React.createElement(
      "div",
      null,
      React.createElement("h1", null, "Run Smarter, Race Better"),
      React.createElement("p", null, BLOG_LIST_DESCRIPTION),
      React.createElement(
        "ul",
        null,
        blogData.posts.map((p) =>
          React.createElement(
            "li",
            { key: p.slug },
            React.createElement("a", { href: `/blog/${p.slug}` }, p.title),
            " — ",
            p.excerpt
          )
        )
      )
    );
  }

  // Blog post: full article body (leading H1 stripped — the header owns the H1).
  const blogPost = blogPostsByUrl[url];
  if (blogPost) {
    return React.createElement(
      "article",
      null,
      React.createElement("h1", null, blogPost.title),
      React.createElement("p", null, blogPost.excerpt),
      React.createElement(
        "p",
        null,
        `By ${blogPost.author?.name || "TrainPace"} · ${blogPost.readingTime} min read`
      ),
      ...markdownToReactBlocks(stripLeadingH1(blogPost.content))
    );
  }

  const seoMeta = getSeoMeta(url);
  if (seoMeta) {
    return React.createElement(
      "div",
      null,
      React.createElement("h1", null, seoMeta.title.replace(" | TrainPace", "")),
      React.createElement("p", null, seoMeta.description),
      React.createElement(
        "p",
        null,
        "Open the tool to calculate personalized paces, fueling, or elevation insights."
      )
    );
  }

  switch (url) {
    case "/":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "TrainPace – Free Running Pace Calculator & Race Day Tools"),
        React.createElement(
          "p",
          null,
          "Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles."
        )
      );
    case "/calculator":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Running Pace Calculator – VDOT Training Zones"),
        React.createElement(
          "p",
          null,
          "Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes Yasso 800s, race predictor for 5K to marathon, and printable pace charts."
        )
      );
    case "/fuel":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Marathon Fuel Calculator – How Many Gels Do You Need?"),
        React.createElement(
          "p",
          null,
          "Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall."
        )
      );
    case "/elevationfinder":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "GPX Elevation Profile Viewer – Free Route Analysis"),
        React.createElement(
          "p",
          null,
          "Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day."
        )
      );
    case "/race":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Race Prep Pages"),
        React.createElement(
          "p",
          null,
          "Browse race-specific prep pages for pacing, fueling, and course strategy."
        )
      );
    case "/mcp":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Use TrainPace from Your AI Assistant"),
        React.createElement(
          "p",
          null,
          "TrainPace runs a free, public Model Context Protocol (MCP) server at https://api.trainpace.com/api/mcp — Streamable HTTP, no account or API key required. Connect Claude, ChatGPT, or any MCP client and ask training questions in plain English; the agent calls the same math that powers this site."
        ),
        React.createElement("h2", null, "Available Tools"),
        React.createElement(
          "ul",
          null,
          React.createElement(
            "li",
            null,
            "calculate_training_paces — training paces (easy, tempo, interval, speed, long run, Yasso 800s) from a recent race result, plus heart-rate zones and hot-weather adjustments."
          ),
          React.createElement(
            "li",
            null,
            "calculate_vdot — VDOT fitness score (Daniels & Gilbert formula) with training zones and equivalent race-time predictions for 5K through marathon."
          ),
          React.createElement(
            "li",
            null,
            "generate_training_plan — a periodized week-by-week plan for 5K to marathon, sized to fitness level and available run days."
          ),
          React.createElement(
            "li",
            null,
            "calculate_fuel_plan — carbs per hour, total gels, and a fuel-stop timeline for a 10K, half, or full marathon."
          ),
          React.createElement(
            "li",
            null,
            "analyze_route — GPX route analysis: distance, elevation gain, climbs, split-by-split grade-adjusted pacing, and weather impact."
          )
        )
      );
    default:
      if (url.includes("/preview-route/")) {
        const slug = url.split("/").pop();
        const marathon = marathonSeoData[slug];
        if (marathon) {
          return React.createElement(
            "div",
            null,
            React.createElement("h1", null, `${marathon.name} Elevation Profile & Course Analysis`),
            React.createElement(
              "p",
              null,
              `Complete ${marathon.name} course analysis with ${marathon.elevation} elevation gain. Get mile-by-mile pace strategy, fueling recommendations, and race day tips. Known for: ${marathon.highlight}. Difficulty: ${marathon.difficulty}.`
            ),
            React.createElement("h2", null, "What You'll Find"),
            React.createElement(
              "ul",
              null,
              React.createElement("li", null, "Interactive elevation profile and course map"),
              React.createElement("li", null, "Mile-by-mile pace strategy breakdown"),
              React.createElement("li", null, "Race-specific fueling recommendations"),
              React.createElement("li", null, "Frequently asked questions about the course")
            )
          );
        }
        const cityFormatted = slug.charAt(0).toUpperCase() + slug.slice(1);
        return React.createElement(
          "div",
          null,
          React.createElement("h1", null, `${cityFormatted} Marathon Elevation Profile & Course Map`),
          React.createElement(
            "p",
            null,
            `${cityFormatted} Marathon elevation profile with interactive course map. See every hill, grade percentage, and total elevation gain. Plan your pacing strategy for race day.`
          )
        );
      }
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "TrainPace – Free Running Tools"),
        React.createElement("p", null, "Free running tools: pace calculator with VDOT zones, marathon fuel planner, and GPX elevation analyzer. No signup required.")
      );
  }
}

// Helper function to get structured data
function getStructuredData(url) {
  if (url === "/blog") {
    return {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "TrainPace Blog",
      description: BLOG_LIST_DESCRIPTION,
      url: "https://trainpace.com/blog",
      publisher: {
        "@type": "Organization",
        name: "TrainPace",
        url: "https://trainpace.com",
      },
      blogPost: blogData.posts.slice(0, 10).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        datePublished: p.date,
        url: `https://trainpace.com/blog/${p.slug}`,
        author: { "@type": "Person", name: p.author?.name || "TrainPace" },
      })),
    };
  }

  const blogPost = blogPostsByUrl[url];
  if (blogPost) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: blogPost.title,
          description: blogPost.excerpt,
          ...(blogPost.coverImage ? { image: blogPost.coverImage } : {}),
          datePublished: blogPost.date,
          dateModified: blogPost.date,
          author: {
            "@type": "Person",
            name: blogPost.author?.name || "TrainPace",
          },
          publisher: {
            "@type": "Organization",
            name: "TrainPace",
            url: "https://trainpace.com",
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://trainpace.com${url}`,
          },
          keywords: (blogPost.tags || []).join(", "),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "TrainPace",
              item: "https://trainpace.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: "https://trainpace.com/blog",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: blogPost.title,
              item: `https://trainpace.com${url}`,
            },
          ],
        },
      ],
    };
  }

  const seoMeta = getSeoMeta(url);
  if (seoMeta) {
    const breadcrumb = getBreadcrumbForUrl(url, seoMeta.title);

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: seoMeta.title,
          description: seoMeta.description,
          url: `https://trainpace.com${url}`,
          isPartOf: {
            "@type": "WebSite",
            name: "TrainPace",
            url: "https://trainpace.com/",
          },
        },
        ...(breadcrumb ? [breadcrumb] : []),
      ],
    };
  }

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: getPageTitle(url),
    description: getPageDescription(url),
    url: `https://trainpace.com${url}`,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  if (url === "/") {
    return {
      ...baseSchema,
      "@type": "WebSite",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://trainpace.com/calculator",
        },
      },
    };
  }

  return baseSchema;
}

export async function prerender(data) {
  try {
    // Generate just the content for the #root div, not a full HTML document
    const html = renderToString(
      React.createElement("div", null, getPageContent(data.url))
    );

    // Blog posts are articles, not the site app — reflect that in OG tags.
    const blogPost = blogPostsByUrl[data.url];
    const ogType = blogPost ? "article" : "website";
    const ogImage =
      blogPost && blogPost.coverImage
        ? `https://trainpace.com${blogPost.coverImage}`
        : "https://trainpace.com/landing-page-2025.png";

    return {
      html,
      head: {
        title: getPageTitle(data.url),
        elements: new Set([
          {
            type: "meta",
            props: {
              name: "description",
              content: getPageDescription(data.url),
            },
          },
          {
            type: "meta",
            props: {
              name: "viewport",
              content: "width=device-width, initial-scale=1",
            },
          },
          // Open Graph tags
          {
            type: "meta",
            props: {
              property: "og:title",
              content: getPageTitle(data.url),
            },
          },
          {
            type: "meta",
            props: {
              property: "og:description",
              content: getPageDescription(data.url),
            },
          },
          {
            type: "meta",
            props: {
              property: "og:image",
              content: ogImage,
            },
          },
          {
            type: "meta",
            props: {
              property: "og:url",
              content: `https://trainpace.com${data.url}`,
            },
          },
          {
            type: "meta",
            props: {
              property: "og:type",
              content: ogType,
            },
          },
          // Twitter Card tags
          {
            type: "meta",
            props: {
              name: "twitter:card",
              content: "summary_large_image",
            },
          },
          {
            type: "meta",
            props: {
              name: "twitter:title",
              content: getPageTitle(data.url),
            },
          },
          {
            type: "meta",
            props: {
              name: "twitter:description",
              content: getPageDescription(data.url),
            },
          },
          {
            type: "meta",
            props: {
              name: "twitter:image",
              content: ogImage,
            },
          },
          // Canonical URL
          {
            type: "link",
            props: {
              rel: "canonical",
              href: `https://trainpace.com${data.url}`,
            },
          },
          {
            type: "script",
            props: {
              type: "application/ld+json",
            },
            children: JSON.stringify(getStructuredData(data.url)),
          },
        ]),
      },
    };
  } catch (error) {
    console.error("Prerender error for", data.url, error);
    // Return minimal HTML on error
    return {
      html: "<div>Loading...</div>",
      head: {
        title: "TrainPace",
        elements: new Set(),
      },
    };
  }
}
