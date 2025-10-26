import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check URL
    await expect(page).toHaveURL("/");

    // Verify page title contains TrainPace
    await expect(page).toHaveTitle(/TrainPace/i);
  });

  test("has main navigation", async ({ page }) => {
    await page.goto("/");

    // Check for nav element
    const nav = page.locator("nav");
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("renders without critical console errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out Firebase/Auth warnings which are expected
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Firebase") &&
        !error.includes("auth") &&
        !error.includes("firebaseError")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("has visible main content", async ({ page }) => {
    await page.goto("/");

    // Check that main content area exists and is visible
    const main = page.locator('main, [role="main"], .main-content').first();
    await expect(main).toBeVisible();
  });
});
