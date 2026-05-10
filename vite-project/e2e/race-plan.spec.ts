import { test, expect } from "./fixtures/test-fixtures";

test.describe("Pace calculator page object", () => {
  /** Verifies a runner can generate pace outputs from a common preset scenario. */
  test("happy path calculates training paces from 10K preset", async ({ calculatorPage }) => {
    // Arrange
    await calculatorPage.goto();
    await calculatorPage.selectPreset("10K");
    await calculatorPage.fillTime("0", "50", "0");

    // Act
    await calculatorPage.calculateAndWaitForResults();

    // Assert
    await expect(calculatorPage.resultsHeading, "Training pace results should render after valid calculation input").toBeVisible();
    await expect(calculatorPage.distanceInput, "Distance input should reflect selected 10K preset").toHaveValue("10");
  });

  /** Ensures custom distance entry and unit conversion flow remains functional. */
  test("edge case supports custom distance and unit toggle", async ({ page, calculatorPage }) => {
    // Arrange
    await calculatorPage.goto();
    await calculatorPage.distanceInput.fill("13.1");

    // Act
    await page.getByRole("button", { name: /KM|MI/ }).click();

    // Assert
    await expect(calculatorPage.distanceInput, "Distance should convert when units are toggled").not.toHaveValue("13.1");
    await expect(calculatorPage.distanceInput, "Converted distance should still be non-empty and usable").not.toBeEmpty();
  });

  /** Confirms form validation prevents calculations when finish time is missing. */
  test("error state blocks calculation without finish time", async ({ page, calculatorPage }) => {
    // Arrange
    await calculatorPage.goto();
    await calculatorPage.selectPreset("Marathon");

    // Act
    await calculatorPage.calculate();

    // Assert
    await expect(page.getByText("Please enter a valid time"), "Missing time should show explicit validation guidance").toBeVisible();
    await expect(calculatorPage.resultsHeading, "Results section should stay hidden for invalid submissions").not.toBeVisible();
  });

  /** Confirms out-of-range minute values surface invalid time format messaging. */
  test("error state rejects invalid minute values", async ({ page, calculatorPage }) => {
    // Arrange
    await calculatorPage.goto();
    await calculatorPage.selectPreset("5K");
    await calculatorPage.fillTime("0", "75", "0");

    // Act
    await calculatorPage.calculate();

    // Assert
    await expect(page.getByText("Invalid time format"), "Invalid minute values should produce a clear validation error").toBeVisible();
    await expect(calculatorPage.resultsHeading, "Invalid time inputs should not render training pace results").not.toBeVisible();
  });

  /** Validates keyboard support for focus progression and semantic roles. */
  test("accessibility supports auto-advance and keyboard-only submission", async ({ page, calculatorPage }) => {
    // Arrange
    await calculatorPage.goto();
    await calculatorPage.selectPreset("10K");

    // Act
    await calculatorPage.hoursInput.focus();
    await page.keyboard.type("00");

    // Assert
    await expect(calculatorPage.minutesInput, "Typing two hour digits should auto-focus the minutes input").toBeFocused();
    await expect(page.getByRole("heading", { name: "Race Details" }), "Calculator form should expose a semantic heading").toBeVisible();

    // Act
    await page.keyboard.type("50");
    await page.keyboard.type("00");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Assert
    await expect(calculatorPage.resultsHeading, "Keyboard-only submission should generate calculator results").toBeVisible();
  });

  /** Ensures calculator interactions remain usable at a mobile viewport size. */
  test("mobile viewport variant calculates correctly", async ({ calculatorPage, useMobileViewport }) => {
    // Arrange
    await useMobileViewport();
    await calculatorPage.goto();
    await calculatorPage.selectPreset("10K");
    await calculatorPage.fillTime("0", "45", "0");

    // Act
    await calculatorPage.calculateAndWaitForResults();

    // Assert
    await expect(calculatorPage.calculateButton, "Calculate button should stay visible and operable on mobile").toBeVisible();
    await expect(calculatorPage.resultsHeading, "Results should still render correctly on mobile layouts").toBeVisible();
  });
});
