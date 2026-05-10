import { test, expect } from "./fixtures/test-fixtures";

test.describe("Authentication page objects", () => {
  /** Verifies the register page renders all required controls for a standard signup flow. */
  test("register happy path renders core form controls", async ({ registerPage }) => {
    // Arrange
    await registerPage.goto();

    // Act
    const submit = registerPage.submitButton;

    // Assert
    await expect(registerPage.heading, "Register heading should be visible for page orientation").toBeVisible();
    await expect(registerPage.nameInput, "Full Name input should be available to start registration").toBeVisible();
    await expect(registerPage.emailInput, "Email input should be available to capture identity").toBeVisible();
    await expect(registerPage.passwordInput, "Password input should be available to secure account setup").toBeVisible();
    await expect(submit, "Register submit button should be visible to complete signup").toBeVisible();
    await expect(submit, "Register submit button should be enabled before validation runs").toBeEnabled();
  });

  /** Confirms client-side schema validation blocks malformed email values. */
  test("register edge case rejects invalid email format", async ({ page, registerPage }) => {
    // Arrange
    await registerPage.goto();
    await registerPage.nameInput.fill("Test Runner");
    await registerPage.emailInput.fill("not-an-email");
    await registerPage.passwordInput.fill("password123");

    // Act
    await registerPage.submitButton.click();

    // Assert
    await expect(page.getByText("Invalid email address"), "Invalid email message should appear for malformed addresses").toBeVisible();
    await expect(page, "User should remain on register page after validation failure").toHaveURL(/\/register/);
  });

  /** Ensures short passwords surface an explicit validation error. */
  test("register error state shows password length message", async ({ page, registerPage }) => {
    // Arrange
    await registerPage.goto();

    // Act
    await registerPage.register("Test Runner", "runner@example.com", "short");

    // Assert
    await expect(page.getByText("Password must be at least 8 characters"), "Short passwords should be rejected with a specific message").toBeVisible();
    await expect(page, "Registration should not navigate away when password rules fail").toHaveURL(/\/register/);
  });

  /** Validates keyboard navigation order and role-based accessibility on the register page. */
  test("register accessibility supports keyboard focus flow", async ({ page, registerPage }) => {
    // Arrange
    await registerPage.goto();

    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Assert
    await expect(page.getByRole("heading", { name: "Create an Account" }), "Register page should expose a semantic heading role").toBeVisible();
    await expect(registerPage.nameInput, "Name input should be focusable via keyboard navigation").toBeFocused();
    await expect(registerPage.submitButton, "Submit button should expose button semantics for assistive technology").toHaveRole("button");
  });

  /** Ensures registration UI remains usable at mobile viewport dimensions. */
  test("register mobile viewport renders usable form", async ({ registerPage, useMobileViewport }) => {
    // Arrange
    await useMobileViewport();

    // Act
    await registerPage.goto();

    // Assert
    await expect(registerPage.heading, "Register heading should remain visible on mobile").toBeVisible();
    await expect(registerPage.submitButton, "Register action should remain visible and clickable on mobile").toBeVisible();
    await expect(registerPage.googleButton, "Google sign-up CTA should still be available on mobile").toBeVisible();
  });

  /** Verifies login page controls and links appear for standard sign-in. */
  test("login happy path renders credentials form", async ({ loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    const submit = loginPage.submitButton;

    // Assert
    await expect(loginPage.heading, "Login heading should be visible for page context").toBeVisible();
    await expect(loginPage.emailInput, "Email input should be present for credential entry").toBeVisible();
    await expect(loginPage.passwordInput, "Password input should be present for credential entry").toBeVisible();
    await expect(submit, "Login submit button should be available to start sign-in").toBeVisible();
    await expect(submit, "Login submit button should be enabled when idle").toBeEnabled();
    await expect(loginPage.forgotPasswordLink, "Forgot password link should be available for recovery").toBeVisible();
    await expect(loginPage.registerLink, "Register link should be available for new users").toBeVisible();
  });

  /** Confirms invalid credentials lead to an in-place error state without navigation. */
  test("login error state keeps user on page and surfaces error", async ({ page, loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login("wrong@example.com", "wrongpassword");

    // Assert
    await expect(loginPage.errorMessage, "An auth error message should be shown after failed login").toBeVisible({ timeout: 10000 });
    await expect(loginPage.errorMessage, "Error should provide actionable login feedback").toContainText(/Invalid email or password|Unable to sign in|Network error|Too many failed attempts/i);
    await expect(page, "Failed login should keep the user on /login").toHaveURL(/\/login/);
  });

  /** Validates native required constraints block empty login submissions. */
  test("login edge case enforces required fields", async ({ page, loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.submitButton.click();

    // Assert
    const emailValidity = await loginPage.emailInput.evaluate((input) => {
      const element = input as HTMLInputElement;
      return {
        valid: element.checkValidity(),
        message: element.validationMessage,
      };
    });
    expect(emailValidity.valid, "Email field should fail native required validation when empty").toBe(false);
    expect(emailValidity.message.length, "Browser should surface a validation message for required email").toBeGreaterThan(0);
    await expect(page, "Empty submit should not navigate away from login page").toHaveURL(/\/login/);
  });

  /** Ensures login UI can be operated fully by keyboard and role-based semantics. */
  test("login accessibility supports keyboard submit flow", async ({ page, loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await page.keyboard.press("Tab");
    await page.keyboard.type("wrong@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("wrongpassword");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Assert
    await expect(page.getByRole("heading", { name: "Welcome back" }), "Login page should expose semantic heading role").toBeVisible();
    await expect(loginPage.submitButton, "Submit button should retain button semantics for keyboard activation").toHaveRole("button");
    await expect(loginPage.errorMessage, "Keyboard submission should trigger the same auth error feedback").toBeVisible({ timeout: 10000 });
  });

  /** Checks the login page remains functional and readable on mobile viewport. */
  test("login mobile viewport keeps controls accessible", async ({ loginPage, useMobileViewport }) => {
    // Arrange
    await useMobileViewport();

    // Act
    await loginPage.goto();

    // Assert
    await expect(loginPage.heading, "Login heading should remain visible on mobile").toBeVisible();
    await expect(loginPage.submitButton, "Login submit should remain visible on mobile").toBeVisible();
    await expect(loginPage.googleButton, "Google sign-in should remain available on mobile").toBeVisible();
  });

  /** Verifies the logout route consistently redirects users to login. */
  test("logout happy path redirects to login", async ({ page }) => {
    // Arrange
    await page.goto("/logout");

    // Act
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Assert
    await expect(page, "Logout should always redirect to /login").toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" }), "Login heading should be visible after logout redirect").toBeVisible();
  });
});
