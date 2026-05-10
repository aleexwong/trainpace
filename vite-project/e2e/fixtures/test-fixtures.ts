import { test as base, expect } from "@playwright/test";
import { CalculatorPage } from "../pages/CalculatorPage";
import { FuelPlannerPage } from "../pages/FuelPlannerPage";
import { LoginPage } from "../pages/LoginPage";
import { NavigationHelper } from "../pages/NavigationHelper";
import { RegisterPage } from "../pages/RegisterPage";

type PageFixtures = {
  calculatorPage: CalculatorPage;
  fuelPlannerPage: FuelPlannerPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  navigationHelper: NavigationHelper;
  useMobileViewport: () => Promise<void>;
};

const MOBILE_VIEWPORT = { width: 390, height: 844 };

export const test = base.extend<PageFixtures>({
  calculatorPage: async ({ page }, use) => {
    await use(new CalculatorPage(page));
  },
  fuelPlannerPage: async ({ page }, use) => {
    await use(new FuelPlannerPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  navigationHelper: async ({ page }, use) => {
    await use(new NavigationHelper(page));
  },
  useMobileViewport: async ({ page }, use) => {
    await use(async () => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });
  },
});

export { expect };
