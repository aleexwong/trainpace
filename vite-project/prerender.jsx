import React from "react";
import { renderToString } from "react-dom/server";

// Helper function to get structured data
function getStructuredData(url) {
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
              content: "https://trainpace.com/landing-page-2025.png",
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
              content: "website",
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
              content: "https://trainpace.com/landing-page-2025.png",
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

// Helper function to get page content (move this outside the SSRApp component)
function getPageContent(url) {
  switch (url) {
    case "/":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "TrainPace - Running Pace Calculator"),
        React.createElement(
          "p",
          null,
          "Calculate your running pace, plan fuel strategy, and find elevation profiles for your training."
        )
      );
    case "/calculator":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Pace Calculator"),
        React.createElement(
          "p",
          null,
          "Advanced running pace calculator for training and race planning."
        )
      );
    case "/fuel":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Fuel Planner"),
        React.createElement(
          "p",
          null,
          "Plan your fuel strategy for long runs and races."
        )
      );
    case "/elevationfinder":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Elevation Finder"),
        React.createElement(
          "p",
          null,
          "Find elevation profiles for your running routes."
        )
      );
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        return React.createElement(
          "div",
          null,
          React.createElement("h1", null, `${city} Running Route`),
          React.createElement(
            "p",
            null,
            `Explore running routes in ${city} with elevation profiles and pace recommendations.`
          )
        );
      }
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "TrainPace"),
        React.createElement("p", null, "Your running training companion")
      );
  }
}

function getPageTitle(url) {
  switch (url) {
    case "/":
      return "TrainPace - Running Pace Calculator";
    case "/calculator":
      return "Pace Calculator - TrainPace";
    case "/fuel":
      return "Fuel Planner - TrainPace";
    case "/elevationfinder":
      return "Elevation Finder - TrainPace";
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        return `${city} Running Route - TrainPace`;
      }
      return "TrainPace";
  }
}

function getPageDescription(url) {
  switch (url) {
    case "/":
      return "Calculate your running pace, plan fuel strategy, and find elevation profiles for your training.";
    case "/calculator":
      return "Advanced running pace calculator for training and race planning.";
    case "/fuel":
      return "Plan your fuel strategy for long runs and races.";
    case "/elevationfinder":
      return "Find elevation profiles for your running routes.";
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        return `Explore running routes in ${city} with elevation profiles and pace recommendations.`;
      }
      return "TrainPace - Your running training companion";
  }
}
