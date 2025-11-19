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
        React.createElement("h1", null, "TrainPace – Smarter Running Training & Race Planning"),
        React.createElement(
          "p",
          null,
          "Free running tools for serious athletes. Calculate science-backed training paces, analyze course elevation profiles, and plan race-day nutrition with personalized recommendations."
        )
      );
    case "/calculator":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Running Pace Calculator"),
        React.createElement(
          "p",
          null,
          "Get science-backed training paces from any race result. Calculate Easy, Tempo, Speed, and Maximum pace zones, plus Yasso 800s and race time predictions for 5K to marathon."
        )
      );
    case "/fuel":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Race Fuel Planner"),
        React.createElement(
          "p",
          null,
          "Plan your race nutrition with personalized carb and calorie targets based on pace and body weight. Get hourly fueling breakdowns for gels, chews, and drinks to avoid bonking."
        )
      );
    case "/elevationfinder":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Course Elevation Analyzer"),
        React.createElement(
          "p",
          null,
          "Upload GPX files to analyze course elevation profiles. Visualize climbs, grade percentages, and terrain difficulty on interactive maps. Know every hill before race day."
        )
      );
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        return React.createElement(
          "div",
          null,
          React.createElement("h1", null, `${city} Marathon Course`),
          React.createElement(
            "p",
            null,
            `Analyze the ${city} marathon course with detailed elevation profile, grade percentages, and terrain difficulty. Plan your pacing strategy for every hill.`
          )
        );
      }
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "TrainPace"),
        React.createElement("p", null, "Free running tools for pace calculation, course analysis, and race nutrition planning.")
      );
  }
}

function getPageTitle(url) {
  switch (url) {
    case "/":
      return "TrainPace – Smarter Running Training & Race Planning";
    case "/calculator":
      return "Running Pace Calculator – Science-Backed Training Zones | TrainPace";
    case "/fuel":
      return "Race Fuel Planner – Personalized Nutrition Calculator | TrainPace";
    case "/elevationfinder":
      return "Course Elevation Analyzer – GPX Route Analysis | TrainPace";
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        return `${city} Marathon Course – Elevation Profile & Route Analysis | TrainPace`;
      }
      return "TrainPace";
  }
}

function getPageDescription(url) {
  switch (url) {
    case "/":
      return "Free running tools for serious athletes. Calculate science-backed training paces, analyze course elevation profiles, and plan race-day nutrition with personalized recommendations.";
    case "/calculator":
      return "Get science-backed training paces from any race result. Calculate Easy, Tempo, Speed, and Maximum pace zones, plus Yasso 800s and race time predictions for 5K to marathon.";
    case "/fuel":
      return "Plan your race nutrition with personalized carb and calorie targets based on pace and body weight. Get hourly fueling breakdowns for gels, chews, and drinks to avoid bonking.";
    case "/elevationfinder":
      return "Upload GPX files to analyze course elevation profiles. Visualize climbs, grade percentages, and terrain difficulty on interactive maps. Know every hill before race day.";
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        return `Analyze the ${city} marathon course with detailed elevation profile, grade percentages, and terrain difficulty. Plan your pacing strategy for every hill.`;
      }
      return "TrainPace – Free running tools for pace calculation, course analysis, and race nutrition planning.";
  }
}
