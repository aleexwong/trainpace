import React from "react";
import { renderToString } from "react-dom/server";

import blogData from "./src/data/blog-posts.json";
import {
  getPageDoc,
  getPageTitle,
  getPageDescription,
  getSeoPage,
  getBlogPost,
  getPostUpdated,
  getCanonicalPath,
  getCourse,
  getRaceGuide,
  getFaqEntries,
  BLOG_LIST_DESCRIPTION,
  SITE_AUTHOR,
} from "./src/lib/llm/page-docs";
import { markdownPathForRoute } from "./src/lib/llm/markdown";
import { BASE_URL } from "./src/lib/seo/types";
import { generateSchemaGraph } from "./src/lib/seo/schema-generators";

// Page content lives in src/lib/llm/page-docs.ts as a structured block model,
// shared with the Markdown generator (scripts/generateMarkdown.ts) so the
// static HTML a crawler reads and the .md an agent fetches never diverge.
// This file only turns those blocks into React elements and builds <head>.

let keyCounter = 0;
function nextKey() {
  return `b${keyCounter++}`;
}

function renderBlock(block) {
  switch (block.type) {
    case "heading":
      return React.createElement(`h${block.level}`, { key: nextKey() }, block.text);

    case "paragraph":
      return React.createElement("p", { key: nextKey() }, block.text);

    case "list":
      return React.createElement(
        block.ordered ? "ol" : "ul",
        { key: nextKey() },
        block.items.map((item, i) =>
          React.createElement("li", { key: i }, item)
        )
      );

    case "linkList":
      return React.createElement(
        "nav",
        { key: nextKey(), ...(block.label ? { "aria-label": block.label } : {}) },
        React.createElement(
          "ul",
          null,
          block.items.map((item, i) =>
            React.createElement(
              "li",
              { key: i },
              React.createElement("a", { href: item.href }, item.label),
              item.note ? ` — ${item.note}` : null
            )
          )
        )
      );

    case "table":
      return React.createElement(
        "table",
        { key: nextKey() },
        block.caption
          ? React.createElement("caption", null, block.caption)
          : null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            block.headers.map((h, i) =>
              React.createElement("th", { key: i, scope: "col" }, h)
            )
          )
        ),
        React.createElement(
          "tbody",
          null,
          block.rows.map((row, r) =>
            React.createElement(
              "tr",
              { key: r },
              row.map((cell, c) => React.createElement("td", { key: c }, cell))
            )
          )
        )
      );

    case "code":
      return React.createElement(
        "pre",
        { key: nextKey() },
        React.createElement("code", null, block.text)
      );

    case "quote":
      return React.createElement("blockquote", { key: nextKey() }, block.text);

    default:
      return null;
  }
}

function renderDoc(doc) {
  return React.createElement(
    "div",
    null,
    doc.blocks.map((block) => renderBlock(block))
  );
}

// ── Structured data ────────────────────────────────────────────────────────
//
// Emitted into the static HTML so crawlers and AI answer engines that do not
// run JavaScript still get it. Each page gets one @graph. Site-wide entities
// (Organization, WebSite, the author) carry stable @ids so every page refers
// to the same nodes instead of redefining them.

const abs = (p) => (p === "/" ? `${BASE_URL}/` : `${BASE_URL}${p}`);

const ORG_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;
const AUTHOR_ID = `${BASE_URL}/about#author`;
const DEFAULT_OG_IMAGE = `${BASE_URL}/landing-page-2025.png`;

const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "TrainPace",
  url: abs("/"),
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/android-chrome-512x512.png`,
    width: 512,
    height: 512,
  },
  email: "alex@trainpace.com",
  founder: { "@id": AUTHOR_ID },
  description:
    "Free running-training tools: pace calculator, VDOT calculator, training plan builder, race fuel planner, and GPX elevation analysis.",
};

const author = {
  "@type": "Person",
  "@id": AUTHOR_ID,
  name: SITE_AUTHOR.name,
  url: abs(SITE_AUTHOR.url),
  jobTitle: SITE_AUTHOR.jobTitle,
  sameAs: [...SITE_AUTHOR.sameAs],
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "TrainPace",
  url: abs("/"),
  inLanguage: "en",
  publisher: { "@id": ORG_ID },
};

/** The free web tools, described once and referenced from their pages. */
const TOOL_APPS = {
  "/calculator": {
    name: "TrainPace Running Pace Calculator",
    featureList: [
      "Easy, marathon, threshold, interval, and repetition paces from a race result",
      "Race time predictions from 5K to marathon",
      "min/km and min/mile",
    ],
  },
  "/vdot": {
    name: "TrainPace VDOT Calculator",
    featureList: [
      "VDOT score from any race result (Daniels & Gilbert formula)",
      "Equivalent race times from 1500m to marathon",
      "Daniels training zones",
    ],
  },
  "/plan": {
    name: "TrainPace Training Plan Builder",
    featureList: [
      "Periodized 5K, 10K, half marathon, and marathon plans",
      "Base, development, sharpening, and taper phases",
      "Calendar export",
    ],
  },
  "/fuel": {
    name: "TrainPace Race Fuel Planner",
    featureList: [
      "Carbohydrate target per hour by distance and finish time",
      "Gel count and fuel-stop timeline",
    ],
  },
  "/elevation-finder": {
    name: "TrainPace Elevation Finder",
    featureList: [
      "GPX elevation profile and course map",
      "Climb detection and grade analysis",
      "Grade-adjusted pacing",
    ],
  },
};

function webApplication(url) {
  const app = TOOL_APPS[url];
  return {
    "@type": "WebApplication",
    "@id": `${abs(url)}#app`,
    name: app.name,
    description: getPageDescription(url),
    url: abs(url),
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Running",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    featureList: app.featureList,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORG_ID },
  };
}

