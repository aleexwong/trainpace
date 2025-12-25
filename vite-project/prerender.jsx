import React from "react";
import { renderToString } from "react-dom/server";

// Race distance data for guide pages
const RACE_DISTANCES = {
  "5k": { name: "5K", distanceKm: 5 },
  "10k": { name: "10K", distanceKm: 10 },
  "half-marathon": { name: "Half Marathon", distanceKm: 21.1 },
  "marathon": { name: "Marathon", distanceKm: 42.2 },
};

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
    case "/faq":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "Frequently Asked Questions – TrainPace"),
        React.createElement(
          "p",
          null,
          "Get answers to frequently asked questions about TrainPace pace calculator, elevation finder, fuel planner, and more."
        )
      );
    case "/about":
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "About TrainPace – Free Running Tools"),
        React.createElement(
          "p",
          null,
          "Learn about TrainPace, the free running tools platform built by runners for runners."
        )
      );
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1);
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
      if (url.includes("/guide/")) {
        const distance = url.split("/").pop();
        const race = RACE_DISTANCES[distance];
        if (race) {
          return React.createElement(
            "div",
            null,
            React.createElement("h1", null, `${race.name} Training Guide – TrainPace`),
            React.createElement(
              "p",
              null,
              `Complete ${race.name} training guide with pace calculator, training zones, and race day strategies. Free science-backed training tools for runners.`
            )
          );
        }
      }
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "TrainPace – Free Running Tools"),
        React.createElement("p", null, "Free running tools: pace calculator with VDOT zones, marathon fuel planner, and GPX elevation analyzer. No signup required.")
      );
  }
}

function getPageTitle(url) {
  switch (url) {
    case "/":
      return "TrainPace – Free Running Pace Calculator & Race Day Tools";
    case "/calculator":
      return "Running Pace Calculator – VDOT Training Zones, Easy to Tempo Pace | TrainPace";
    case "/fuel":
      return "Marathon Fuel Calculator – How Many Gels & When to Take Them | TrainPace";
    case "/elevationfinder":
      return "GPX Elevation Profile Viewer – Free Route Analysis & Climb Stats | TrainPace";
    case "/faq":
      return "FAQ – TrainPace Running Tools Help & Support";
    case "/about":
      return "About TrainPace – Free Running Tools for Self-Coached Athletes";
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1);
        return `${cityFormatted} Marathon Elevation Profile – Course Map & Hill Analysis | TrainPace`;
      }
      if (url.includes("/guide/")) {
        const distance = url.split("/").pop();
        const race = RACE_DISTANCES[distance];
        if (race) {
          return `${race.name} Training Guide – Pace Calculator & Training Plans | TrainPace`;
        }
      }
      return "TrainPace – Free Running Tools";
  }
}

function getPageDescription(url) {
  switch (url) {
    case "/":
      return "Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles.";
    case "/calculator":
      return "Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes Yasso 800s, race predictor for 5K to marathon, and printable pace charts.";
    case "/fuel":
      return "Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall.";
    case "/elevationfinder":
      return "Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day.";
    case "/faq":
      return "Get answers to frequently asked questions about TrainPace pace calculator, elevation finder, fuel planner, and more. Learn how to use our free running tools.";
    case "/about":
      return "Learn about TrainPace, the free running tools platform built by runners for runners. No ads, no paywalls, just science-backed training tools.";
    default:
      if (url.includes("/preview-route/")) {
        const city = url.split("/").pop();
        const cityFormatted = city.charAt(0).toUpperCase() + city.slice(1);
        return `${cityFormatted} Marathon elevation profile with interactive course map. See every hill, grade percentage, and total elevation gain. Plan your pacing strategy for race day.`;
      }
      if (url.includes("/guide/")) {
        const distance = url.split("/").pop();
        const race = RACE_DISTANCES[distance];
        if (race) {
          return `Complete ${race.name} training guide with pace calculator, training zones, and race day strategies. Free science-backed training tools for runners.`;
        }
      }
      return "Free running tools: pace calculator with VDOT zones, marathon fuel planner, and GPX elevation analyzer. No signup required.";
  }
}
