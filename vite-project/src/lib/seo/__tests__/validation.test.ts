import { describe, it, expect } from "vitest";
import {
  validatePage,
  validateAllPages,
  generateQualityReport,
  runPrePublishChecks,
  formatForCI,
  getCIExitCode,
} from "../validation";
import type { SeoPageConfig } from "../types";

const createPage = (index: number, overrides: Partial<SeoPageConfig> = {}): SeoPageConfig => ({
  id: `pace:page-${index}`,
  slug: `page-${index}`,
  path: `/calculator/page-${index}`,
  tool: "pace",
  title: `Pace Calculator Page ${index} | TrainPace`,
  description:
    "A sufficiently descriptive meta description for testing validation behavior and scoring outcomes.",
  h1: `Pace Calculator Page ${index}`,
  intro: "This intro paragraph is long enough to satisfy minimum content checks for validation.",
  bullets: ["Benefit one", "Benefit two"],
  cta: { href: "/calculator", label: "Open Calculator" },
  faq: [
    {
      question: "How do I use this?",
      answer: "Enter your race time and review the generated pacing suggestions and splits.",
    },
    {
      question: "Is this free?",
      answer: "Yes, this calculator is available for free and designed for practical race planning.",
    },
  ],
  howTo: {
    name: "Use pace calculator",
    description: "Quickly calculate practical training zones.",
    steps: [{ name: "Enter data", text: "Provide race details and submit the form." }],
  },
  ...overrides,
});

describe("validation", () => {
  describe("validatePage", () => {
    it("returns valid result for high-quality page", () => {
      const result = validatePage(createPage(1));
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.errors).toEqual([]);
    });

    it("reports errors and warnings for incomplete/low-quality page", () => {
      const invalid = createPage(2, {
        id: "",
        slug: "",
        path: "",
        title: "",
        description: "",
        h1: "",
        intro: "",
        bullets: [],
        cta: { href: "", label: "" },
        faq: [],
        howTo: undefined,
      });

      const result = validatePage(invalid);
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(30);
      expect(result.errors.some((e) => e.field === "id")).toBe(true);
      expect(result.errors.some((e) => e.field === "title")).toBe(true);
      expect(result.warnings.some((w) => w.field === "faq")).toBe(true);
      expect(result.warnings.some((w) => w.field === "howTo")).toBe(true);
    });

    it("warns when title lacks brand separator", () => {
      const result = validatePage(createPage(3, { title: "Simple title without separator for testing" }));
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes("brand separator"))).toBe(true);
    });
  });

  describe("validateAllPages", () => {
    it("validates all pages and aggregates cross-page issues", () => {
      const pageA = createPage(1, {
        id: "pace:a",
        slug: "shared-slug-a",
        title: "Shared Title | TrainPace",
        description: "Shared description for testing duplicate detection and reporting behavior.",
        intro: "alpha intro words for similarity and uniqueness checks",
        relatedPageIds: ["pace:b"],
      });
      const pageB = createPage(2, {
        id: "pace:b",
        slug: "shared-slug-b",
        title: "Shared Title | TrainPace",
        description: "Shared description for testing duplicate detection and reporting behavior.",
        intro: "alpha intro words for similarity and uniqueness checks",
        relatedPageIds: ["missing:id"],
        parentPageId: "missing:parent",
        hubPageId: "missing:hub",
      });

      const result = validateAllPages([pageA, pageB]);
      expect(result.totalPages).toBe(2);
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.duplicateIssues.isUnique).toBe(false);
      expect(result.duplicateIssues.duplicates.some((d) => d.field === "title")).toBe(true);
      expect(result.linkingIssues.brokenLinks.length).toBeGreaterThan(0);
    });
  });

  describe("generateQualityReport", () => {
    it("generates a quality report with recommendations", () => {
      const badA = createPage(1, {
        id: "",
        slug: "",
        title: "",
        description: "",
        intro: "",
        bullets: [],
        cta: { href: "", label: "" },
        faq: [],
        howTo: undefined,
      });
      const badB = createPage(2, {
        id: "pace:b",
        slug: "b",
        title: "Duplicate Title | TrainPace",
        description: "desc",
        intro: "thin",
        relatedPageIds: ["missing:id"],
      });
      const badC = createPage(3, {
        id: "pace:c",
        slug: "c",
        title: "Duplicate Title | TrainPace",
        description: "desc",
        intro: "thin",
      });

      const report = generateQualityReport(validateAllPages([badA, badB, badC]));
      expect(["A", "B", "C", "D", "F"]).toContain(report.summary.grade);
      expect(report.summary.issues.critical).toBeGreaterThan(0);
      expect(report.sections).toHaveLength(4);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("runPrePublishChecks", () => {
    it("runs pre-publish checks and flags blockers/warnings", () => {
      const okPage = createPage(1, { id: "pace:ok", slug: "ok", path: "/calculator/ok" });
      const duplicatePathPage = createPage(2, { id: "pace:dup", slug: "dup", path: "/calculator/ok" });
      const invalidPathPage = createPage(3, {
        id: "pace:invalid",
        slug: "invalid",
        path: "/Calculator/Invalid",
        intro: "tiny",
        bullets: [],
        title: "",
        description: "",
      });

      const checks = runPrePublishChecks([okPage, duplicatePathPage, invalidPathPage]);
      expect(checks.canPublish).toBe(false);
      expect(checks.blockers.some((b) => b.includes("duplicate paths"))).toBe(true);
      expect(
        checks.warnings.some((w) => w.includes("invalid URL paths")) ||
          checks.blockers.some((b) => b.includes("thin/empty content"))
      ).toBe(true);
    });
  });

  describe("CI helpers", () => {
    it("formats CI output for failures", () => {
      const a = createPage(1, { id: "pace:a", relatedPageIds: ["missing:id"] });
      const b = createPage(2, { id: "pace:b", relatedPageIds: ["pace:a"] });
      const result = validateAllPages([a, b]);
      const output = formatForCI(result);

      expect(output).toContain("SEO VALIDATION REPORT");
      expect(output).toContain("LINKING ISSUES:");
    });

    it("computes non-zero exit code for blocking issues", () => {
      const a = createPage(1, { id: "pace:a", relatedPageIds: ["missing:id"] });
      const b = createPage(2, { id: "pace:b", relatedPageIds: ["pace:a"] });
      const result = validateAllPages([a, b]);

      expect(getCIExitCode(result)).toBe(1);
    });

    it("returns zero CI exit code when validation has no blocking issues", () => {
      const p1 = createPage(1, { id: "pace:a", relatedPageIds: ["pace:b"] });
      const p2 = createPage(2, { id: "pace:b", relatedPageIds: ["pace:a"] });
      const result = validateAllPages([p1, p2]);

      expect(result.invalidPages).toBe(0);
      expect(result.linkingIssues.brokenLinks).toHaveLength(0);
      expect(getCIExitCode(result)).toBe(0);
    });
  });
});
