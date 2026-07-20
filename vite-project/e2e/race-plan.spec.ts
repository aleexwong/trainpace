import { test, expect } from "@playwright/test";
import { CalculatorPage } from "./pages/CalculatorPage";
import { NavigationHelper } from "./pages/NavigationHelper";

test.describe("Race Plan (Pace Calculator)", () => {
  test("should display the race details form", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await expect(calculator.heading).toBeVisible();
    await expect(calculator.distanceInput).toBeVisible();
    await expect(calculator.hoursInput).toBeVisible();
    await expect(calculator.minutesInput).toBeVisible();
    await expect(calculator.secondsInput).toBeVisible();
    await expect(calculator.calculateButton).toBeVisible();
    await expect(calculator.calculateButton).toBeEnabled();
  });

  test("should show preset distance buttons", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await expect(calculator.presetButton("5K")).toBeVisible();
    await expect(calculator.presetButton("10K")).toBeVisible();
    await expect(calculator.presetButton("Half Marathon")).toBeVisible();
    await expect(calculator.presetButton("Marathon")).toBeVisible();
  });

  test("should populate distance when selecting a preset", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("10K");

    await expect(calculator.distanceInput).toHaveValue("10");
  });

  test("should calculate paces for a 10K race", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("10K");
    await calculator.fillTime("0", "50", "0");
    await calculator.calculateAndWaitForResults();

    await expect(calculator.resultsHeading).toBeVisible();
  });

  test("should calculate paces for a marathon", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("Marathon");
    await calculator.fillTime("3", "45", "0");
    await calculator.calculateAndWaitForResults();

    await expect(calculator.resultsHeading).toBeVisible();
  });

  test("should allow manual distance entry", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.distanceInput.fill("15");
    await calculator.fillTime("1", "15", "0");
    await calculator.calculateAndWaitForResults();

    await expect(calculator.resultsHeading).toBeVisible();
  });

  test("should fill preset distance in miles when MI unit is active", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await page.getByRole("button", { name: /KM.*MI/s }).click();
    await calculator.selectPreset("Marathon");

    await expect(calculator.distanceInput).toHaveValue("26.2");
  });

  test("should show suggested time chips when typing a preset distance", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.distanceInput.fill("5");

    await expect(page.getByText("Common finishing times")).toBeVisible();
    await expect(page.getByRole("button", { name: "25:00" })).toBeVisible();
  });

  test("should auto-calculate when tapping a suggested time chip", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("10K");
    await page.getByRole("button", { name: "50:00" }).click();

    await expect(calculator.resultsHeading).toBeVisible({ timeout: 10000 });
  });

  test("should show live race pace once distance and time are entered", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("10K");
    await calculator.fillTime("0", "50", "0");

    await expect(page.getByText("5:00 min/km")).toBeVisible();
  });

  test("should calculate when pressing Enter in a time field", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("5K");
    await calculator.fillTime("0", "25", "0");
    await calculator.secondsInput.press("Enter");

    await expect(calculator.resultsHeading).toBeVisible({ timeout: 10000 });
  });

  test("should show inline errors when calculating with empty form", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.calculate();

    await expect(page.getByText("Distance is required")).toBeVisible();
    await expect(page.getByText("Please enter a valid time")).toBeVisible();
  });

  test("should navigate to calculator from nav", async ({ page }) => {
    const nav = new NavigationHelper(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await nav.goToCalculator();

    await expect(page).toHaveURL(/\/calculator/);
    const calculator = new CalculatorPage(page);
    await expect(calculator.heading).toBeVisible();
  });
});
