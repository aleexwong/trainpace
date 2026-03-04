import { test, expect } from "@playwright/test";

test.describe("Footer Free Tools", () => {
  test("should include Splits link in free tools", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const freeToolsSection = page.locator("footer").getByText("Free Tools");
    await expect(freeToolsSection).toBeVisible();

    const splitsLink = page.locator("footer").getByRole("link", {
      name: "Splits",
    });
    await expect(splitsLink).toBeVisible();
    await expect(splitsLink).toHaveAttribute("href", "/calculator");
  });
});
