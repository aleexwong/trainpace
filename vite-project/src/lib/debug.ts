/**
 * Development-only trace logging.
 *
 * The codebase had ~75 bare `console.log` calls used as diagnostics — cache
 * hits, geocoding fallbacks, map lifecycle. They were useful, but they tripped
 * the `no-console` lint rule on every build and gave no signal about intent:
 * nothing distinguished "temporary trace" from "something the user should know".
 *
 * `debug()` states the intent. It is a no-op in production twice over: the
 * `import.meta.env.DEV` guard is statically false, and `esbuild.drop` removes
 * the console call underneath it.
 *
 * This is NOT for failures. A caught error goes to `reportError` (lib/reportError.ts),
 * which survives the production build; `debug` deliberately does not.
 */

/** Log a development-only trace. Formats like `console.log`. */
export function debug(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

/**
 * Log a development-only warning — a recoverable oddity worth seeing while
 * working, but not an error and not worth an event in production.
 */
export function debugWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}
