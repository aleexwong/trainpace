/**
 * The app's error sink.
 *
 * `vite.config.ts` sets `esbuild.drop: ["console", "debugger"]` for production
 * builds, so a `catch` block whose only action is `console.error(...)` compiles
 * down to an EMPTY BLOCK in the deployed bundle: the failure is invisible to the
 * user, to the logs, and to us. PostHog was already installed and wrapping the
 * app in an error boundary, but nothing outside a render crash ever reached it.
 *
 * Use this instead of a bare `console.error` in any catch block that swallows a
 * failure. It survives the production build.
 *
 * ```ts
 * try {
 *   await saveThing();
 * } catch (err) {
 *   reportError(err, { scope: "dashboard.saveThing", thingId });
 *   toast({ title: "Couldn't save", variant: "destructive" });
 * }
 * ```
 *
 * Rules of thumb:
 *   - Always pass a `scope` — it is what makes the event findable in PostHog.
 *   - Context values must be non-sensitive: ids, counts, enum-ish strings. Never
 *     GPX contents, tokens, or email addresses.
 *   - Reporting is not user feedback. If the user is blocked, still show a toast.
 */

import posthog from "posthog-js";

export interface ErrorContext {
  /** Dot-path identifying the call site, e.g. "elevation.cacheLookup". Required. */
  scope: string;
  [key: string]: unknown;
}

/** Coerce arbitrary throwables into an Error so stack traces survive. */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  if (typeof thrown === "string") return new Error(thrown);
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
}

/**
 * Report a caught error to PostHog, and log it in development.
 *
 * Never throws: a failure in the reporter must not mask the original failure.
 */
export function reportError(thrown: unknown, context: ErrorContext): void {
  const error = toError(thrown);

  // Stripped from production builds; this is the dev-time convenience path.
  if (import.meta.env.DEV) {
    console.error(`[${context.scope}]`, error, context);
  }

  try {
    posthog.captureException(error, {
      ...context,
      // `scope` is spread above; naming it explicitly keeps it a first-class
      // property for PostHog filtering even if a caller passes odd keys.
      scope: context.scope,
    });
  } catch {
    // PostHog not initialised (tests, prerender) or blocked by an ad blocker.
    // Swallow — the original error has already been handled by the caller.
  }
}
