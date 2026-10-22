/**
 * Race Debrief — pure analysis of a recorded race.
 *
 * Pipeline: parse GPX → cumulative distance → resample every 20 m → smooth the
 * elevation → split times by interpolation → grade-adjusted effort per split →
 * race-level pacing metrics. No React, no network, so it is unit-tested
 * directly and safe to deep-import.
 */
import type {
  ConsistencyLabel,
  DebriefResult,
  OfficialDistance,
  Split,
  SplitShape,
  SplitUnit,
  TimedPoint,
} from "./types";
import { KM_PER_MILE, distanceInUnit, formatClock as clock, paceInUnit } from "./utils";

const EARTH_RADIUS_M = 6_371_000;
// Resample step and smoothing window for elevation. ±100 m of smoothing keeps
// GPS and barometer noise from turning into fake 15% "grades".
const RESAMPLE_STEP_M = 20;
const SMOOTH_HALF_WINDOW = 5;
// Stop detection: look at 5-second windows and call anything under 0.6 m/s
// (about 28 min/km) standing still. Watch GPS drifts ~1-2 m when stationary.
const STOP_WINDOW_S = 5;
const STOP_SPEED_MPS = 0.6;
// A split whose clock-time halves differ by less than this is an even split.
const EVEN_SPLIT_PCT = 1;
// The pace has to drop by this much before we call it a slowdown.
const SLOWDOWN_PCT = 5;

export const OFFICIAL_DISTANCES: OfficialDistance[] = [
  { name: "5K", meters: 5000 },
  { name: "10K", meters: 10000 },
  { name: "Half Marathon", meters: 21097.5 },
  { name: "Marathon", meters: 42195 },
];

// ── Parsing ────────────────────────────────────────────────────────────────

function firstChildText(el: Element, localName: string): string | null {
  const child = el.getElementsByTagNameNS("*", localName)[0];
  return child?.textContent?.trim() || null;
}

/**
 * Read the recorded track points from a GPX string. Throws an Error with a
 * runner-facing message when the file can't be debriefed.
 */
export function parseTimedGpx(xml: string): TimedPoint[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("This file is not valid GPX. Try exporting it again.");
  }

  const nodes = Array.from(doc.getElementsByTagNameNS("*", "trkpt"));
  if (nodes.length === 0) {
    throw new Error(
      "No recorded track found. Export the activity itself as GPX (from Garmin Connect, Strava or your watch app), not a planned course."
    );
  }

  const points: TimedPoint[] = [];
  let sawTime = false;
  for (const node of nodes) {
    const lat = parseFloat(node.getAttribute("lat") ?? "");
    const lng = parseFloat(node.getAttribute("lon") ?? "");
    const timeText = firstChildText(node, "time");
    if (timeText) sawTime = true;
    const time = timeText ? Date.parse(timeText) : NaN;
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(time)) continue;
    // Drop points that go back in time (merged or corrupted recordings).
    if (points.length > 0 && time < points[points.length - 1].time) continue;
    const eleText = firstChildText(node, "ele");
    const ele = eleText !== null ? parseFloat(eleText) : NaN;
    points.push({ lat, lng, ele: isFinite(ele) ? ele : null, time });
  }

  if (!sawTime) {
    throw new Error(
      "This GPX has no timestamps, so it looks like a planned course rather than a recorded run. For course analysis, use the Elevation Finder."
    );
  }
  if (points.length < 10) {
    throw new Error("This recording is too short to debrief.");
  }
  return points;
}

// ── Geometry & interpolation ───────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Linear interpolation of `ys` at `x` over ascending (non-decreasing) `xs`.
 * On a flat run of equal xs (standing still) it returns the first matching
 * y, so time spent stopped is charged to the split that follows.
 */
function interpolate(xs: number[], ys: number[], x: number): number {
  if (x <= xs[0]) return ys[0];
  const last = xs.length - 1;
  if (x >= xs[last]) return ys[last];
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < x) lo = mid;
    else hi = mid;
  }
  const span = xs[hi] - xs[lo];
  if (span === 0) return ys[hi];
  return ys[lo] + ((ys[hi] - ys[lo]) * (x - xs[lo])) / span;
}

/**
 * Energy cost of running on a grade relative to flat ground, from Minetti et
 * al. (2002), "Energy cost of walking and running at extreme uphill and
 * downhill slopes", J Appl Physiol 93:1039–1046. Grade is rise/run (0.05 = 5%).
 * Clamped to the ±45% range the polynomial was fitted on.
 */
