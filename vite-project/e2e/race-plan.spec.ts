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
    await calculator.calculate();

    // After calculation, results should appear (training paces heading)
    await expect(
      page.getByRole("heading", { name: /Training Paces/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("should calculate paces for a marathon", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.selectPreset("Marathon");
    await calculator.fillTime("3", "45", "0");
    await calculator.calculate();

    await expect(
      page.getByRole("heading", { name: /Training Paces/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("should allow manual distance entry", async ({ page }) => {
    const calculator = new CalculatorPage(page);
    await calculator.goto();

    await calculator.distanceInput.fill("15");
    await calculator.fillTime("1", "15", "0");
    await calculator.calculate();

    await expect(
      page.getByRole("heading", { name: /Training Paces/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to calculator from nav", async ({ page }) => {
    const nav = new NavigationHelper(page);
    await page.goto("/");

    await nav.goToCalculator();

    await expect(page).toHaveURL(/\/calculator/);
  });
});
