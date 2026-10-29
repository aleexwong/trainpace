import { createContext } from "react";
import type { ResolvedTheme, ThemePreference } from "./theme";

export interface ThemeContextValue {
  /** What the visitor picked. "system" follows the operating system. */
  preference: ThemePreference;
  /** The theme in effect after resolving "system". */
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
