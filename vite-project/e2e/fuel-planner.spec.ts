import { test, expect } from "@playwright/test";
import { FuelPlannerPage } from "./pages/FuelPlannerPage";
import { NavigationHelper } from "./pages/NavigationHelper";

test.describe("Fuel Planner", () => {
  test("should display the fuel planner form", async ({ page }) => {
    const fuelPlanner = new FuelPlannerPage(page);
    await fuelPlanner.goto();

    await expect(fuelPlanner.formCard).toBeVisible();
    await expect(fuelPlanner.raceTypeButton("10k")).toBeVisible();
    await expect(fuelPlanner.raceTypeButton("half")).toBeVisible();
    await expect(fuelPlanner.raceTypeButton("full")).toBeVisible();
    await expect(fuelPlanner.calculateButton).toBeVisible();
    await expect(fuelPlanner.calculateButton).toBeEnabled();
  });

  test("should show time input for 10K race type", async ({ page }) => {
    const fuelPlanner = new FuelPlannerPage(page);
    await fuelPlanner.goto();

    await fuelPlanner.selectRaceType("10k");

    await expect(
      page.getByTestId("fuel-time-minutes").locator("visible=true").first()
    ).toBeVisible();
  });

  test("should show hours and minutes inputs for half marathon", async ({
    page,
  }) => {
    const fuelPlanner = new FuelPlannerPage(page);
    await fuelPlanner.goto();

    await fuelPlanner.selectRaceType("half");

    await expect(
      page.getByTestId("fuel-time-hours").locator("visible=true").first()
    ).toBeVisible();
    await expect(
      page.getByTestId("fuel-time-minutes").locator("visible=true").first()
    ).toBeVisible();
  });

  test("should generate a fuel plan for a 10K", async ({ page }) => {
    const fuelPlanner = new FuelPlannerPage(page);
    await fuelPlanner.goto();

    await fuelPlanner.selectRaceType("10k");
    await fuelPlanner.fillFinishTimeMinutes("50");
    await fuelPlanner.calculateAndWaitForResults();

    await expect(fuelPlanner.resultsCard).toBeVisible();
  });

  test("should generate a fuel plan for a half marathon", async ({ page }) => {
    const fuelPlanner = new FuelPlannerPage(page);
    await fuelPlanner.goto();

    await fuelPlanner.selectRaceType("half");
    await fuelPlanner.fillFinishTimeHoursMinutes("1", "45");
    await fuelPlanner.calculateAndWaitForResults();

    await expect(fuelPlanner.resultsCard).toBeVisible();
  });

  test("should generate a fuel plan for a full marathon", async ({ page }) => {
    const fuelPlanner = new FuelPlannerPage(page);
    await fuelPlanner.goto();

    await fuelPlanner.selectRaceType("full");
    await fuelPlanner.fillFinishTimeHoursMinutes("3", "45");
    await fuelPlanner.calculateAndWaitForResults();

    await expect(fuelPlanner.resultsCard).toBeVisible();
  });

  test("should navigate to fuel planner from nav", async ({ page }) => {
    const nav = new NavigationHelper(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await nav.goToFuelPlanner();

    await expect(page).toHaveURL(/\/fuel/);
    await expect(
      page.getByRole("heading", { name: /Fuel Planner/i })
    ).toBeVisible();
  });
});
