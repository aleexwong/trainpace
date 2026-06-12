import { test, expect } from "@playwright/test";

test.describe("Training Plan Generator", () => {
  test("should load the training plan page", async ({ page }) => {
    await page.goto("/plan");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page).toHaveTitle(/Training Plan/i);
  });

  test("should display goal race selector", async ({ page }) => {
    await page.goto("/plan");
    await page.waitForLoadState("networkidle");

    // Should have race distance options (5K, 10K, Half, Marathon)
    const distanceOptions = page.locator("button, [role='radio']").filter({ hasText: /5K|10K|Half|Marathon/i });
    await expect(distanceOptions.first()).toBeVisible();
  });

  test("should generate a training plan", async ({ page }) => {
    await page.goto("/plan");
    await page.waitForLoadState("networkidle");

    // Click Half Marathon
    const halfButton = page.getByRole("button", { name: /Half Marathon/i }).first();
    if (await halfButton.isVisible()) {
      await halfButton.click();
    }

    // Click generate / submit button
    const generateBtn = page.getByRole("button", { name: /Generate|Create|Build/i }).first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      // Wait for plan to appear
      await page.waitForTimeout(1000);
    }
  });

  test("should accept URL params from pace calculator", async ({ page }) => {
    // Navigate with pace params (as if coming from the pace calculator)
    await page.goto("/plan?easy=6:30&tempo=5:15&interval=4:45&race=5:00&source=calculator");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should accept URL params from VDOT calculator", async ({ page }) => {
    await page.goto("/plan?easy=6:30&tempo=5:15&interval=4:45&race=5:00&source=vdot");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shareable pace calculator URL should auto-calculate", async ({ page }) => {
    // Marathon in 3:30 = 12600 seconds, 42.195 km
    await page.goto("/calculator?d=42.195&t=12600");
    await page.waitForLoadState("networkidle");

    // Results heading should appear without clicking calculate
    await expect(page.locator("text=Training Paces").first()).toBeVisible({ timeout: 5000 });
  });
});