export function gradeCostFactor(grade: number): number {
  const i = Math.max(-0.45, Math.min(0.45, grade));
  const cost =
    155.4 * i ** 5 -
    30.4 * i ** 4 -
    43.3 * i ** 3 +
    46.3 * i ** 2 +
    19.5 * i +
    3.6;
  return cost / 3.6;
}

// ── Track model ────────────────────────────────────────────────────────────

interface Track {
  /** Raw cumulative distance (m) and time (s from start) per point. */
  cumM: number[];
  tSec: number[];
  totalM: number;
  hasElevation: boolean;
  /** Resampled distance (m) and smoothed elevation (m). */
  sampleM: number[];
  sampleEle: number[];
  /** Per resampled step: length (m) and hill cost factor. */
  stepLen: number[];
  stepFactor: number[];
}

function fillElevation(points: TimedPoint[]): { ele: number[]; has: boolean } {
  const known = points.filter((p) => p.ele !== null).length;
  const has = known >= points.length / 2;
  if (!has) return { ele: points.map(() => 0), has };
  const firstKnown = points.find((p) => p.ele !== null)!.ele as number;
  let prev = firstKnown;
  const ele = points.map((p) => {
    if (p.ele !== null) prev = p.ele;
    return prev;
  });
  return { ele, has };
}

function buildTrack(points: TimedPoint[]): Track {
  const cumM = [0];
  for (let i = 1; i < points.length; i++) {
    cumM.push(cumM[i - 1] + haversineMeters(points[i - 1], points[i]));
  }
  const t0 = points[0].time;
  const tSec = points.map((p) => (p.time - t0) / 1000);
  const totalM = cumM[cumM.length - 1];
  const { ele, has } = fillElevation(points);

  const sampleM: number[] = [];
  for (let d = 0; d < totalM; d += RESAMPLE_STEP_M) sampleM.push(d);
  sampleM.push(totalM);
  const rawEle = sampleM.map((d) => interpolate(cumM, ele, d));
  const sampleEle = rawEle.map((_, k) => {
    const from = Math.max(0, k - SMOOTH_HALF_WINDOW);
    const to = Math.min(rawEle.length - 1, k + SMOOTH_HALF_WINDOW);
    let sum = 0;
    for (let j = from; j <= to; j++) sum += rawEle[j];
    return sum / (to - from + 1);
  });

  const stepLen: number[] = [];
  const stepFactor: number[] = [];
  for (let k = 0; k < sampleM.length - 1; k++) {
    const len = sampleM[k + 1] - sampleM[k];
    stepLen.push(len);
    const grade = len > 0 ? (sampleEle[k + 1] - sampleEle[k]) / len : 0;
    stepFactor.push(has ? gradeCostFactor(grade) : 1);
  }

  return { cumM, tSec, totalM, hasElevation: has, sampleM, sampleEle, stepLen, stepFactor };
}

function timeAt(track: Track, meters: number): number {
  return interpolate(track.cumM, track.tSec, meters);
}

/** Effort-weighted distance ÷ real distance over [fromM, toM): >1 means uphill on balance. */
function effortRatio(track: Track, fromM: number, toM: number): number {
  let len = 0;
  let effort = 0;
  for (let k = 0; k < track.stepLen.length; k++) {
    const mid = track.sampleM[k] + track.stepLen[k] / 2;
    if (mid < fromM || mid >= toM) continue;
    len += track.stepLen[k];
    effort += track.stepLen[k] * track.stepFactor[k];
  }
  return len > 0 ? effort / len : 1;
}

/** Grade-adjusted pace over [fromM, toM], in seconds per km. */
function effortPace(track: Track, fromM: number, toM: number): number {
  const seconds = timeAt(track, toM) - timeAt(track, fromM);
  const km = (toM - fromM) / 1000;
  return seconds / (km * effortRatio(track, fromM, toM));
}

function stoppedSeconds(track: Track): number {
  const end = track.tSec[track.tSec.length - 1];
  let stopped = 0;
  for (let t = 0; t < end; t += STOP_WINDOW_S) {
    const dt = Math.min(STOP_WINDOW_S, end - t);
    const moved =
      interpolate(track.tSec, track.cumM, t + dt) -
      interpolate(track.tSec, track.cumM, t);
    if (dt > 0 && moved / dt < STOP_SPEED_MPS) stopped += dt;
  }
  return stopped;
}

