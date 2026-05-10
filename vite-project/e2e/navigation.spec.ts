import { test, expect } from "./fixtures/test-fixtures";

test.describe("Navigation helper component", () => {
  /** Verifies desktop navigation links route users to the expected pages. */
  test("happy path navigates to calculator from desktop nav", async ({ page, navigationHelper }) => {
    // Arrange
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 720 });

    // Act
    await navigationHelper.goToCalculator();

    // Assert
    await expect(page, "Desktop calculator link should route to /calculator").toHaveURL(/\/calculator/);
    await expect(page.getByRole("heading", { name: "Race Details" }), "Calculator destination should render its primary heading").toBeVisible();
  });

  /** Ensures logo navigation returns to home even after route changes. */
  test("edge case logo returns users home from nested route", async ({ page, navigationHelper }) => {
    // Arrange
    await page.goto("/fuel");
    await page.setViewportSize({ width: 1280, height: 720 });

    // Act
    await navigationHelper.goHome();

    // Assert
    await expect(page, "Clicking the logo should route users back to home").toHaveURL(/\/$/);
  });

  /** Confirms unknown routes gracefully fall back and allow recovery via nav links. */
  test("error state fallback route still allows navigation", async ({ page, navigationHelper }) => {
    // Arrange
    await page.goto("/this-route-does-not-exist");
    await page.setViewportSize({ width: 1280, height: 720 });

    // Act
    await navigationHelper.goToFuelPlanner();

    // Assert
    await expect(page, "Navigation links should recover users from fallback routes").toHaveURL(/\/fuel/);
    await expect(page.getByRole("heading", { name: /Fuel Planner/i }), "Recovered destination should render expected heading content").toBeVisible();
  });

  /** Validates aria role usage and keyboard-driven navigation on desktop. */
  test("accessibility supports keyboard link activation in desktop nav", async ({ page }) => {
    // Arrange
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopNav = page.getByTestId("desktop-nav");

    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Assert
    await expect(desktopNav, "Desktop navigation should expose a semantic nav region").toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Calculator" }), "Calculator link should expose a link role inside nav").toBeVisible();
    await expect(page, "Keyboard activation should navigate to the focused desktop nav link").toHaveURL(/\/about|\/calculator|\/$/);
  });

  /** Ensures mobile menu opens and routes correctly through the mobile drawer links. */
  test("mobile viewport variant supports drawer navigation", async ({ page, navigationHelper, useMobileViewport }) => {
    // Arrange
    await useMobileViewport();
    await page.goto("/");

    // Act
    await navigationHelper.openMobileMenu();
    await expect(navigationHelper.mobileNavLink("Fuel Planner"), "Fuel Planner link should appear in the opened mobile drawer").toBeVisible();
    await navigationHelper.mobileNavLink("Fuel Planner").click();

    // Assert
    await expect(page, "Mobile drawer navigation should route users to /fuel").toHaveURL(/\/fuel/);
    await expect(page.getByRole("heading", { name: /Fuel Planner/i }), "Fuel page heading should render after mobile navigation").toBeVisible();
  });
});
