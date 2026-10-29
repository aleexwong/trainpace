// Pure theme helpers, shared by ThemeProvider and mirrored by the inline
// script in index.html (which runs before React, so it can't import this).
// If you change THEME_STORAGE_KEY or THEMED_ROUTES, change index.html too.

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "tp-theme";

/**
 * Pages whose content has been converted to work in both themes. Only these
 * get `dark` on <html>; every other page stays light until its phase lands.
 * SiteNav and Footer follow the theme everywhere through their own wrapper.
 */
export const THEMED_ROUTES: readonly string[] = ["/"];

export const isThemedRoute = (pathname: string) =>
  THEMED_ROUTES.includes(pathname);

const DARK_QUERY = "(prefers-color-scheme: dark)";

export const darkQuery = (): MediaQueryList | null =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(DARK_QUERY)
    : null;

export function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // Storage blocked (private mode, sandboxed iframe): fall back to system.
  }
  return "system";
}

export function storePreference(pref: ThemePreference) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Not remembered, but the choice still applies for this page view.
  }
}
