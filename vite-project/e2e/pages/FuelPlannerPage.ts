import { type Page, type Locator } from "@playwright/test";

export class FuelPlannerPage {
  readonly page: Page;
  readonly formCard: Locator;
  readonly resultsCard: Locator;
  readonly calculateButton: Locator;
  readonly resultsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use :visible pseudo-class to avoid matching the hidden desktop/mobile duplicate
    this.formCard = page.getByTestId("fuel-form").locator("visible=true").first();
    this.resultsCard = page.getByTestId("fuel-results").locator("visible=true").first();
    this.calculateButton = page.getByTestId("fuel-calculate").locator("visible=true").first();
    this.resultsHeading = page.getByRole("heading", {
      name: /Your Fuel Plan/i,
    });
  }

  async goto() {
    await this.page.goto("/fuel");
    await this.page.waitForLoadState("networkidle");
  }

  raceTypeButton(type: "10k" | "half" | "full") {
    return this.page.getByTestId(`fuel-race-${type}`).locator("visible=true").first();
  }

  async selectRaceType(type: "10k" | "half" | "full") {
    await this.raceTypeButton(type).click();
  }

  async fillFinishTimeMinutes(minutes: string) {
    await this.page
      .getByTestId("fuel-time-minutes")
      .locator("visible=true")
      .first()
      .fill(minutes);
  }

  async fillFinishTimeHoursMinutes(hours: string, minutes: string) {
    await this.page
      .getByTestId("fuel-time-hours")
      .locator("visible=true")
      .first()
      .fill(hours);
    await this.page
      .getByTestId("fuel-time-minutes")
      .locator("visible=true")
      .first()
      .fill(minutes);
  }

  async calculate() {
    await this.calculateButton.click();
  }

  async calculateAndWaitForResults() {
    await this.calculateButton.click();
    await this.resultsCard.waitFor({ state: "visible", timeout: 10000 });
  }
}
