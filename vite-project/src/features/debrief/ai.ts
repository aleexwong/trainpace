/**
 * Race Debrief — optional AI rewrite.
 *
 * The runner adds a note about the day ("hot, missed my second gel") and the
 * backend asks Gemini to rewrite the verdict, findings and next-time advice
 * around it. Only the computed summary below and the note are sent; the GPX
 * file itself never leaves the browser. Numbers in the summary are already in
 * the runner's display unit so the model can quote them as they will read.
 */
import type { DebriefResult, Finding, PlanLeg, SplitUnit } from "./types";
import { distanceInUnit, paceInUnit } from "./utils";

const API_BASE_URL = import.meta.env.VITE_GPX_API_URL || "https://api.trainpace.com";
const TIMEOUT_MS = 25_000;
export const MAX_NOTE_LENGTH = 1000;

export interface AiDebriefContext {
  distanceName: string;
  unit: SplitUnit;
  finishSec: number;
  firstHalfSec: number;
  secondHalfSec: number;
  startVsAvgPct: number;
  finalQuarterFadePct: number;
  gapHalfDiffPct: number;
  slowdownAt: number | null;
  fadeCostSec: number;
  stoppedSec: number;
  stops: { at: number; seconds: number }[];
  hasElevation: boolean;
  vdot: number | null;
  splits: { n: number; pace: number; gap: number; elevM: number; partial: boolean }[];
  plan: { from: number; to: number; pace: number }[];
}

export interface AiRewrite {
  verdict: string;
  findings: Finding[];
  nextTime: string[];
}

const round = (n: number, places = 1) => Math.round(n * 10 ** places) / 10 ** places;

export function buildAiContext(
  r: DebriefResult,
  unit: SplitUnit,
  distanceName: string,
  vdot: number | null,
  plan: PlanLeg[]
): AiDebriefContext {
  return {
    distanceName,
    unit,
    finishSec: Math.round(r.elapsedSec),
    firstHalfSec: Math.round(r.firstHalfSec),
    secondHalfSec: Math.round(r.secondHalfSec),
    startVsAvgPct: round(r.startVsAvgPct),
    finalQuarterFadePct: round(r.finalQuarterFadePct),
    gapHalfDiffPct: round(r.gapHalfDiffPct),
    slowdownAt: r.slowdownFromKm === null ? null : round(distanceInUnit(r.slowdownFromKm, unit)),
    fadeCostSec: Math.round(r.fadeCostSec),
    stoppedSec: Math.round(r.stoppedSec),
    stops: r.stops.map((s) => ({ at: round(distanceInUnit(s.km, unit)), seconds: Math.round(s.seconds) })),
    hasElevation: r.hasElevation,
    vdot: vdot === null ? null : round(vdot),
    splits: r.splits.map((s) => ({
      n: s.index,
      pace: Math.round(paceInUnit(s.paceSecPerKm, unit)),
      gap: Math.round(paceInUnit(s.gapSecPerKm, unit)),
      elevM: Math.round(s.netElevationM),
      partial: s.partial,
    })),
    plan: plan.map((leg) => ({
      from: round(distanceInUnit(leg.fromKm, unit)),
      to: round(distanceInUnit(leg.toKm, unit)),
      pace: Math.round(paceInUnit(leg.paceSecPerKm, unit)),
    })),
  };
}

/** Ask the backend for a rewrite. Throws an Error with a runner-facing message. */
export async function requestAiRewrite(
  debrief: AiDebriefContext,
  note: string,
  authToken?: string
): Promise<AiRewrite> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/refine-debrief`, {
      method: "POST",
      headers,
      body: JSON.stringify({ debrief, userContext: note }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new Error("The AI coach took too long. Please try again.");
    }
    throw new Error("Could not reach the AI coach. Check your connection and try again.");
  }

  if (response.status === 429) {
    throw new Error("Too many requests. Please wait a minute and try again.");
  }
  const data = await response.json().catch(() => null);
  if (response.status === 400 && data?.details) throw new Error(data.details);
  if (!response.ok || !data?.success || !data.rewrite) {
    throw new Error("Something went wrong. Please try again.");
  }
  return data.rewrite as AiRewrite;
}
