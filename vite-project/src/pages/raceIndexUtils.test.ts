import { describe, expect, it } from "vitest";
import { buildFeaturedRoutes, getDisplayedRacesForQuery } from "./raceIndexUtils";

describe("buildFeaturedRoutes", () => {
  it("builds featured links dynamically from race pages and available route data", () => {
    const pages = [
      {
        tool: "race",
        path: "/race/boston-marathon",
        h1: "Boston Marathon Race Prep",
        slug: "boston-marathon",
        description: "Boston race prep",
        previewRouteKey: "boston",
      },
      {
        tool: "race",
        path: "/race/london-marathon",
        h1: "London Marathon Race Prep",
        slug: "london-marathon",
        description: "London race prep",
        previewRouteKey: "london",
      },
      {
        tool: "race",
        path: "/race/duplicate-boston",
        h1: "Duplicate Boston",
        slug: "duplicate-boston",
        description: "Duplicate preview key should be ignored",
        previewRouteKey: "boston",
      },
      {
        tool: "race",
        path: "/race/no-preview",
        h1: "No Preview",
        slug: "no-preview",
        description: "No preview route key",
      },
      {
        tool: "pace",
        path: "/calculator/five-k",
        h1: "5K Pace",
        slug: "5k",
        description: "Not a race page",
        previewRouteKey: "boston",
      },
    ];

    const result = buildFeaturedRoutes(pages, {
      boston: { slug: "boston-marathon" },
      london: { slug: "london-marathon" },
    });

    expect(result).toEqual([
      { previewKey: "boston", path: "/race/boston-marathon" },
      { previewKey: "london", path: "/race/london-marathon" },
    ]);
  });

  it("ignores race pages whose preview key has no route data", () => {
    const pages = [
      {
        tool: "race",
        path: "/race/tokyo-marathon",
        h1: "Tokyo Marathon Race Prep",
        slug: "tokyo-marathon",
        description: "Tokyo race prep",
        previewRouteKey: "tokyo",
      },
    ];

    const result = buildFeaturedRoutes(pages, {});
    expect(result).toEqual([]);
  });
});

describe("getDisplayedRacesForQuery", () => {
  const pages = [
    {
      tool: "race",
      path: "/race/boston-marathon",
      h1: "Boston Marathon Race Prep",
      slug: "boston-marathon",
      description: "Race prep for Boston",
    },
    {
      tool: "race",
      path: "/race/chicago-marathon",
      h1: "Chicago Marathon Race Prep",
      slug: "chicago-marathon",
      description: "Race prep for Chicago",
    },
    {
      tool: "pace",
      path: "/calculator/marathon-pace",
      h1: "Marathon Pace Calculator",
      slug: "marathon-pace",
      description: "Calculator page",
    },
  ];

  it("returns all race pages when query is empty", () => {
    expect(getDisplayedRacesForQuery(pages, "")).toEqual([pages[0], pages[1]]);
  });

  it("matches across h1, slug, and description for non-empty queries", () => {
    expect(getDisplayedRacesForQuery(pages, "chicago")).toEqual([pages[1]]);
    expect(getDisplayedRacesForQuery(pages, "boston-marathon")).toEqual([pages[0]]);
    expect(getDisplayedRacesForQuery(pages, "prep for boston")).toEqual([pages[0]]);
  });
});

