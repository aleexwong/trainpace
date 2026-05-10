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

  test("should navigate to calculator from nav", async ({ page }) => {
    const nav = new NavigationHelper(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await nav.goToCalculator();

    await expect(page).toHaveURL(/\/calculator/);
    const calculator = new CalculatorPage(page);
    await expect(calculator.heading).toBeVisible();
  });

  test("should block calculation when distance and time are zero", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.distanceInput.fill("0");
    await calculator.fillTime("0", "0", "0");
    await calculator.calculate();

    await expect(page.getByText("Please enter a valid distance")).toBeVisible();
    await expect(page.getByText("Please enter a valid time")).toBeVisible();
    await expect(calculator.resultsHeading).not.toBeVisible();
  });

  test("should reject invalid time format when minutes overflow", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("10K");
    await calculator.fillTime("0", "60", "0");
    await calculator.calculate();

    await expect(page.getByText("Invalid time format")).toBeVisible();
    await expect(calculator.resultsHeading).not.toBeVisible();
  });

  test("should auto-calculate after selecting a suggested finish time", async ({
    page,
  }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("Marathon");
    await page.getByRole("button", { name: "4:00" }).click();

    await expect(calculator.resultsHeading).toBeVisible();
    await expect(page.getByText(/42.2 km in 4h 00m 00s/i)).toBeVisible();
  });
});
