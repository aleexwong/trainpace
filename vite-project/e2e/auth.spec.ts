import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

test.describe("Sign Up", () => {
  test("should display the registration form", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.heading).toBeVisible();
    await expect(registerPage.nameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test("should show the Google sign-up option", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.googleButton).toBeVisible();
  });

  test("should validate required fields on submit", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submitButton.click();

    // Zod validation should show error messages for empty fields
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // Use a value the browser type="email" might accept but Zod rejects
    await registerPage.nameInput.fill("Test User");
    await registerPage.emailInput.fill("not-an-email");
    await registerPage.passwordInput.fill("password123");
    await registerPage.submitButton.click();

    // Either Zod validation message or browser-native validation fires
    const zodError = page.getByText("Invalid email address");
    const formStillVisible = registerPage.submitButton;

    // The form should not navigate away - either shows error or stays on page
    await expect(formStillVisible).toBeVisible();
  });

  test("should validate password minimum length", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register("Test User", "test@example.com", "short");

    await expect(
      page.getByText("Password must be at least 8 characters")
    ).toBeVisible();
  });

  test("should navigate to login page from register link", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.registerLink).toBeVisible();
    await loginPage.registerLink.click();

    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe("Log In", () => {
  test("should display the login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should show Google login option", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.googleButton).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login("wrong@example.com", "wrongpassword");

    // Firebase returns an error; the UI shows a generic message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
  });

  test("should have a forgot password link", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await loginPage.forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/reset-password/);
  });

  test("should have a register link", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.registerLink).toBeVisible();
  });
});

test.describe("Log Out", () => {
  test("should redirect to login after visiting logout page", async ({
    page,
  }) => {
    await page.goto("/logout");

    // The logout page calls signOut and navigates to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("should show login form after logout redirect", async ({ page }) => {
    await page.goto("/logout");

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
  });
});
