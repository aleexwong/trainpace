import { describe, it, expect } from "vitest";
import {
  optimizeTitle,
  optimizeDescription,
  generateMetaTags,
  generateToolMetaTags,
  generateHomepageMetaTags,
  generateHelmetProps,
  generatePrerenderMetaElements,
  validateMetaTags,
} from "../meta-generators";
import type { SeoPageConfig } from "../types";
import { BASE_URL } from "../types";

const createPage = (overrides: Partial<SeoPageConfig> = {}): SeoPageConfig => ({
  id: "pace:marathon-pace",
  slug: "marathon-pace",
  path: "/calculator/marathon-pace",
  tool: "pace",
  title: "Marathon Pace Calculator | TrainPace",
  description:
    "Calculate marathon training and race paces from a recent result with realistic VDOT-based zones.",
  h1: "Marathon Pace Calculator",
  intro: "Use your race result to estimate your most effective marathon training zones.",
  bullets: ["Get realistic pace ranges", "Compare pace zones quickly"],
  cta: { href: "/calculator", label: "Open Calculator" },
  ...overrides,
});

describe("meta-generators", () => {
  describe("optimizeTitle", () => {
    it("keeps short titles unchanged", () => {
      const title = "Short title | TrainPace";
      expect(optimizeTitle(title)).toBe(title);
    });

    it("removes brand suffix when that keeps title within limit", () => {
      const longWithSuffix = "This title is intentionally long but valid once brand is removed | TrainPace";
      expect(optimizeTitle(longWithSuffix)).toBe(
        "This title is intentionally long but valid once brand is removed"
      );
    });

    it("truncates long titles with ellipsis", () => {
      const veryLong =
        "This title is far too long for search engines and should be truncated to a clean length with an ellipsis | TrainPace";
      const optimized = optimizeTitle(veryLong);
      expect(optimized.endsWith("...")).toBe(true);
      expect(optimized.length).toBeLessThanOrEqual(60);
    });
  });

  describe("optimizeDescription", () => {
    it("keeps short descriptions unchanged", () => {
      const description = "A short but valid SEO description.";
      expect(optimizeDescription(description)).toBe(description);
    });

    it("prefers ending at sentence boundaries when truncating", () => {
      const longDescription =
        "This first sentence is intentionally long enough to survive truncation. This second sentence continues with extra words that should be trimmed for display.";
      const optimized = optimizeDescription(longDescription);
      expect(optimized.endsWith(".")).toBe(true);
      expect(optimized.length).toBeLessThanOrEqual(160);
    });
  });

  describe("generateMetaTags", () => {
    it("generates complete tags with defaults", () => {
      const page = createPage();
      const meta = generateMetaTags(page);

      expect(meta.title).toBe(page.title);
      expect(meta.description).toBe(optimizeDescription(page.description));
      expect(meta.canonical).toBe(`${BASE_URL}${page.path}`);
      expect(meta.openGraph.url).toBe(meta.canonical);
      expect(meta.openGraph.image).toBe(`${BASE_URL}/landing-page-2025.png`);
      expect(meta.twitter.site).toBe("@trainpace");
    });

    it("respects overrides and article metadata", () => {
      const page = createPage({
        canonicalUrl: "https://example.com/custom-canonical",
        noIndex: true,
      });
      const meta = generateMetaTags(page, {
        ogType: "article",
        ogImage: "https://cdn.example.com/og.png",
        articleMeta: {
          publishedTime: "2026-01-01",
          modifiedTime: "2026-01-02",
          author: "TrainPace",
          section: "Training",
          tags: ["marathon", "pace"],
        },
      });

      expect(meta.canonical).toBe("https://example.com/custom-canonical");
      expect(meta.robots).toBe("noindex, nofollow");
      expect(meta.openGraph.type).toBe("article");
      expect(meta.openGraph.image).toBe("https://cdn.example.com/og.png");
      expect(meta.openGraph.publishedTime).toBe("2026-01-01");
      expect(meta.openGraph.tags).toEqual(["marathon", "pace"]);
    });
  });

  it("generates tool and homepage meta tags with expected canonicals", () => {
    const toolMeta = generateToolMetaTags("pace");
    const homeMeta = generateHomepageMetaTags();

    expect(toolMeta.canonical).toBe(`${BASE_URL}/calculator`);
    expect(toolMeta.openGraph.siteName).toBe("TrainPace");
    expect(homeMeta.canonical).toBe(BASE_URL);
    expect(homeMeta.openGraph.url).toBe(BASE_URL);
  });

  it("generates Helmet props including optional meta fields", () => {
    const page = createPage({ noIndex: true });
    const meta = generateMetaTags(page, {
      articleMeta: {
        publishedTime: "2026-01-01",
        modifiedTime: "2026-01-02",
        author: "Author",
        section: "Section",
        tags: ["tag-a", "tag-b"],
      },
    });
    const helmet = generateHelmetProps(meta);

    expect(helmet.title).toBe(page.title);
    expect(helmet.link).toEqual([{ rel: "canonical", href: meta.canonical }]);
    expect(helmet.meta.some((m) => m.name === "robots" && m.content === "noindex, nofollow")).toBe(
      true
    );
    expect(
      helmet.meta.some((m) => m.property === "article:published_time" && m.content === "2026-01-01")
    ).toBe(true);
    expect(helmet.meta.filter((m) => m.property === "article:tag")).toHaveLength(2);
  });

  it("generates prerender elements with canonical and robots", () => {
    const meta = generateMetaTags(createPage({ noIndex: true }));
    const elements = Array.from(generatePrerenderMetaElements(meta));

    expect(
      elements.some(
        (e) =>
          e.type === "meta" &&
          e.props.name === "viewport" &&
          e.props.content === "width=device-width, initial-scale=1"
      )
    ).toBe(true);
    expect(
      elements.some(
        (e) => e.type === "meta" && e.props.name === "robots" && e.props.content === "noindex, nofollow"
      )
    ).toBe(true);
    expect(
      elements.some(
        (e) => e.type === "link" && e.props.rel === "canonical" && e.props.href === meta.canonical
      )
    ).toBe(true);
  });

  describe("validateMetaTags", () => {
    it("returns valid result for complete metadata", () => {
      const result = validateMetaTags(generateMetaTags(createPage()));
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("reports errors and warnings for invalid metadata", () => {
      const result = validateMetaTags({
        title: "",
        description: "short",
        canonical: "http://insecure.example.com",
        openGraph: {
          title: "x",
          description: "y",
          url: "http://insecure.example.com",
          type: "website",
          image: "",
          siteName: "TrainPace",
        },
        twitter: {
          card: "summary",
          title: "x",
          description: "y",
          image: "",
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title is required");
      expect(result.warnings.some((w) => w.includes("recommended"))).toBe(true);
      expect(result.warnings).toContain("Canonical URL should use HTTPS");
      expect(result.warnings).toContain("OG image is recommended for social sharing");
    });
  });
});
