import { test, expect } from "./fixtures/test-fixtures";

test.describe("Fuel planner page object", () => {
  /** Verifies a standard half-marathon workflow produces a fuel plan result. */
  test("happy path generates fuel plan for half marathon", async ({ fuelPlannerPage }) => {
    // Arrange
    await fuelPlannerPage.goto();
    await fuelPlannerPage.selectRaceType("half");
    await fuelPlannerPage.fillFinishTimeHoursMinutes("1", "45");

    // Act
    await fuelPlannerPage.calculateAndWaitForResults();

    // Assert
    await expect(fuelPlannerPage.resultsCard, "Fuel plan results card should appear for valid half-marathon inputs").toBeVisible();
    await expect(fuelPlannerPage.resultsHeading, "Results heading should confirm plan generation completed").toBeVisible();
  });

  /** Confirms 10K mode uses minutes-only inputs and hides the hours field. */
  test("edge case toggles time inputs for 10K mode", async ({ page, fuelPlannerPage }) => {
    // Arrange
    await fuelPlannerPage.goto();

    // Act
    await fuelPlannerPage.selectRaceType("10k");

    // Assert
    await expect(page.getByTestId("fuel-time-minutes").locator("visible=true").first(), "Minutes input should be visible in 10K mode").toBeVisible();
    await expect(page.getByTestId("fuel-time-hours").locator("visible=true").first(), "Hours input should be hidden in 10K mode").not.toBeVisible();
  });

  /** Ensures invalid finish time input triggers a destructive feedback path. */
  test("error state warns when finish time is invalid", async ({ page, fuelPlannerPage }) => {
    // Arrange
    await fuelPlannerPage.goto();
    await fuelPlannerPage.selectRaceType("full");
    await fuelPlannerPage.fillFinishTimeHoursMinutes("", "");

    // Act
    await fuelPlannerPage.calculate();

    // Assert
    await expect(page.getByText("Please enter a valid finish time."), "Invalid time input should surface a clear validation toast").toBeVisible();
    await expect(fuelPlannerPage.resultsCard, "Results should remain hidden when finish time validation fails").not.toBeVisible();
  });

  /** Validates semantic structure and keyboard operability for core fuel form controls. */
  test("accessibility checks role semantics and keyboard submission", async ({ page, fuelPlannerPage }) => {
    // Arrange
    await fuelPlannerPage.goto();
    await fuelPlannerPage.selectRaceType("10k");

    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Assert
    await expect(page.getByRole("heading", { name: /Fuel Planner/i }), "Fuel planner should expose a semantic page heading").toBeVisible();
    await expect(fuelPlannerPage.calculateButton, "Calculate control should expose button semantics").toHaveRole("button");

    // Act
    await fuelPlannerPage.fillFinishTimeMinutes("50");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Assert
    await expect(fuelPlannerPage.resultsCard, "Keyboard-only activation should generate a visible fuel plan").toBeVisible();
  });

  /** Ensures the form and result rendering work correctly on mobile screens. */
  test("mobile viewport variant generates 10K fuel plan", async ({ fuelPlannerPage, useMobileViewport }) => {
    // Arrange
    await useMobileViewport();
    await fuelPlannerPage.goto();
    await fuelPlannerPage.selectRaceType("10k");
    await fuelPlannerPage.fillFinishTimeMinutes("48");

    // Act
    await fuelPlannerPage.calculateAndWaitForResults();

    // Assert
    await expect(fuelPlannerPage.formCard, "Fuel planner form should remain visible on mobile layouts").toBeVisible();
    await expect(fuelPlannerPage.resultsCard, "Fuel plan result should render properly on mobile layouts").toBeVisible();
  });
});
