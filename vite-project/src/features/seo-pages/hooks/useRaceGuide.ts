import { useEffect, useState } from "react";

import { loadRaceGuide, type RaceGuide } from "../raceGuides";

/**
 * The researched guide for a race page, loaded on demand (one small chunk per
 * race). Undefined while loading, when disabled, or when the race has none.
 */
export function useRaceGuide(slug: string | undefined, enabled: boolean) {
  const [guide, setGuide] = useState<RaceGuide | undefined>(undefined);

  useEffect(() => {
    setGuide(undefined);
    if (!slug || !enabled) return;
    let cancelled = false;
    loadRaceGuide(slug)
      .then((g) => {
        if (!cancelled) setGuide(g);
      })
      .catch(() => {
        // A missing guide only means the page shows less; never break it.
      });
    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  return guide;
}