function webPage(url, type = "WebPage", extra = {}) {
  return {
    "@type": type,
    "@id": `${abs(url)}#webpage`,
    url: abs(url),
    name: getPageTitle(url),
    description: getPageDescription(url),
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    ...extra,
  };
}

function breadcrumb(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "TrainPace", path: "/" }, ...trail].map(
      (item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: abs(item.path),
      })
    ),
  };
}

function faqPage(url, entries) {
  return {
    "@type": "FAQPage",
    "@id": `${abs(url)}#faq`,
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}

/** Drop the per-node @context the shared generators add; the graph has one. */
function stripContext(node) {
  // eslint-disable-next-line no-unused-vars
  const { "@context": _ctx, ...rest } = node;
  return rest;
}

/** Nodes for one route. Site-wide nodes are added by getStructuredData. */
function getPageNodes(url) {
  if (url === "/") {
    return [webPage("/", "WebPage", { about: { "@id": ORG_ID } }), author];
  }

  if (TOOL_APPS[url]) {
    return [
      webApplication(url),
      webPage(url, "WebPage", { mainEntity: { "@id": `${abs(url)}#app` } }),
      breadcrumb([{ name: TOOL_APPS[url].name.replace("TrainPace ", ""), path: url }]),
    ];
  }

  if (url === "/blog") {
    return [
      {
        "@type": "Blog",
        "@id": `${abs("/blog")}#blog`,
        name: "TrainPace Blog",
        description: BLOG_LIST_DESCRIPTION,
        url: abs("/blog"),
        publisher: { "@id": ORG_ID },
        blogPost: blogData.posts.slice(0, 10).map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: abs(`/blog/${p.slug}`),
          datePublished: p.date,
        })),
      },
      breadcrumb([{ name: "Blog", path: "/blog" }]),
    ];
  }

  const blogPost = getBlogPost(url);
  if (blogPost) {
    const image = blogImage(blogPost);
    return [
      {
        "@type": "BlogPosting",
        "@id": `${abs(url)}#article`,
        headline: blogPost.title,
        description: blogPost.excerpt,
        url: abs(url),
        image: image ? abs(image) : DEFAULT_OG_IMAGE,
        datePublished: blogPost.date,
        dateModified: getPostUpdated(blogPost),
        inLanguage: "en",
        author: { "@id": AUTHOR_ID },
        publisher: { "@id": ORG_ID },
        mainEntityOfPage: abs(url),
        articleSection: blogPost.category,
        keywords: (blogPost.tags || []).join(", "),
        wordCount: blogPost.content.split(/\s+/).length,
      },
      author,
      breadcrumb([
        { name: "Blog", path: "/blog" },
        { name: blogPost.title, path: url },
      ]),
    ];
  }

  const seoPage = getSeoPage(url);
  if (seoPage) {
    // Same generator the React page uses, so static and hydrated JSON-LD agree.
    const nodes = generateSchemaGraph({
      ...seoPage,
      description: getPageDescription(url),
    })["@graph"].map(stripContext);
    const isRace = seoPage.tool === "race";
    const raceFaq =
      (isRace && getCourse(seoPage.previewRouteKey)?.faq) ||
      (isRace && getRaceGuide(seoPage.slug)?.faq) ||
      [];
    if (!seoPage.faq?.length && raceFaq.length) {
      nodes.push(faqPage(url, raceFaq));
    }
    return nodes;
  }

  if (url.startsWith("/preview-route/")) {
    const course = getCourse(url.split("/").pop());
    return [
      webPage(url),
      breadcrumb([
        { name: "Race Prep", path: "/race" },
        { name: course?.name ?? getPageTitle(url), path: url },
      ]),
      ...(course?.faq?.length ? [faqPage(url, course.faq)] : []),
    ];
  }

  switch (url) {
    case "/race":
      return [webPage(url, "CollectionPage"), breadcrumb([{ name: "Race Prep", path: url }])];
    case "/mcp":
      return [webPage(url, "TechArticle"), breadcrumb([{ name: "MCP Server", path: url }])];
    case "/about":
    case "/ethos":
      return [
        webPage("/about", "AboutPage", { mainEntity: { "@id": AUTHOR_ID } }),
        author,
        breadcrumb([{ name: "About", path: "/about" }]),
      ];
    case "/faq":
      return [
        webPage(url),
        faqPage(url, getFaqEntries()),
        breadcrumb([{ name: "FAQ", path: url }]),
      ];
    default:
      return [webPage(url)];
  }
}

