import { type Page, type Locator } from "@playwright/test";

export class NavigationHelper {
  readonly page: Page;
  readonly desktopNav: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.desktopNav = page.getByTestId("desktop-nav");
    this.logo = page.getByRole("link", { name: "TrainPace" }).first();
  }

  navLink(label: string) {
    return this.desktopNav.getByRole("link", { name: label });
  }

  /** Tools live in grouped menus (Train / Race / Learn); open the group first. */
  async openGroup(group: string) {
    await this.desktopNav.getByRole("button", { name: group }).click();
  }

  async goToCalculator() {
    await this.openGroup("Train");
    await this.page.getByRole("link", { name: /Pace calculator/ }).first().click();
    await this.page.waitForURL(/\/calculator/);
  }

  async goToFuelPlanner() {
    await this.openGroup("Race");
    await this.page.getByRole("link", { name: /Fuel planner/ }).first().click();
    await this.page.waitForURL(/\/fuel/);
  }

  async goToLogin() {
    await this.navLink("Log in").click();
    await this.page.waitForURL(/\/login/);
  }

  async goHome() {
    await this.logo.click();
  }
}
