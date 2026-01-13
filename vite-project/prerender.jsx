import React from "react";
import { renderToString } from "react-dom/server";

// Marathon-specific SEO data (defined first so all functions can use it)
const marathonSeoData = {
  // World Marathon Majors
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
  // US Popular Marathons
  la: {
    name: "LA Marathon",
    elevation: "282m",
    highlight: "Stadium to the Sea",
    difficulty: "Moderate (Net Downhill)",
  },
  marinecorps: {
    name: "Marine Corps Marathon",
    elevation: "198m",
    highlight: "The People's Marathon",
    difficulty: "Moderate-Hard",
  },
  bigsur: {
    name: "Big Sur Marathon",
    elevation: "610m",
    highlight: "Most Scenic Course",
    difficulty: "Very Hard (Not PR Course)",
  },
  philadelphia: {
    name: "Philadelphia Marathon",
    elevation: "178m",
    highlight: "Rocky Steps Finish",
    difficulty: "Moderate",
  },
  houston: {
    name: "Houston Marathon",
    elevation: "45m",
    highlight: "BQ Qualifier Favorite",
    difficulty: "Easy (PR Course)",
  },
  twincities: {
    name: "Twin Cities Marathon",
    elevation: "167m",
    highlight: "Most Beautiful Urban",
    difficulty: "Moderate (Net Downhill)",
  },
  grandmas: {
    name: "Grandma's Marathon",
    elevation: "187m",
    highlight: "Lake Superior Views",
    difficulty: "Moderate (Net Downhill)",
  },
  disney: {
    name: "Walt Disney World Marathon",
    elevation: "48m",
    highlight: "Through All 4 Parks",
    difficulty: "Easy (Experience Focus)",
  },
  portland: {
    name: "Portland Marathon",
    elevation: "156m",
    highlight: "City of Roses",
    difficulty: "Moderate",
  },
  // European Marathons
  paris: {
    name: "Paris Marathon",
    elevation: "156m",
    highlight: "Champs-Élysées to Eiffel Tower",
    difficulty: "Moderate",
  },
  amsterdam: {
    name: "Amsterdam Marathon",
    elevation: "32m",
    highlight: "Olympic Stadium Finish",
    difficulty: "Easy (PR Course)",
  },
  valencia: {
    name: "Valencia Marathon",
    elevation: "28m",
    highlight: "World Record Course",
    difficulty: "Easy (Fastest PR Course)",
  },
};

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
  switch (url) {
    case "/":
      return "Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles.";
    case "/calculator":
      return "Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes Yasso 800s, race predictor for 5K to marathon, and printable pace charts.";
    case "/fuel":
      return "Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall.";
    case "/elevationfinder":
      return "Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day.";
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
