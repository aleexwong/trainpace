/**
 * Stagehand = Playwright + an LLM that drives the browser from natural language.
 *
 * Why we want this:
 *  - Self-healing: when we rename a button or restructure the DOM, tests don't break.
 *  - Semantic assertions: ask the page questions instead of scraping text.
 *  - Covers programmatic SEO pages (80+ routes) without a selector-per-page maintenance tax.
 *
 * Install:
 *   npm i -D @browserbasehq/stagehand
 *   export OPENAI_API_KEY=... # or ANTHROPIC_API_KEY for Claude
 */

import { test, expect } from "@playwright/test";
// import { Stagehand } from "@browserbasehq/stagehand";
// import { z } from "zod";

type Stagehand = any;

const MARATHON_SLUGS = [
  "boston",
  "nyc",
  "chicago",
  "berlin",
  "london",
  "tokyo",
  "sydney",
  "oslo",
];

test.describe("Marathon preview routes — Stagehand", () => {
  let stagehand: Stagehand;

  test.beforeEach(async () => {
    // stagehand = new Stagehand({
    //   env: "LOCAL",
    //   modelName: "claude-sonnet-4-6",
    //   modelClientOptions: { apiKey: process.env.ANTHROPIC_API_KEY },
    //   enableCaching: true,
    // });
    // await stagehand.init();
  });

  test.afterEach(async () => {
    // await stagehand.close();
  });

  for (const slug of MARATHON_SLUGS) {
    test(`${slug}: course profile renders with correct race data`, async () => {
      const { page } = stagehand;
      await page.goto(`http://localhost:5173/preview-route/${slug}`);

      // Natural-language action — Stagehand picks the right element even if the
      // DOM changes. No selector churn, no page object model to maintain.
      await page.act("scroll to the course profile map");

      // Wait for the MapLibre canvas to paint at least one tile.
      await page.act("wait until the route line is visible on the map");

      // Semantic extraction — validated by a Zod schema.
      const data = await page.extract({
        instruction:
          "extract the race name, city, country, total distance in km, and elevation gain in meters",
        // schema: z.object({
        //   name: z.string(),
        //   city: z.string(),
        //   country: z.string(),
        //   distanceKm: z.number(),
        //   elevationGainM: z.number(),
        // }),
      });

      expect(data.name.toLowerCase()).toContain(slug);
      expect(data.distanceKm).toBeGreaterThan(40);
      expect(data.distanceKm).toBeLessThan(43);

      const observed = await page.observe(
        "is there a 'Save to dashboard' button?"
      );
      expect(observed.length).toBeGreaterThan(0);
    });
  }

  test("FAQ answers are semantically correct for Boston", async () => {
    const { page } = stagehand;
    await page.goto("http://localhost:5173/preview-route/boston");
    await page.act("expand the FAQ question about Heartbreak Hill");

    const answer = await page.extract({
      instruction: "extract the answer text for the Heartbreak Hill question",
      // schema: z.object({ answer: z.string() }),
    });

    // LLM-based assertion — catches regressions where answer changes meaning.
    const verdict = await page.extract({
      instruction: `Given this answer: "${answer.answer}" — does it correctly
        identify Heartbreak Hill as being around mile 20-21 of Boston? Answer yes or no.`,
      // schema: z.object({ correct: z.enum(["yes", "no"]) }),
    });
    expect(verdict.correct).toBe("yes");
  });

  test("tile loads from PMTiles archive, not Mapbox", async () => {
    const { page } = stagehand;
    const tileRequests: string[] = [];
    page.on("request", (req: any) => {
      const url = req.url();
      if (url.includes(".pmtiles") || url.includes("api.mapbox.com")) {
        tileRequests.push(url);
      }
    });

    await page.goto("http://localhost:5173/preview-route/berlin");
    await page.waitForTimeout(3000);

    expect(tileRequests.some((u) => u.includes(".pmtiles"))).toBe(true);
    expect(tileRequests.some((u) => u.includes("api.mapbox.com"))).toBe(false);
  });
});