// ── Metrics ────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function consistencyLabel(score: number): ConsistencyLabel {
  if (score >= 85) return "Very even";
  if (score >= 70) return "Steady";
  if (score >= 50) return "Uneven";
  return "Very uneven";
}

function buildSplits(track: Track, unit: SplitUnit): Split[] {
  const unitKm = unit === "km" ? 1 : KM_PER_MILE;
  const totalKm = track.totalM / 1000;
  const splits: Split[] = [];
  for (let index = 1; (index - 1) * unitKm < totalKm; index++) {
    const startKm = (index - 1) * unitKm;
    const endKm = Math.min(index * unitKm, totalKm);
    const lengthKm = endKm - startKm;
    // A few metres of GPS overshoot past the last full unit isn't a split.
    if (lengthKm < 0.05 && splits.length > 0) break;
    const seconds = timeAt(track, endKm * 1000) - timeAt(track, startKm * 1000);
    const paceSecPerKm = seconds / lengthKm;
    const ratio = effortRatio(track, startKm * 1000, endKm * 1000);
    splits.push({
      index,
      startKm,
      lengthKm,
      seconds,
      paceSecPerKm,
      gapSecPerKm: paceSecPerKm / ratio,
      netElevationM:
        interpolate(track.sampleM, track.sampleEle, endKm * 1000) -
        interpolate(track.sampleM, track.sampleEle, startKm * 1000),
      partial: lengthKm < unitKm - 1e-6,
    });
  }
  return splits;
}

/**
 * The first full split from which the grade-adjusted pace dropped at least
 * SLOWDOWN_PCT below the first-half norm and mostly stayed there. Ignores the
 * first quarter of the race, where a slow start is not a slowdown.
 */
function findSlowdown(full: Split[], totalKm: number): number | null {
  const firstHalf = full.filter((s) => s.startKm + s.lengthKm <= totalKm / 2);
  if (firstHalf.length < 2) return null;
  const baseline = median(firstHalf.map((s) => s.gapSecPerKm));
  const slow = baseline * (1 + SLOWDOWN_PCT / 100);
  for (let i = 1; i < full.length; i++) {
    if (full[i].startKm < totalKm / 4) continue;
    const rest = full.slice(i);
    const mostlySlow =
      rest.filter((s) => s.gapSecPerKm >= baseline * 1.03).length >= rest.length * 0.75;
    if (
      full[i].gapSecPerKm >= slow &&
      mean(rest.map((s) => s.gapSecPerKm)) >= slow &&
      mostlySlow
    ) {
      return full[i].startKm;
    }
  }
  return null;
}

/** Analyse a recorded race. Throws when the recording is too short. */
export function analyzeRace(points: TimedPoint[], unit: SplitUnit): DebriefResult {
  const track = buildTrack(points);
  if (track.totalM < 1000) {
    throw new Error("This recording covers less than 1 km, so there is nothing to debrief.");
  }
  const totalM = track.totalM;
  const totalKm = totalM / 1000;
  const elapsedSec = track.tSec[track.tSec.length - 1];

  const splits = buildSplits(track, unit);
  const full = splits.filter((s) => !s.partial);

  const halfM = totalM / 2;
  const firstHalfSec = timeAt(track, halfM);
  const secondHalfSec = elapsedSec - firstHalfSec;
  const halfDiffPct = ((secondHalfSec - firstHalfSec) / firstHalfSec) * 100;
  const gapHalfDiffPct =
    (effortPace(track, halfM, totalM) / effortPace(track, 0, halfM) - 1) * 100;
  const shape: SplitShape =
    Math.abs(halfDiffPct) < EVEN_SPLIT_PCT ? "even" : halfDiffPct < 0 ? "negative" : "positive";

  const avgGapSecPerKm = effortPace(track, 0, totalM);
  const startVsAvgPct = (effortPace(track, 0, totalM * 0.1) / avgGapSecPerKm - 1) * 100;
  const finalQuarterFadePct =
    (effortPace(track, totalM * 0.75, totalM) / effortPace(track, 0, halfM) - 1) * 100;

  const gaps = full.map((s) => s.gapSecPerKm);
  const gapMean = gaps.length > 0 ? mean(gaps) : avgGapSecPerKm;
  const cvPct =
    gaps.length > 1
      ? (Math.sqrt(mean(gaps.map((g) => (g - gapMean) ** 2))) / gapMean) * 100
      : 0;
  const score = Math.round(Math.max(0, Math.min(100, 100 - (cvPct - 1) * 12)));

  return {
    gpsDistanceKm: totalKm,
    elapsedSec,
    stoppedSec: stoppedSeconds(track),
    hasElevation: track.hasElevation,
    splits,
    avgPaceSecPerKm: elapsedSec / totalKm,
    avgGapSecPerKm,
    firstHalfSec,
    secondHalfSec,
    halfDiffPct,
    gapHalfDiffPct,
    shape,
    startVsAvgPct,
    finalQuarterFadePct,
    slowdownFromKm:
      finalQuarterFadePct >= SLOWDOWN_PCT ? findSlowdown(full, totalKm) : null,
    consistency: { cvPct, score, label: consistencyLabel(score) },
  };
}

