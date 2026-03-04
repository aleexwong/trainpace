import { type Page, type Locator } from "@playwright/test";

export class CalculatorPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly distanceInput: Locator;
  readonly hoursInput: Locator;
  readonly minutesInput: Locator;
  readonly secondsInput: Locator;
  readonly calculateButton: Locator;
  readonly resultsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Race Details" });
    this.distanceInput = page.getByTestId("pace-distance");
    this.hoursInput = page.getByTestId("pace-hours");
    this.minutesInput = page.getByTestId("pace-minutes");
    this.secondsInput = page.getByTestId("pace-seconds");
    this.calculateButton = page.getByTestId("pace-calculate");
    this.resultsHeading = page.getByRole("heading", {
      name: /Training Paces/i,
    });
  }

  async goto() {
    await this.page.goto("/calculator");
    await this.page.waitForLoadState("networkidle");
  }

  presetButton(name: string) {
    return this.page.getByTestId(
      `preset-${name.toLowerCase().replace(/\s+/g, "-")}`
    );
  }

  async selectPreset(name: string) {
    await this.presetButton(name).click();
  }

  async fillTime(hours: string, minutes: string, seconds: string) {
    await this.hoursInput.fill(hours);
    await this.minutesInput.fill(minutes);
    await this.secondsInput.fill(seconds);
  }

  async calculate() {
    await this.calculateButton.click();
  }

  async calculateAndWaitForResults() {
    await this.calculateButton.click();
    await this.resultsHeading.waitFor({ state: "visible", timeout: 10000 });
  }
}
