import { test, expect } from "@playwright/test";
import { TutorialPage } from "./pages/TutorialPage";
import { CalculatorPage } from "./pages/CalculatorPage";

/**
 * The tutorial is optional by design, so these tests care as much about it
 * staying out of the way as about it working: it must never block the
 * calculator, must ask at most once per device, and must always be leaveable.
 *
 * PostHog is not configured in the E2E environment, so analytics no-op here —
 * these cover behaviour only.
 */
test.describe("Guided tutorial", () => {
  // These are multi-navigation journeys — some load the page twice and all of
  // them sit through the invite's deliberate 1.4s entry delay — so the default
  // 30s per test is genuinely too tight against a dev server.
  test.describe.configure({ timeout: 60_000 });

  test("offers the tour on a first visit and starts it on accept", async ({ page }) => {
    const tutorial = new TutorialPage(page);
    await tutorial.resetState();
    await tutorial.goto();

    await expect(tutorial.invite).toBeVisible({ timeout: 10000 });
    await expect(tutorial.invite).toContainText("tour");

    await tutorial.inviteAccept.click();

    await expect(tutorial.card).toBeVisible();
    expect(await tutorial.currentStep()).toBe(1);
    await expect(tutorial.invite).toHaveCount(0);
  });

  test("does not ask again once declined, but keeps the launcher", async ({ page }) => {
    const tutorial = new TutorialPage(page);
    await tutorial.resetState();
    await tutorial.goto();

    await expect(tutorial.invite).toBeVisible({ timeout: 10000 });
    await tutorial.inviteDecline.click();
    await expect(tutorial.invite).toHaveCount(0);

    await tutorial.revisit();
    // Well past the invite's entry delay.
    await page.waitForTimeout(2500);
    await expect(tutorial.invite).toHaveCount(0);
    await expect(tutorial.launcher).toBeVisible();

    await tutorial.launcher.click();
    await expect(tutorial.card).toBeVisible();
  });

  test("spotlight lands on the element each step describes", async ({ page }) => {
    const tutorial = new TutorialPage(page);
    await tutorial.gotoWithTourRunning();

    await tutorial.goToStep(2);
    await expect(tutorial.spotlight).toBeVisible();
    const presets = await tutorial.spotlightOffsets('[data-tour="distance-presets"]');
    expect(presets).not.toBeNull();
    for (const edge of Object.values(presets!)) {
      expect(Math.abs(edge)).toBeLessThan(2);
    }

    // Step 2 waits for a real click rather than offering Next.
    await expect(tutorial.card).toContainText("Tap a distance");
    await expect(tutorial.nextButton).toHaveCount(0);
  });

  test("advances when the user clicks the highlighted control, and the app still reacts", async ({
    page,
  }) => {
    const tutorial = new TutorialPage(page);
    const calculator = new CalculatorPage(page);
    await tutorial.gotoWithTourRunning();
    await tutorial.goToStep(2);

    await calculator.presetButton("5K").click();

    // The tour moved on...
    await expect
      .poll(async () => await tutorial.currentStep(), { timeout: 5000 })
      .toBe(3);
    // ...and the calculator's own handler ran, so the click was not swallowed.
    await expect(calculator.distanceInput).toHaveValue("5");
  });

  test("runs end to end and does not offer itself again afterwards", async ({ page }) => {
    const tutorial = new TutorialPage(page);
    const calculator = new CalculatorPage(page);
    await tutorial.resetState();
    await tutorial.gotoWithTourRunning();

    const total = await tutorial.totalSteps();
    expect(total).toBeGreaterThan(1);

    await tutorial.goToStep(2);
    await calculator.presetButton("5K").click();
    await expect.poll(async () => await tutorial.currentStep(), { timeout: 5000 }).toBe(3);

    await tutorial.next(); // -> suggested times
    await page.locator('[data-tour="suggested-times"] button').first().click();
    await expect.poll(async () => await tutorial.currentStep(), { timeout: 8000 }).toBe(5);

    // Picking a suggested time calculates, so the results are on screen.
    await expect(calculator.resultsHeading).toBeVisible();

    while ((await tutorial.currentStep()) < total) {
      await tutorial.next();
    }
    await tutorial.nextButton.click(); // Finish

    await expect(tutorial.overlay).toHaveCount(0);
    await expect(tutorial.launcher).toContainText("Replay tour");

    await tutorial.revisit();
    await page.waitForTimeout(2500);
    await expect(tutorial.invite).toHaveCount(0);
  });

  test("Escape leaves the tour and hands the page back", async ({ page }) => {
    const tutorial = new TutorialPage(page);
    const calculator = new CalculatorPage(page);
    await tutorial.gotoWithTourRunning();
    await tutorial.goToStep(2);

    await page.keyboard.press("Escape");

    await expect(tutorial.overlay).toHaveCount(0);
    // The calculator is fully usable again.
    await calculator.selectPreset("10K");
    await calculator.fillTime("0", "45", "00");
    await calculator.calculateAndWaitForResults();
    await expect(calculator.resultsHeading).toBeVisible();
  });

  test("never blocks the calculator for someone who ignores the invite", async ({ page }) => {
    const tutorial = new TutorialPage(page);
    const calculator = new CalculatorPage(page);
    await tutorial.resetState();
    await calculator.goto();

    await expect(tutorial.invite).toBeVisible({ timeout: 10000 });

    // Invite still on screen; the form underneath must work untouched.
    await calculator.selectPreset("Half Marathon");
    await calculator.fillTime("1", "45", "00");
    await calculator.calculateAndWaitForResults();
    await expect(calculator.resultsHeading).toBeVisible();
  });
});