function getStructuredData(url) {
  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, ...getPageNodes(url)],
  };
}

/** A post's cover image path, if it has one. */
function blogImage(post) {
  return post.coverImage || null;
}

// ── Prerender entry ────────────────────────────────────────────────────────

/**
 * Head tags React Helmet also manages carry `data-rh`, so when the app boots,
 * Helmet replaces them instead of adding a second description, canonical, and
 * set of Open Graph tags next to them.
 */
const managed = (type, props) => ({
  type,
  props: { ...props, "data-rh": "true" },
});

/**
 * Pages whose React component emits no JSON-LD of its own. Helmet deletes
 * every `data-rh` script it does not re-emit, so on these pages the static
 * graph is left unmarked — otherwise it would vanish as soon as the app boots
 * and a rendering crawler would see no structured data at all. Everywhere
 * else it stays marked so the client version replaces it rather than
 * duplicating it (two FAQPage blocks is a Search Console error).
 */
const STATIC_ONLY_JSONLD = new Set(["/about", "/ethos", "/privacy", "/terms", "/mcp", "/race"]);

export async function prerender(data) {
  keyCounter = 0;
  const url = data.url;

  // Errors are not caught: a page that fails to render must fail the build,
  // not ship as an empty "Loading..." shell that crawlers then index.
  const html = renderToString(renderDoc(getPageDoc(url)));

  // Blog posts are articles, not the site app — reflect that in OG tags.
  const blogPost = getBlogPost(url);
  const ogType = blogPost ? "article" : "website";
  const coverImage = blogPost ? blogImage(blogPost) : null;
  const ogImage = coverImage ? abs(coverImage) : DEFAULT_OG_IMAGE;

  const title = getPageTitle(url);
  const description = getPageDescription(url);
  const canonical = abs(getCanonicalPath(url));

  const elements = [
    managed("meta", { name: "description", content: description }),
    managed("link", { rel: "canonical", href: canonical }),
    // Open Graph
    managed("meta", { property: "og:site_name", content: "TrainPace" }),
    managed("meta", { property: "og:title", content: title }),
    managed("meta", { property: "og:description", content: description }),
    managed("meta", { property: "og:image", content: ogImage }),
    managed("meta", { property: "og:url", content: canonical }),
    managed("meta", { property: "og:type", content: ogType }),
    // Twitter Card
    managed("meta", { name: "twitter:card", content: "summary_large_image" }),
    managed("meta", { name: "twitter:title", content: title }),
    managed("meta", { name: "twitter:description", content: description }),
    managed("meta", { name: "twitter:image", content: ogImage }),
    // Markdown mirror of this page, for agents that prefer plain text.
    // Paired with Accept: text/markdown content negotiation in middleware.ts.
    {
      type: "link",
      props: {
        rel: "alternate",
        type: "text/markdown",
        href: abs(markdownPathForRoute(url)),
        title: `${title} (Markdown)`,
      },
    },
    STATIC_ONLY_JSONLD.has(url)
      ? { type: "script", props: { type: "application/ld+json" } }
      : managed("script", { type: "application/ld+json" }),
  ];

  if (blogPost) {
    elements.push(
      managed("meta", { property: "article:published_time", content: blogPost.date }),
      managed("meta", { property: "article:modified_time", content: getPostUpdated(blogPost) }),
      managed("meta", { name: "author", content: blogPost.author?.name || SITE_AUTHOR.name })
    );
  }

  // The JSON-LD script needs its body; attach it to the element built above.
  const ldScript = elements.find(
    (el) => el.type === "script" && el.props.type === "application/ld+json"
  );
  ldScript.children = JSON.stringify(getStructuredData(url));

  return {
    html,
    head: { title, elements: new Set(elements) },
  };
}
