import React from "react";
import { renderToString } from "react-dom/server";

import blogData from "./src/data/blog-posts.json";
import {
  getPageDoc,
  getPageTitle,
  getPageDescription,
  getSeoPage,
  getBlogPost,
  BLOG_LIST_DESCRIPTION,
} from "./src/lib/llm/page-docs";
import { markdownPathForRoute } from "./src/lib/llm/markdown";

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

function getBreadcrumbForUrl(url, pageTitle) {
  const homeItem = {
    "@type": "ListItem",
    position: 1,
    name: "TrainPace",
    item: "https://trainpace.com/",
  };

  const trail = (label, path) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      homeItem,
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `https://trainpace.com${path}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pageTitle,
        item: `https://trainpace.com${url}`,
      },
    ],
  });

  if (url.startsWith("/calculator/")) return trail("Pace Calculator", "/calculator");
  if (url.startsWith("/fuel/")) return trail("Fuel Planner", "/fuel");
  if (url.startsWith("/race/")) return trail("Race Prep", "/race");

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

  return null;
}

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

  const blogPost = getBlogPost(url);
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

  const seoMeta = getSeoPage(url);
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

// ── Prerender entry ────────────────────────────────────────────────────────

export async function prerender(data) {
  try {
    keyCounter = 0;

    // Only the content for the #root div, not a full HTML document.
    const html = renderToString(renderDoc(getPageDoc(data.url)));

    // Blog posts are articles, not the site app — reflect that in OG tags.
    const blogPost = getBlogPost(data.url);
    const ogType = blogPost ? "article" : "website";
    const ogImage =
      blogPost && blogPost.coverImage
        ? `https://trainpace.com${blogPost.coverImage}`
        : "https://trainpace.com/landing-page-2025.png";

    const title = getPageTitle(data.url);
    const description = getPageDescription(data.url);

    return {
      html,
      head: {
        title,
        elements: new Set([
          {
            type: "meta",
            props: { name: "description", content: description },
          },
          {
            type: "meta",
            props: {
              name: "viewport",
              content: "width=device-width, initial-scale=1",
            },
          },
          // Open Graph tags
          { type: "meta", props: { property: "og:title", content: title } },
          {
            type: "meta",
            props: { property: "og:description", content: description },
          },
          { type: "meta", props: { property: "og:image", content: ogImage } },
          {
            type: "meta",
            props: {
              property: "og:url",
              content: `https://trainpace.com${data.url}`,
            },
          },
          { type: "meta", props: { property: "og:type", content: ogType } },
          // Twitter Card tags
          {
            type: "meta",
            props: { name: "twitter:card", content: "summary_large_image" },
          },
          { type: "meta", props: { name: "twitter:title", content: title } },
          {
            type: "meta",
            props: { name: "twitter:description", content: description },
          },
          { type: "meta", props: { name: "twitter:image", content: ogImage } },
          // Canonical URL
          {
            type: "link",
            props: {
              rel: "canonical",
              href: `https://trainpace.com${data.url}`,
            },
          },
          // Markdown mirror of this page, for agents that prefer plain text.
          // Paired with Accept: text/markdown content negotiation in middleware.ts.
          {
            type: "link",
            props: {
              rel: "alternate",
              type: "text/markdown",
              href: `https://trainpace.com${markdownPathForRoute(data.url)}`,
              title: `${title} (Markdown)`,
            },
          },
          {
            type: "script",
            props: { type: "application/ld+json" },
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
