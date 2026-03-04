import { type Page, type Locator } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel("Full Name");
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByTestId("register-submit");
    this.googleButton = page.getByRole("button", {
      name: "Continue with Google",
    });
    this.heading = page.getByRole("heading", { name: "Create an Account" });
  }

  async goto() {
    await this.page.goto("/register");
    await this.page.waitForLoadState("networkidle");
  }

  async register(name: string, email: string, password: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