/**
 * The standard race distance a GPS distance most likely was. Watches usually
 * read a little long (tangents, weaving), rarely short, so the window is
 * lopsided: −3% to +6%.
 */
export function matchOfficialDistance(gpsKm: number): OfficialDistance | null {
  const meters = gpsKm * 1000;
  return (
    OFFICIAL_DISTANCES.find((d) => {
      const ratio = meters / d.meters;
      return ratio >= 0.97 && ratio <= 1.06;
    }) ?? null
  );
}

// ── Takeaways ──────────────────────────────────────────────────────────────

/**
 * Plain-language lessons from a debrief, most important first. Written at
 * CEFR B2 like the rest of the site's copy.
 */
export function buildTakeaways(r: DebriefResult, unit: SplitUnit): string[] {
  const out: string[] = [];
  const unitLabel = unit === "km" ? "km" : "mile";
  const halfGap = clock(r.secondHalfSec - r.firstHalfSec);

  if (r.shape === "negative") {
    out.push(
      `You ran a negative split: your second half was ${halfGap} faster than your first. Most records are run this way, so keep this approach.`
    );
  } else if (r.shape === "even") {
    out.push(
      `Your two halves were almost the same (${halfGap} apart). That is very good pacing.`
    );
  } else if (r.halfDiffPct <= 3) {
    out.push(
      `Your second half was ${halfGap} slower (${r.halfDiffPct.toFixed(1)}%). A small positive split like this is normal, especially on a long course.`
    );
  } else {
    out.push(
      `Your second half was ${halfGap} slower than your first (${r.halfDiffPct.toFixed(1)}%). More than 3% usually means the start was too fast or you ran low on fuel.`
    );
  }

  if (r.hasElevation && Math.sign(r.gapHalfDiffPct) !== Math.sign(r.halfDiffPct)) {
    const effortWord = r.gapHalfDiffPct < 0 ? "stronger" : "weaker";
    out.push(
      `After adjusting for hills, your second half was actually ${effortWord}. The course profile, not your pacing, explains the clock times.`
    );
  }

  if (r.startVsAvgPct <= -3 && r.finalQuarterFadePct >= 3) {
    const perUnit = paceInUnit(
      (r.avgGapSecPerKm * -r.startVsAvgPct) / 100,
      unit
    );
    out.push(
      `You started about ${Math.round(perUnit)} s per ${unitLabel} faster than your average effort, and paid for it later. Next time, run the first 10% at your goal pace or a little slower.`
    );
  }

  if (r.slowdownFromKm !== null) {
    const at = Math.round(distanceInUnit(r.slowdownFromKm, unit));
    const fuelHint =
      r.gpsDistanceKm > 30
        ? " In a marathon this is often when carbohydrate stores run low, so check your fuel plan."
        : "";
    out.push(
      `Your pace dropped from ${unitLabel} ${at} and did not come back.${fuelHint}`
    );
  } else if (r.finalQuarterFadePct <= 0) {
    out.push("You were as strong or stronger in the final quarter. That shows good endurance.");
  }

  if (r.consistency.score >= 85) {
    out.push(
      `Your effort was very even from split to split (consistency ${r.consistency.score}/100).`
    );
  }

  if (r.stoppedSec >= 30) {
    out.push(
      `You were stopped for ${clock(r.stoppedSec)} in total (aid stations, toilets or traffic lights). That time is part of your result.`
    );
  }

  if (!r.hasElevation) {
    out.push("This file has no elevation data, so the splits are not adjusted for hills.");
  }

  return out;
}
