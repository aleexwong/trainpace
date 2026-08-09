import { test, expect } from "@playwright/test";

/**
 * The globe itself needs a Mapbox token and WebGL, neither of which CI has, so
 * these specs cover the parts that must work regardless: the course list, GPX
 * loading, the detail panel, and shareable ?race= links.
 */
test.describe("World Majors globe", () => {
  test("lists every mapped course grouped by region", async ({ page }) => {
    await page.goto("/majors");

    await expect(
      page.getByRole("heading", { name: /World Marathon Majors, on a globe/i })
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "Americas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Europe" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Asia-Pacific" })
    ).toBeVisible();

    await expect(page.locator("[data-race-option]")).toHaveCount(15);
  });

  test("filters the list down to the Abbott majors", async ({ page }) => {
    await page.goto("/majors");

    await page.getByRole("button", { name: "Majors only" }).click();

    await expect(page.locator("[data-race-option]")).toHaveCount(7);
    await expect(page.locator('[data-race-option="boston"]')).toBeVisible();
    await expect(page.locator('[data-race-option="big-sur"]')).toHaveCount(0);
  });

  test("searching narrows the list to a city", async ({ page }) => {
    await page.goto("/majors");

    await page
      .getByLabel("Search courses by city or race name")
      .fill("tokyo");

    await expect(page.locator("[data-race-option]")).toHaveCount(1);
    await expect(page.locator('[data-race-option="tokyo"]')).toBeVisible();
  });

  test("selecting a race loads its GPX and shows the course detail", async ({
    page,
  }) => {
    await page.goto("/majors");

    const gpxResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/gpx/majors/berlin.gpx") && response.ok()
    );

    await page.locator('[data-race-option="berlin"]').click();
    await gpxResponse;

    const detail = page.getByTestId("race-detail");
    await expect(detail).toBeVisible();
    // textContent, not innerText: headings here are not transformed, but the
    // assertion should not depend on CSS either way.
    await expect(detail).toContainText("Berlin Marathon");
    await expect(detail).toContainText("42.2 km");

    // Point count only renders once the GPX has actually parsed.
    await expect(detail).toContainText(/\d+\s*points/);

    await expect(page).toHaveURL(/\?race=berlin/);
  });

  test("a shared ?race= link opens on that course", async ({ page }) => {
    await page.goto("/majors?race=nyc");

    const detail = page.getByTestId("race-detail");
    await expect(detail).toContainText("New York City Marathon");
    await expect(
      detail.getByRole("link", { name: /Course profile/i })
    ).toHaveAttribute("href", "/preview-route/nyc");
  });

  test("serves a downloadable GPX for each course", async ({ request }) => {
    const response = await request.get("/gpx/majors/boston.gpx");

    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("<trkpt");
    expect(body).toContain("Boston Marathon");
  });
});
