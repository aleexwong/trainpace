import { type Page, type Locator } from "@playwright/test";

export class NavigationHelper {
  readonly page: Page;
  readonly desktopNav: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.desktopNav = page.getByTestId("desktop-nav");
    this.logo = page.getByRole("link", { name: "TrainPace" });
  }

  navLink(label: string) {
    return this.desktopNav.getByRole("link", { name: label });
  }

  async goToCalculator() {
    await this.navLink("Calculator").click();
    await this.page.waitForURL(/\/calculator/);
  }

  async goToFuelPlanner() {
    await this.navLink("Fuel Planner").click();
    await this.page.waitForURL(/\/fuel/);
  }

  async goToLogin() {
    await this.navLink("Login").click();
    await this.page.waitForURL(/\/login/);
  }

  async goHome() {
    await this.logo.click();
  }
}
