import { describe, it, expect, vi, afterEach } from "vitest";
import {
  chunkPages,
  generateDataManifest,
  generateSitemapUrls,
  generateSitemapXml,
  generateSitemapIndexXml,
  generateSitemaps,
  getAllPrerenderRoutes,
  generateRoutesBatched,
  hashContent,
  isCacheValid,
  getOptimizedPrerenderConfig,
  DEFAULT_PRERENDER_CONFIG,
  exportPageDataAsJson,
  exportAllPagesAsJson,
  calculateBuildStats,
} from "../build-utils";
import type { SeoPageConfig } from "../types";
import { BASE_URL } from "../types";

const createPage = (index: number, overrides: Partial<SeoPageConfig> = {}): SeoPageConfig => ({
  id: `pace:page-${index}`,
  slug: `page-${index}`,
  path: `/calculator/page-${index}`,
  tool: "pace",
  title: `Pace Page ${index} | TrainPace`,
  description: `Description for pace page ${index} with enough detail for tests.`,
  h1: `Pace Page ${index}`,
  intro: `This intro for page ${index} provides unique words for comparisons and validation.`,
  bullets: ["One", "Two"],
  cta: { href: "/calculator", label: "Open" },
  ...overrides,
});

describe("build-utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chunks pages by tool and by max chunk size", () => {
    const pages = [
      createPage(1, { tool: "pace" }),
      createPage(2, { tool: "pace" }),
      createPage(3, { tool: "fuel", id: "fuel:3", path: "/fuel/3" }),
    ];

    const chunks = chunkPages(pages, { maxPagesPerChunk: 1, chunkByTool: true });
    expect(chunks.size).toBe(3);
    expect(chunks.get("pace-0")?.[0].id).toBe("pace:page-1");
    expect(chunks.get("pace-1")?.[0].id).toBe("pace:page-2");
    expect(chunks.get("fuel-0")?.[0].id).toBe("fuel:3");
  });

  it("chunks pages sequentially when chunkByTool=false", () => {
    const pages = [createPage(1), createPage(2), createPage(3)];
    const chunks = chunkPages(pages, { maxPagesPerChunk: 2, chunkByTool: false });

    expect(chunks.size).toBe(2);
    expect(chunks.get("chunk-0")).toHaveLength(2);
    expect(chunks.get("chunk-1")).toHaveLength(1);
  });

  it("generates a correct data manifest with totals", () => {
    const chunks = new Map<string, SeoPageConfig[]>([
      ["pace-0", [createPage(1), createPage(2)]],
      ["fuel-0", [createPage(3, { tool: "fuel", id: "fuel:3", path: "/fuel/3" })]],
    ]);

    const manifest = generateDataManifest(chunks, "/custom");
    expect(manifest.chunks).toEqual([
      { id: "pace-0", path: "/custom/pace-0.json", count: 2, tool: "pace" },
      { id: "fuel-0", path: "/custom/fuel-0.json", count: 1, tool: "fuel" },
    ]);
    expect(manifest.totals.pages).toBe(3);
    expect(manifest.totals.byTool.pace).toBe(2);
    expect(manifest.totals.byTool.fuel).toBe(1);
  });

  it("generates sitemap URLs with escaped XML and defaults", () => {
    const now = "2026-03-19";
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(`${now}T10:00:00.000Z`);
    const pages = [
      createPage(1, {
        path: "/calculator/a&b",
        dateModified: "2026-02-01",
        priority: 0.3,
        changefreq: "daily",
      }),
      createPage(2, { datePublished: "2026-01-01" }),
    ];
    const urls = generateSitemapUrls(pages);
    const xml = generateSitemapXml(urls);

    expect(urls[0]).toMatchObject({
      loc: `${BASE_URL}/calculator/a&b`,
      lastmod: "2026-02-01",
      changefreq: "daily",
      priority: 0.3,
    });
    expect(urls[1].lastmod).toBe("2026-01-01");
    expect(xml).toContain("<loc>https://trainpace.com/calculator/a&amp;b</loc>");
    expect(xml).toContain("<priority>0.3</priority>");
  });

  it("generates a sitemap index when max URL threshold is exceeded", () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue("2026-03-19T00:00:00.000Z");
    const pages = [createPage(1), createPage(2), createPage(3)];
    const sitemaps = generateSitemaps(pages, { maxUrlsPerSitemap: 2 });

    expect(sitemaps.has("sitemap.xml")).toBe(true);
    expect(sitemaps.has("sitemap-1.xml")).toBe(true);
    expect(sitemaps.has("sitemap-2.xml")).toBe(true);
    expect(sitemaps.get("sitemap.xml")).toContain("<sitemapindex");
  });

  it("generates sitemap index XML with paths", () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue("2026-03-19T00:00:00.000Z");
    const xml = generateSitemapIndexXml(["/sitemap-1.xml"], "https://example.com");
    expect(xml).toContain("<loc>https://example.com/sitemap-1.xml</loc>");
    expect(xml).toContain("<lastmod>2026-03-19</lastmod>");
  });

  it("returns all prerender routes and batches routes", () => {
    const pages = [createPage(1), createPage(2), createPage(3)];
    expect(getAllPrerenderRoutes(pages)).toEqual(pages.map((p) => p.path));

    const batches = Array.from(generateRoutesBatched(pages, 2));
    expect(batches).toEqual([
      [pages[0].path, pages[1].path],
      [pages[2].path],
    ]);
  });

  it("hashes content deterministically and validates cache expiry/hash", () => {
    const h1 = hashContent("abc");
    const h2 = hashContent("abc");
    const h3 = hashContent("xyz");
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);

    const now = 1_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const entry = { data: 1, timestamp: now - 1000, hash: h1 };

    expect(isCacheValid(entry, h1, 2000)).toBe(true);
    expect(isCacheValid(entry, "different", 2000)).toBe(false);
    expect(isCacheValid({ ...entry, timestamp: now - 3000 }, h1, 2000)).toBe(false);
    expect(isCacheValid(undefined, h1, 2000)).toBe(false);
  });

  it("returns optimized prerender configs by page-count ranges", () => {
    expect(getOptimizedPrerenderConfig(999).concurrency).toBe(20);
    expect(getOptimizedPrerenderConfig(5000)).toEqual({
      ...DEFAULT_PRERENDER_CONFIG,
      concurrency: 10,
      batchDelay: 200,
    });
    expect(getOptimizedPrerenderConfig(20000)).toEqual({
      ...DEFAULT_PRERENDER_CONFIG,
      concurrency: 5,
      batchDelay: 500,
    });
    expect(getOptimizedPrerenderConfig(60000)).toEqual({
      concurrency: 3,
      timeout: 60000,
      retries: 3,
      batchDelay: 1000,
    });
  });

  it("exports page JSON payloads with expected shape", () => {
    const page = createPage(1, {
      faq: [{ question: "Q", answer: "A" }],
      howTo: {
        name: "HowTo",
        description: "Desc",
        steps: [{ name: "Step", text: "Do it" }],
      },
    });

    const one = JSON.parse(exportPageDataAsJson(page));
    const all = JSON.parse(exportAllPagesAsJson([page, createPage(2)]));

    expect(one.id).toBe(page.id);
    expect(one.faq).toHaveLength(1);
    expect(one.howTo.name).toBe("HowTo");
    expect(all).toHaveLength(2);
    expect(Object.keys(all[0]).sort()).toEqual(
      ["description", "id", "path", "slug", "title", "tool"].sort()
    );
  });

  it("calculates build stats correctly", () => {
    const pages = [
      createPage(1, {
        faq: [{ question: "Q1", answer: "A1" }],
        howTo: { name: "H", description: "D", steps: [{ name: "S", text: "T" }] },
      }),
      createPage(2, { tool: "fuel", id: "fuel:2", path: "/fuel/2", faq: [] }),
    ];
    const stats = calculateBuildStats(pages);

    expect(stats.totalPages).toBe(2);
    expect(stats.pagesByTool.pace).toBe(1);
    expect(stats.pagesByTool.fuel).toBe(1);
    expect(stats.pagesWithFaq).toBe(1);
    expect(stats.pagesWithHowTo).toBe(1);
    expect(stats.estimatedBuildTimeMinutes).toBe(1);
  });
});
