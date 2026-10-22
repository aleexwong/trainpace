import { useCallback, useMemo, useRef, useState } from "react";
import ReactGA from "react-ga4";
import { useAuth } from "@/features/auth/AuthContext";
import { calculateVdot } from "@/features/vdot-calculator/vdot-math";
import { buildAiContext, requestAiRewrite, type AiRewrite } from "../ai";
import {
  analyzeRace,
  buildEvenEffortPlan,
  buildVerdict,
  matchOfficialDistance,
  parseTimedGpx,
  raceDistanceName,
} from "../debrief-math";
import { simulateSampleRace } from "../sample-race";
import type { DebriefResult, PlanLeg, SplitUnit, TimedPoint } from "../types";

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
  verdict: string;
  /** Pacing plan to run the same time with even effort. */
  plan: PlanLeg[];
  /** Official distance in metres, or "gps". */
  distance: DistanceChoice;
  setDistance: (d: DistanceChoice) => void;
  /** The distance the result counts for, in metres. */
  resultMeters: number | null;
  /** VDOT shown by the result, or null when outside a sensible range. */
  vdot: number | null;
  /** The runner's note about the day, for the optional AI rewrite. */
  note: string;
  setNote: (note: string) => void;
  aiStatus: "idle" | "loading" | "error";
  aiError: string | null;
  /** The AI rewrite, only while it matches the current unit and distance. */
  aiRewrite: AiRewrite | null;
  askCoach: () => Promise<void>;
  clearAiRewrite: () => void;
  loadFile: (file: File) => Promise<void>;
  loadSample: () => void;
  reset: () => void;
}

interface AiState {
  status: "idle" | "loading" | "error";
  error: string | null;
  rewrite: AiRewrite | null;
  /** The unit and distance the rewrite's numbers were written in. */
  madeFor: string | null;
}

const AI_IDLE: AiState = { status: "idle", error: null, rewrite: null, madeFor: null };

export function useRaceDebrief(): RaceDebriefState {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [ai, setAi] = useState<AiState>(AI_IDLE);
  // Ignore answers to requests made before the file, unit or distance changed.
  const requestId = useRef(0);
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
  const verdict = useMemo(() => (result ? buildVerdict(result, unit) : ""), [result, unit]);

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
    setNote("");
    setAi(AI_IDLE);
    requestId.current++;
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
    accept(simulateSampleRace(), "Sample marathon", true);
  }, [accept]);

  const reset = useCallback(() => {
    setPoints(null);
    setFileName(null);
    setIsSample(false);
    setError(null);
    setNote("");
    setAi(AI_IDLE);
    requestId.current++;
  }, []);

  const resultMeters = result
    ? distance === "gps"
      ? result.gpsDistanceKm * 1000
      : distance
    : null;
  const plan = useMemo(
    () =>
      result && resultMeters !== null
        ? buildEvenEffortPlan(resultMeters, result.elapsedSec)
        : [],
    [result, resultMeters]
  );

  const vdot = useMemo(() => {
    if (!result || resultMeters === null) return null;
    const v = calculateVdot(resultMeters, result.elapsedSec);
    return isFinite(v) && v > 20 && v < 90 ? v : null;
  }, [result, resultMeters]);

  const madeFor = `${unit}:${distance}`;
  const aiRewrite = ai.rewrite && ai.madeFor === madeFor ? ai.rewrite : null;

  const askCoach = useCallback(async () => {
    if (!result || resultMeters === null) return;
    const id = ++requestId.current;
    setAi((prev) => ({ ...prev, status: "loading", error: null }));
    const token = user ? await user.getIdToken().catch(() => undefined) : undefined;
    const context = buildAiContext(result, unit, raceDistanceName(resultMeters), vdot, plan);
    try {
      const rewrite = await requestAiRewrite(context, note.trim(), token);
      if (id !== requestId.current) return;
      setAi({ status: "idle", error: null, rewrite, madeFor });
      ReactGA.event({ category: "Race Debrief", action: "AI Rewrite" });
    } catch (e) {
      if (id !== requestId.current) return;
      setAi((prev) => ({
        ...prev,
        status: "error",
        error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
      }));
    }
  }, [result, resultMeters, user, unit, vdot, plan, note, madeFor]);

  const clearAiRewrite = useCallback(() => setAi(AI_IDLE), []);

  return {
    fileName,
    isSample,
    error: error ?? analysis.error,
    unit,
    setUnit,
    result,
    verdict,
    plan,
    distance,
    setDistance,
    resultMeters,
    vdot,
    note,
    setNote,
    aiStatus: ai.status,
    aiError: ai.error,
    aiRewrite,
    askCoach,
    clearAiRewrite,
    loadFile,
    loadSample,
    reset,
  };
}
