import { useCallback, useMemo, useState } from "react";
import ReactGA from "react-ga4";
import {
  analyzeRace,
  buildTakeaways,
  matchOfficialDistance,
  parseTimedGpx,
} from "../debrief-math";
import { simulateSampleRace } from "../sample-race";
import type { DebriefResult, SplitUnit, TimedPoint } from "../types";

const MAX_FILE_MB = 15;

/** "gps" means: use the watch distance instead of a standard race distance. */
export type DistanceChoice = number | "gps";

export interface RaceDebriefState {
  fileName: string | null;
  isSample: boolean;
  error: string | null;
  unit: SplitUnit;
  setUnit: (unit: SplitUnit) => void;
  result: DebriefResult | null;
  takeaways: string[];
  /** Official distance in metres, or "gps". */
  distance: DistanceChoice;
  setDistance: (d: DistanceChoice) => void;
  /** The distance the result counts for, in metres. */
  resultMeters: number | null;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => void;
  reset: () => void;
}

export function useRaceDebrief(): RaceDebriefState {
  const [points, setPoints] = useState<TimedPoint[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<SplitUnit>("km");
  const [distance, setDistance] = useState<DistanceChoice>("gps");

  // Analysis is cheap (a few ms for a marathon) so it simply re-runs when the
  // unit changes. A recording too short to analyse surfaces as an error.
  const analysis = useMemo((): { result: DebriefResult | null; error: string | null } => {
    if (!points) return { result: null, error: null };
    try {
      return { result: analyzeRace(points, unit), error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Could not analyse this file." };
    }
  }, [points, unit]);

  const result = analysis.result;
  const takeaways = useMemo(
    () => (result ? buildTakeaways(result, unit) : []),
    [result, unit]
  );

  const accept = useCallback((next: TimedPoint[], name: string, sample: boolean) => {
    // Pick the matching race distance once per file; the runner can change it.
    let gpsKm = 0;
    try {
      gpsKm = analyzeRace(next, "km").gpsDistanceKm;
    } catch {
      // Too short — the memo above reports it.
    }
    setDistance(matchOfficialDistance(gpsKm)?.meters ?? "gps");
    setPoints(next);
    setFileName(name);
    setIsSample(sample);
    setError(null);
    ReactGA.event({
      category: "Race Debrief",
      action: sample ? "Loaded Sample" : "Analyzed File",
      label: matchOfficialDistance(gpsKm)?.name ?? "Other",
    });
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`That file is larger than ${MAX_FILE_MB} MB. Export a single activity as GPX.`);
        return;
      }
      try {
        accept(parseTimedGpx(await file.text()), file.name, false);
      } catch (e) {
        setPoints(null);
        setError(e instanceof Error ? e.message : "Could not read this file.");
      }
    },
    [accept]
  );

  const loadSample = useCallback(() => {
    accept(simulateSampleRace(), "Simulated sample marathon", true);
  }, [accept]);

  const reset = useCallback(() => {
    setPoints(null);
    setFileName(null);
    setIsSample(false);
    setError(null);
  }, []);

  const resultMeters = result
    ? distance === "gps"
      ? result.gpsDistanceKm * 1000
      : distance
    : null;

  return {
    fileName,
    isSample,
    error: error ?? analysis.error,
    unit,
    setUnit,
    result,
    takeaways,
    distance,
    setDistance,
    resultMeters,
    loadFile,
    loadSample,
    reset,
  };
}
