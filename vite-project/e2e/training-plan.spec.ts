import { test, expect, type Locator, type Page } from "@playwright/test";

/** Generate a guest Half Marathon plan ~6 weeks out (form → plan view). */
async function generateHalfMarathonPlan(page: Page) {
  await page.goto("/plan");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: /Half Marathon/i }).first().click();

  const raceDate = new Date();
  raceDate.setDate(raceDate.getDate() + 42);
  await page.locator('input[type="date"]').fill(raceDate.toISOString().split("T")[0]);

  const generateBtn = page.getByRole("button", { name: /Generate My Plan/i });
  await expect(generateBtn).toBeEnabled();
  await generateBtn.click();
  await expect(page.getByRole("button", { name: /Start over/i })).toBeVisible();
}

/**
 * Drag a workout chip onto a target day cell with raw mouse events —
 * dnd-kit's MouseSensor has a small distance activation constraint, so
 * Playwright's dragTo (single synthetic move) may not trigger it.
 */
async function dragChip(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("drag source/target not visible");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
}

/**
 * Stub both Open-Meteo endpoints so weather tests are deterministic and
 * never depend on external network. The forecast stub honors the request's
 * past_days/forecast_days so dates line up with the plan's real week grid.
 */
async function mockOpenMeteo(page: Page) {
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 1,
            name: "Vancouver",
            latitude: 49.25,
            longitude: -123.12,
            country: "Canada",
            admin1: "British Columbia",
          },
        ],
      },
    })
  );

  await page.route("https://api.open-meteo.com/**", (route) => {
    const url = new URL(route.request().url());
    const pastDays = Number(url.searchParams.get("past_days") ?? 0);
    const forecastDays = Number(url.searchParams.get("forecast_days") ?? 7);
    const total = pastDays + forecastDays;

    const time: string[] = [];
    const start = new Date();
    start.setDate(start.getDate() - pastDays);
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      time.push(`${y}-${m}-${day}`);
    }

    route.fulfill({
      json: {
        daily: {
          time,
          weather_code: time.map((_, i) => (i % 3 === 0 ? 61 : 1)),
          temperature_2m_max: time.map((_, i) => 14 + (i % 5)),
          temperature_2m_min: time.map((_, i) => 6 + (i % 3)),
          precipitation_probability_max: time.map((_, i) =>
            i < pastDays ? null : i % 3 === 0 ? 70 : 10
          ),
          precipitation_sum: time.map((_, i) => (i % 3 === 0 ? 4.2 : 0)),
          wind_speed_10m_max: time.map(() => 12),
        },
      },
    });
  });
}

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

    // Select Half Marathon
    await page.getByRole("button", { name: /Half Marathon/i }).first().click();

    // Race Date is required and must be at least 4 weeks out, otherwise the
    // Generate button stays disabled. Pick a date ~6 weeks from today.
    const raceDate = new Date();
    raceDate.setDate(raceDate.getDate() + 42);
    await page
      .locator('input[type="date"]')
      .fill(raceDate.toISOString().split("T")[0]);

    // Generate the plan (button is disabled until a valid race date is set)
    const generateBtn = page.getByRole("button", { name: /Generate My Plan/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // The form is replaced by the generated plan view
    await expect(
      page.getByRole("button", { name: /Start over/i })
    ).toBeVisible();
  });

  test("should drag a workout to an empty day and persist the move", async ({ page }) => {
    // Generate + drag + a second full navigation — needs more than the
    // default 30s against the dev server's slow first loads.
    test.setTimeout(90_000);
    await generateHalfMarathonPlan(page);

    // Default training days are Tue/Thu/Sat/Sun, so Wed is an empty cell.
    const week1 = page.locator('[data-week="1"]');
    const source = week1.locator('[data-day="Tue"] [data-chip]');
    const target = week1.locator('[data-day="Wed"]');
    await expect(source).toBeVisible();
    const movedLabel = (await source.innerText()).split("\n")[0];

    await dragChip(page, source, target);

    // The workout now renders under Wed and Tue is empty.
    await expect(week1.locator('[data-day="Wed"] [data-chip]')).toContainText(movedLabel);
    await expect(week1.locator('[data-day="Tue"] [data-chip]')).toHaveCount(0);

    // The move survives a fresh navigation via the localStorage draft.
    // (goto instead of reload — reload's "load" event is flaky against the
    // dev server; the assertions below auto-wait for the hydrated grid.)
    await page.goto("/plan", { waitUntil: "domcontentloaded" });
    await expect(week1.locator('[data-day="Wed"] [data-chip]')).toContainText(movedLabel);
    await expect(week1.locator('[data-day="Tue"] [data-chip]')).toHaveCount(0);
  });

  test("should swap workouts when dropped on an occupied day", async ({ page }) => {
    await generateHalfMarathonPlan(page);

    const week1 = page.locator('[data-week="1"]');
    const thuChip = week1.locator('[data-day="Thu"] [data-chip]');
    const satChip = week1.locator('[data-day="Sat"] [data-chip]');
    await expect(thuChip).toBeVisible();
    await expect(satChip).toBeVisible();
    const thuLabel = (await thuChip.innerText()).split("\n")[0];
    const satLabel = (await satChip.innerText()).split("\n")[0];

    await dragChip(page, thuChip, week1.locator('[data-day="Sat"]'));

    await expect(week1.locator('[data-day="Sat"] [data-chip]')).toContainText(thuLabel);
    await expect(week1.locator('[data-day="Thu"] [data-chip]')).toContainText(satLabel);
  });

  test("should show training weather after setting a city", async ({ page }) => {
    test.setTimeout(60_000);
    await mockOpenMeteo(page);
    await generateHalfMarathonPlan(page);

    // Weather card renders in the This Week rail with a location prompt.
    await expect(page.getByRole("heading", { name: "Training Weather" })).toBeVisible();

    await page.getByLabel("Search a city for weather").fill("Vancouver");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("button", { name: /Vancouver · British Columbia/ }).click();

    // Forecast loads: best run window callout + the Mon–Sun strip.
    await expect(page.getByText(/Best run window:/)).toBeVisible();
    await expect(page.getByText("Mon", { exact: true }).first()).toBeVisible();

    // Location persists — a fresh load fetches weather straight away, no prompt.
    await page.goto("/plan", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Best run window:/).first()).toBeVisible();
    await expect(page.getByText(/Vancouver · change/)).toBeVisible();
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
