import { type Page, type Locator } from "@playwright/test";

/**
 * Page object for the guided tutorial that overlays the pace calculator.
 *
 * The tour remembers its state in localStorage, so every test that expects the
 * invite must call `resetState()` before navigating — otherwise the second test
 * in a file sees a device that has already been asked.
 */
export class TutorialPage {
  readonly page: Page;
  readonly invite: Locator;
  readonly inviteAccept: Locator;
  readonly inviteDecline: Locator;
  readonly launcher: Locator;
  readonly overlay: Locator;
  readonly spotlight: Locator;
  readonly card: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.invite = page.getByTestId("tutorial-invite");
    this.inviteAccept = page.getByTestId("tutorial-invite-accept");
    this.inviteDecline = page.getByTestId("tutorial-invite-decline");
    this.launcher = page.getByTestId("tutorial-launcher");
    this.overlay = page.getByTestId("tutorial-overlay");
    this.spotlight = page.getByTestId("tutorial-spotlight");
    this.card = page.getByRole("dialog", { name: /Tutorial step/ });
    this.nextButton = page.getByTestId("tutorial-next");
  }

  /**
   * Presents this browser as a device that has never been offered the tour.
   *
   * Runs before the page's own scripts on the next navigation, so it costs no
   * extra page load — but it self-disables after firing once, because tests
   * that decline the invite then reload must still see the decline stick.
   */
  async resetState() {
    await this.page.addInitScript(() => {
      try {
        if (!window.sessionStorage.getItem("__tutorialResetDone")) {
          window.sessionStorage.setItem("__tutorialResetDone", "1");
          window.localStorage.removeItem("trainpace.tutorial.v1");
        }
      } catch {
        // Storage unavailable — nothing to reset.
      }
    });
  }

  async goto() {
    await this.page.goto("/calculator", { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Revisits the page. Uses reload() rather than a second goto() to the same
   * URL, which can hang waiting for "load" against the dev server.
   */
  async revisit() {
    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle");
  }

  /** Skips the invite entirely and starts the tour from the URL. */
  async gotoWithTourRunning() {
    await this.page.goto("/calculator?tour=1", { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("networkidle");
    await this.card.waitFor({ state: "visible" });
  }

  /** 1-based step number parsed from the card's accessible name. */
  async currentStep(): Promise<number> {
    const label = (await this.card.getAttribute("aria-label")) ?? "";
    return Number(label.match(/step (\d+) of/i)?.[1] ?? 0);
  }

  async totalSteps(): Promise<number> {
    const label = (await this.card.getAttribute("aria-label")) ?? "";
    return Number(label.match(/of (\d+)/i)?.[1] ?? 0);
  }

  /** Advances past a step and waits for the card to actually change. */
  async next() {
    const before = await this.currentStep();
    await this.nextButton.click();
    await this.page.waitForFunction(
      (prev) => {
        const el = document.querySelector('[role="dialog"][aria-label^="Tutorial step"]');
        const n = Number(el?.getAttribute("aria-label")?.match(/step (\d+) of/i)?.[1] ?? 0);
        return n > prev;
      },
      before,
      { timeout: 5000 }
    );
  }

  /** Advances to the step whose target the caller is about to click. */
  async goToStep(target: number) {
    while ((await this.currentStep()) < target) {
      await this.next();
    }
  }

  /** Offset between the spotlight cutout and an element, per edge. */
  async spotlightOffsets(selector: string, pad = 8) {
    return await this.page.evaluate(
      ({ selector, pad }) => {
        const t = document.querySelector(selector);
        const s = document.querySelector('[data-testid="tutorial-spotlight"]');
        if (!t || !s) return null;
        const tr = t.getBoundingClientRect();
        const sr = s.getBoundingClientRect();
        return {
          left: sr.left - (tr.left - pad),
          top: sr.top - (tr.top - pad),
          right: sr.right - (tr.right + pad),
          bottom: sr.bottom - (tr.bottom + pad),
        };
      },
      { selector, pad }
    );
  }
}
