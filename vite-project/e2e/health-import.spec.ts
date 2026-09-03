import { test, expect, type Page } from "@playwright/test";
import { EXPECTED, buildZip, syntheticExportZip } from "./fixtures/appleHealthExport";

async function importFixture(page: Page, buffer: Buffer, name = "export.zip") {
  await page.setInputFiles("#health-export-file", {
    name,
    mimeType: "application/zip",
    buffer,
  });
}

test.describe("Apple Health import", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/import");
  });

  test("explains how to get the file and never uploads it", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Get the file off your iPhone" })
    ).toBeVisible();
    await expect(page.getByText("The file stays on your phone")).toBeVisible();
    await expect(page.getByLabel("Choose file")).toBeVisible();
  });

  test("turns an export into volume, efforts and a VDOT", async ({ page }) => {
    await importFixture(page, syntheticExportZip());

    await expect(page.getByRole("heading", { name: "Your last 90 days" })).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByTestId("summary-tile-runs")).toContainText(
      String(EXPECTED.runsInWindow)
    );
    await expect(page.getByTestId("summary-tile-distance")).toContainText(
      EXPECTED.totalDistanceKm
    );
    await expect(page.getByTestId("summary-tile-week")).toContainText(
      EXPECTED.averageWeekKm
    );
    await expect(page.getByTestId("summary-tile-vdot")).toContainText(EXPECTED.vdot);

    // The indoor run counts toward volume but is excluded from best efforts,
    // so only the 5K and the half show up here.
    const rows = page.getByTestId("summary-best-efforts").locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText(EXPECTED.fiveKTime);
    await expect(rows.nth(1)).toContainText(EXPECTED.halfTime);

    // Each effort hands off to the calculators with real query params.
    await expect(page.locator(`a[href="${EXPECTED.fiveKLink}"]`)).toBeVisible();
    await expect(page.locator(`a[href="${EXPECTED.halfVdotLink}"]`)).toBeVisible();
  });

  test("switches the whole summary between km and miles", async ({ page }) => {
    await importFixture(page, syntheticExportZip());
    const distanceTile = page.getByTestId("summary-tile-distance");
    await expect(distanceTile).toContainText(EXPECTED.totalDistanceKm, {
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "mi", exact: true }).click();

    await expect(distanceTile).toContainText(EXPECTED.totalDistanceMiles);
    await expect(distanceTile).not.toContainText(EXPECTED.totalDistanceKm);
    await expect(page.getByTestId("summary-best-efforts")).toContainText("/mi");
  });

  test("builds a Claude-sized summary from a huge export", async ({ page }) => {
    await importFixture(page, syntheticExportZip());
    await expect(page.getByRole("heading", { name: "Hand it to Claude" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("group", { name: "Distance unit" }).waitFor();
    await page.locator("summary").click();

    const preview = page.locator("pre");
    await expect(preview).toContainText("# My running data (from Apple Health)");
    await expect(preview).toContainText("Half marathon");
    await expect(preview).toContainText("api.trainpace.com/api/mcp");

    // The whole point is that it fits in a chat: a page, not a database dump.
    const length = (await preview.textContent())?.length ?? 0;
    expect(length).toBeGreaterThan(500);
    expect(length).toBeLessThan(20_000);
  });

  test("lists the GPX tracks the watch recorded", async ({ page }) => {
    await importFixture(page, syntheticExportZip());
    await expect(
      page.getByRole("heading", { name: "Your recorded routes" })
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole("button", { name: "Save GPX" })).toHaveCount(
      EXPECTED.routeCount
    );
  });

  test("explains itself when the zip is not a Health export", async ({ page }) => {
    await importFixture(
      page,
      buildZip([{ name: "notes.txt", content: "not a health export" }]),
      "photos.zip"
    );

    await expect(page.getByRole("alert")).toContainText("export.xml");
    await expect(page.getByLabel("Choose file")).toBeVisible();
  });
});
