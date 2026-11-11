import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

const guides = [
  {
    slug: "recovery-run-pace",
    heading: "Recovery Run Pace Guide",
    question: "How slow should a recovery run be?",
    example: "recovery pace is not a separate zone calculated by this tool",
    cta: "Find Your Easy Training Range",
  },
  {
    slug: "400m-interval-pace",
    heading: "400m Interval Pace and Track Splits",
    question: "How do I calculate my 400m split from pace per km?",
    example: "At 4:00/km, 400m takes 96 seconds (1:36)",
    cta: "Calculate Your Interval Training Pace",
  },
  {
    slug: "800m-interval-pace",
    heading: "800m Interval Pace and Two-Lap Splits",
    question: "Do Yasso 800s predict my marathon time?",
    example: "At 4:30/km, run 800m in 3:36 with 1:48 laps",
    cta: "Find Training Paces for Your 800m Repeats",
  },
  {
    slug: "negative-split-marathon",
    heading: "Negative Split Marathon Pacing Guide",
    question: "What is a negative split in a marathon?",
    example: "run the first half in 2:01 and the second in 1:59",
    cta: "Check Your Marathon Training Paces",
  },
];

for (const guide of guides) {
  const path = `/calculator/${guide.slug}`;
  const canonical = `https://trainpace.com${path}`;

  test(`${guide.slug}: content, metadata, schema, links, and working CTA`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: guide.heading, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByText(guide.example, { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: guide.question, exact: true })).toBeVisible();
    await expect(page.locator("title")).toHaveCount(1);
    expect((await page.title()).length).toBeLessThanOrEqual(60);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length).toBeGreaterThan(0);
    expect(description!.length).toBeLessThan(160);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);

    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graphs = schema.flatMap((text) => {
      const parsed = JSON.parse(text);
      return parsed["@graph"] ?? [parsed];
    });
    const faq = graphs.find((item) => item["@type"] === "FAQPage");
    expect(faq).toBeDefined();
    for (const item of faq.mainEntity) {
      await expect(page.getByRole("heading", { name: item.name, exact: true })).toBeVisible();
      await expect(page.getByText(item.acceptedAnswer.text, { exact: true })).toBeVisible();
    }
    const howTo = graphs.find((item) => item["@type"] === "HowTo");
    expect(howTo).toBeDefined();
    await expect(page.getByRole("heading", { name: howTo.name, exact: true })).toBeVisible();
    for (const step of howTo.step) {
      await expect(page.getByText(step.text, { exact: false })).toBeVisible();
    }

    const nav = page.getByRole("navigation", { name: "Pacing guides" });
    await expect(nav.getByRole("link")).toHaveCount(3);
    for (const other of guides.filter((item) => item.slug !== guide.slug)) {
      await expect(nav.locator(`a[href="/calculator/${other.slug}"]`)).toBeVisible();
    }
    await page.getByRole("link", { name: guide.cta, exact: true }).click();
    await expect(page).toHaveURL(/\/calculator$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  // Run `npm run build` first: these assertions deliberately inspect production
  // output, not Vite's SPA fallback, so missing prerendered pages fail the test.
  test(`${guide.slug}: prerender, Markdown, sitemap, and discovery`, async () => {
    const dist = resolve(process.cwd(), "dist");
    const [html, markdown, sitemap, llms] = await Promise.all([
      readFile(resolve(dist, `calculator/${guide.slug}/index.html`), "utf8"),
      readFile(resolve(dist, `calculator/${guide.slug}.md`), "utf8"),
      readFile(resolve(dist, "sitemap.xml"), "utf8"),
      readFile(resolve(dist, "llms.txt"), "utf8"),
    ]);
    expect(html).toContain(guide.heading);
    expect(html).toContain(guide.question);
    expect(html).toContain(`href="${canonical}"`);
    expect(html).not.toMatch(/content="noindex/);
    expect(markdown).toContain(guide.heading);
    expect(markdown).toContain(guide.question);
    expect(sitemap).toContain(`<loc>${canonical}</loc>`);
    expect(llms).toContain(`${canonical}.md`);
    for (const other of guides.filter((item) => item.slug !== guide.slug)) {
      expect(html).toContain(`href="/calculator/${other.slug}"`);
      expect(markdown).toContain(`/calculator/${other.slug}`);
    }
  });
}

test("existing calculator landing links to the new guides", async ({ page }) => {
  await page.goto("/calculator/5k-pace-calculator");
  const nav = page.getByRole("navigation", { name: "Pacing guides" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await nav.getByRole("link", { name: guides[0].heading, exact: true }).click();
  await expect(page).toHaveURL(`/calculator/${guides[0].slug}`);
  await expect(page.getByRole("heading", { level: 1, name: guides[0].heading, exact: true })).toBeVisible();
});
