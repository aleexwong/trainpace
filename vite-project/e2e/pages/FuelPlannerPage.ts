import { type Page, type Locator } from "@playwright/test";

export class FuelPlannerPage {
  readonly page: Page;
  readonly formCard: Locator;
  readonly resultsCard: Locator;
  readonly calculateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.formCard = page.getByTestId("fuel-form").first();
    this.resultsCard = page.getByTestId("fuel-results").first();
    this.calculateButton = page.getByTestId("fuel-calculate").first();
  }

  async goto() {
    await this.page.goto("/fuel");
  }

  raceTypeButton(type: "10k" | "half" | "full") {
    return this.page.getByTestId(`fuel-race-${type}`).first();
  }

  async selectRaceType(type: "10k" | "half" | "full") {
    await this.raceTypeButton(type).click();
  }

  async fillFinishTimeMinutes(minutes: string) {
    await this.page.getByPlaceholder("Minutes (e.g. 45)").first().fill(minutes);
  }

  async fillFinishTimeHoursMinutes(hours: string, minutes: string) {
    await this.page.getByPlaceholder("HH").first().fill(hours);
    await this.page.getByPlaceholder("MM").first().fill(minutes);
  }

  async calculate() {
    await this.calculateButton.click();
  }
}
