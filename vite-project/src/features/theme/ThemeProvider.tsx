import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import {
  THEME_STORAGE_KEY,
  darkQuery,
  isThemedRoute,
  readStoredPreference,
  storePreference,
  type ThemePreference,
} from "./theme";

// Must sit inside <BrowserRouter>: whether <html> gets `dark` depends on the
// route (see LIGHT_ONLY_ROUTES). index.html sets the same class before React
// loads; this keeps it in sync after that.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState(
    () => darkQuery()?.matches ?? false,
  );

  // Follow the OS setting live. Only read while preference is "system".
  useEffect(() => {
    const mq = darkQuery();
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keep other open tabs in step with a change made here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY || e.key === null) {
        setPreferenceState(readStoredPreference());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resolved =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  // Layout effect: on navigation between a themed and an unthemed page, the
  // class must change before the browser paints the new route.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      resolved === "dark" && isThemedRoute(pathname),
    );
  }, [resolved, pathname]);

  const setPreference = useCallback((pref: ThemePreference) => {
    storePreference(pref);
    setPreferenceState(pref);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
