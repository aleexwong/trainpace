/**
 * Tutorial Feature - Viewport size hook
 *
 * Below this width the coach card stops floating next to the spotlight and
 * becomes a bottom sheet — there simply isn't room to sit a 360px card beside
 * a full-width form without covering the thing it's pointing at.
 */

import { useEffect, useState } from "react";

const COMPACT_QUERY = "(max-width: 767px)";

export function useIsCompact(): boolean {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(COMPACT_QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(COMPACT_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mql.addEventListener("change", onChange);
    setIsCompact(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isCompact;
}
