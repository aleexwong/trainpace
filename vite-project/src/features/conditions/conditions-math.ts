/**
 * Race Day Conditions — Core Math Engine
 *
 * Answers two questions a runner actually has on race week:
 *   1. "It's going to be 28°C and humid — what's my realistic finish time?"
 *   2. "What pace should I actually run today's workout at?"
 *
 * Two independent physiological penalties are modelled and then composed:
 *
 *   HEAT   Thermoregulation competes with the working muscles for cardiac
 *          output, and evaporative cooling fails as the air saturates. The
 *          practical predictor is the *sum* of air temperature and dew point
 *          (both °F) — the long-standing rule of thumb in the running
 *          community, because dew point captures the evaporative ceiling in a
 *          way relative humidity alone does not (20°C/90% RH and 30°C/40% RH
 *          are very different runs at the same "warm" description).
 *
 *   ALTITUDE  Lower partial pressure of oxygen reduces VO₂max directly. This
 *          one is modelled at the fitness level rather than the pace level:
 *          we shrink VDOT and let the existing Daniels engine re-predict the
 *          race, which is why the altitude penalty automatically grows with
 *          race distance without any extra rules.
 *
 * Both are estimates for a healthy, sea-level-resident runner. They describe
 * the *typical* response; individual heat tolerance varies a lot.
 */

import {
  calculateVdot,
  predictRaceTime,
  calculateTrainingZones,
  velocityToPacePerKm,
  velocityToPacePerMile,
  trainingVelocity,
} from "@/features/vdot-calculator/vdot-math";
import type {
  ConditionsInput,
  ConditionsResult,
  HeatRiskBand,
  AdjustedZone,
} from "./types";

/* ------------------------------------------------------------------ */
/* Unit helpers                                                        */
/* ------------------------------------------------------------------ */

export function celsiusToFahrenheit(c: number): number {
  return c * 1.8 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return (f - 32) / 1.8;
}

export function metersToFeet(m: number): number {
  return m * 3.28084;
}

export function feetToMeters(ft: number): number {
  return ft / 3.28084;
}

/* ------------------------------------------------------------------ */
/* Dew point                                                           */
/* ------------------------------------------------------------------ */

const MAGNUS_A = 17.625;
const MAGNUS_B = 243.04;

/**
 * Dew point from air temperature and relative humidity (Magnus-Tetens).
 *
 * @param tempC - Air temperature in °C
 * @param relativeHumidity - Relative humidity as a percentage (0–100)
 * @returns Dew point in °C
 */
export function dewPointC(tempC: number, relativeHumidity: number): number {
  // Clamp away from 0% RH: ln(0) is -Infinity, and no real weather report is
  // truly 0% anyway.
  const rh = Math.min(100, Math.max(1, relativeHumidity));
  const alpha =
    Math.log(rh / 100) + (MAGNUS_A * tempC) / (MAGNUS_B + tempC);
  return (MAGNUS_B * alpha) / (MAGNUS_A - alpha);
}

/**
 * The heat-stress "sum": air temperature + dew point, both in °F.
 *
 * Runners use this rather than temperature alone because it collapses the two
 * things that matter — how hot the air is, and how much evaporative cooling
 * headroom is left — into one number that maps cleanly onto observed slowdown.
 */
export function heatStressSum(tempC: number, relativeHumidity: number): number {
  return (
    celsiusToFahrenheit(tempC) +
    celsiusToFahrenheit(dewPointC(tempC, relativeHumidity))
  );
}

/* ------------------------------------------------------------------ */
/* Heat penalty                                                        */
/* ------------------------------------------------------------------ */

/**
 * Slowdown as a fraction of finish time, keyed on the temp+dew-point sum (°F).
 * Below 100 the sum is not a limiter for a healthy runner, so the penalty is
 * zero — a cold day is not modelled as a bonus here (see note in the UI copy).
 *
 * These anchors are the conventional community bands; intermediate values are
 * linearly interpolated rather than snapped, so a 1° forecast change moves the
 * answer smoothly instead of jumping a whole band.
 */
const HEAT_ANCHORS: ReadonlyArray<readonly [sum: number, slowdown: number]> = [
  [100, 0],
  [110, 0.005],
  [120, 0.01],
  [130, 0.02],
  [140, 0.03],
  [150, 0.045],
  [160, 0.06],
  [170, 0.08],
  [180, 0.1],
] as const;

/** Slope of the final segment, reused to extrapolate above the last anchor. */
const HEAT_TAIL_SLOPE =
  (HEAT_ANCHORS[HEAT_ANCHORS.length - 1][1] -
    HEAT_ANCHORS[HEAT_ANCHORS.length - 2][1]) /
  (HEAT_ANCHORS[HEAT_ANCHORS.length - 1][0] -
    HEAT_ANCHORS[HEAT_ANCHORS.length - 2][0]);

/**
 * Base heat slowdown for the reference effort (~1 hour) at a given stress sum.
 * @returns Fraction of finish time lost, e.g. 0.03 = 3% slower
 */
export function baseHeatSlowdown(sum: number): number {
  const first = HEAT_ANCHORS[0];
  const last = HEAT_ANCHORS[HEAT_ANCHORS.length - 1];

  if (sum <= first[0]) return 0;
  if (sum >= last[0]) return last[1] + (sum - last[0]) * HEAT_TAIL_SLOPE;

  for (let i = 1; i < HEAT_ANCHORS.length; i++) {
    const [hiSum, hiSlow] = HEAT_ANCHORS[i];
    if (sum <= hiSum) {
      const [loSum, loSlow] = HEAT_ANCHORS[i - 1];
      const t = (sum - loSum) / (hiSum - loSum);
      return loSlow + t * (hiSlow - loSlow);
    }
  }
  return last[1];
}

const HEAT_REFERENCE_MINUTES = 20;

/**
 * Heat hurts long races disproportionately: a 5K is over before core
 * temperature climbs far, while a marathon spends hours accumulating heat the
 * body cannot shed. This scales the base penalty by race duration, normalised
 * so that a ~1 hour effort sits at roughly 1.0×.
 *
 * @param durationMinutes - Expected race duration under ideal conditions
 */
export function durationHeatFactor(durationMinutes: number): number {
  if (durationMinutes <= HEAT_REFERENCE_MINUTES) return 0.6;
  const factor =
    0.6 + 0.37 * Math.log(durationMinutes / HEAT_REFERENCE_MINUTES);
  return Math.min(1.7, factor);
}

/* ------------------------------------------------------------------ */
/* Altitude penalty                                                    */
/* ------------------------------------------------------------------ */

/** Below this elevation the aerobic cost is not meaningfully different. */
const ALTITUDE_THRESHOLD_M = 300;
/** Fraction of VO₂max lost per 300 m above the threshold, acute exposure. */
const VO2_LOSS_PER_300M = 0.018;
/** Acclimatisation recovers part of the deficit — never all of it. */
const ACCLIMATISED_RESIDUAL = 0.6;

/**
 * Fraction of sea-level VO₂max retained at a given elevation.
 *
 * @param altitudeMeters - Elevation of the race
 * @param acclimatised - True if the runner has lived at altitude 2+ weeks
 * @returns Multiplier in (0, 1], e.g. 0.93 = 7% of VO₂max lost
 */
export function altitudeVo2Fraction(
  altitudeMeters: number,
  acclimatised: boolean
): number {
  if (altitudeMeters <= ALTITUDE_THRESHOLD_M) return 1;
  const steps = (altitudeMeters - ALTITUDE_THRESHOLD_M) / 300;
  const acuteLoss = steps * VO2_LOSS_PER_300M;
  const loss = acclimatised ? acuteLoss * ACCLIMATISED_RESIDUAL : acuteLoss;
  // Floor guards against nonsense inputs (Everest-height "races").
  return Math.max(0.5, 1 - loss);
}

/* ------------------------------------------------------------------ */
/* Risk banding                                                        */
/* ------------------------------------------------------------------ */

interface BandSpec {
  band: HeatRiskBand;
  label: string;
  color: string;
  advice: string;
}

const BANDS: ReadonlyArray<readonly [maxSum: number, spec: BandSpec]> = [
  [
    100,
    {
      band: "ideal",
      label: "Ideal",
      color: "emerald",
      advice:
        "Prime racing conditions. Run your goal pace as planned — cooling is not a limiter today.",
    },
  ],
  [
    130,
    {
      band: "mild",
      label: "Mild",
      color: "lime",
      advice:
        "Noticeable but manageable. Drink to thirst, and expect the last third to feel slightly harder than usual.",
    },
  ],
  [
    150,
    {
      band: "moderate",
      label: "Moderate",
      color: "yellow",
      advice:
        "Start at the adjusted pace, not your goal pace. Take fluid at every station and pour water over your head and forearms.",
    },
  ],
  [
    170,
    {
      band: "hard",
      label: "Hard",
      color: "orange",
      advice:
        "Race by effort, not by watch. Go out slower than the adjusted pace and reassess at halfway — a positive split here is very costly.",
    },
  ],
  [
    180,
    {
      band: "severe",
      label: "Severe",
      color: "red",
      advice:
        "Treat time goals as off the table. Prioritise finishing safely: walk aid stations, use ice, and stop if you get chills or stop sweating.",
    },
  ],
];

const DANGEROUS_SPEC: BandSpec = {
  band: "dangerous",
  label: "Dangerous",
  color: "rose",
  advice:
    "These conditions carry a real risk of heat illness. Races are often shortened or cancelled at this level — consider not racing, and never push through dizziness, confusion, or chills.",
};

export function heatRiskBand(sum: number): BandSpec {
  for (const [maxSum, spec] of BANDS) {
    if (sum < maxSum) return spec;
  }
  return DANGEROUS_SPEC;
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

/**
 * Apply race-day conditions to a goal performance.
 *
 * Altitude is applied first, at the fitness level: VDOT is scaled by the
 * retained VO₂max fraction and the race is re-predicted from that. Heat is
 * then applied as a time penalty on top, because heat degrades the *sustainable
 * fraction* of a given capacity rather than capacity itself.
 *
 * The reported `effectiveVdot` is back-solved from the final adjusted time, so
 * it reflects both penalties as a single "what fitness would this equate to at
 * sea level in perfect weather" number.
 */
export function calculateConditions(
  input: ConditionsInput
): ConditionsResult | null {
  const { distanceMeters, goalTimeSeconds, tempC, humidity, altitudeMeters } =
    input;

  if (
    !isFinite(distanceMeters) ||
    distanceMeters <= 0 ||
    !isFinite(goalTimeSeconds) ||
    goalTimeSeconds <= 0
  ) {
    return null;
  }

  const baselineVdot = calculateVdot(distanceMeters, goalTimeSeconds);
  if (!isFinite(baselineVdot) || baselineVdot <= 0) return null;

  // --- Altitude: shrink capacity, re-predict the race ---
  const vo2Fraction = altitudeVo2Fraction(
    altitudeMeters,
    input.acclimatised
  );
  const altitudeVdot = baselineVdot * vo2Fraction;
  const afterAltitudeSeconds =
    vo2Fraction === 1
      ? goalTimeSeconds
      : predictRaceTime(altitudeVdot, distanceMeters);
  const altitudeCostSeconds = afterAltitudeSeconds - goalTimeSeconds;

  // --- Heat: time penalty scaled by how long you're out there ---
  const sum = heatStressSum(tempC, humidity);
  const dewPoint = dewPointC(tempC, humidity);
  // Scale on the altitude-adjusted duration: at altitude you're exposed longer.
  const heatSlowdown =
    baseHeatSlowdown(sum) * durationHeatFactor(afterAltitudeSeconds / 60);
  const adjustedSeconds = afterAltitudeSeconds * (1 + heatSlowdown);
  const heatCostSeconds = adjustedSeconds - afterAltitudeSeconds;

  // --- Back-solve a single equivalent fitness number ---
  const effectiveVdot = calculateVdot(distanceMeters, adjustedSeconds);

  const adjustedPacePerKm = (adjustedSeconds / distanceMeters) * 1000;
  const adjustedPacePerMile = (adjustedSeconds / distanceMeters) * 1609.34;
  const goalPacePerKm = (goalTimeSeconds / distanceMeters) * 1000;
  const goalPacePerMile = (goalTimeSeconds / distanceMeters) * 1609.34;

  const spec = heatRiskBand(sum);

  return {
    baselineVdot,
    effectiveVdot,
    vdotDrop: baselineVdot - effectiveVdot,

    goalTimeSeconds,
    adjustedTimeSeconds: adjustedSeconds,
    totalCostSeconds: adjustedSeconds - goalTimeSeconds,
    heatCostSeconds,
    altitudeCostSeconds,

    goalPacePerKm,
    goalPacePerMile,
    adjustedPacePerKm,
    adjustedPacePerMile,
    paceCostPerKm: adjustedPacePerKm - goalPacePerKm,
    paceCostPerMile: adjustedPacePerMile - goalPacePerMile,

    dewPointC: dewPoint,
    heatStressSum: sum,
    heatSlowdownFraction: heatSlowdown,
    altitudeVo2Fraction: vo2Fraction,

    riskBand: spec.band,
    riskLabel: spec.label,
    riskColor: spec.color,
    advice: spec.advice,
  };
}

/* ------------------------------------------------------------------ */
/* Adjusted training paces                                             */
/* ------------------------------------------------------------------ */

/**
 * Today's training paces under the given conditions.
 *
 * Same principle as the race adjustment, but the heat factor is evaluated at
 * each zone's own realistic session duration — a 40-minute easy run and a set
 * of 400m reps do not carry the same heat cost, and collapsing them to one
 * number is what makes most "hot weather pace" tables feel wrong.
 */
export function calculateAdjustedZones(
  baselineVdot: number,
  tempC: number,
  humidity: number,
  altitudeMeters: number,
  acclimatised: boolean
): AdjustedZone[] {
  const sum = heatStressSum(tempC, humidity);
  const vo2Fraction = altitudeVo2Fraction(altitudeMeters, acclimatised);
  const altitudeVdot = baselineVdot * vo2Fraction;
  const base = baseHeatSlowdown(sum);

  // Representative continuous-effort duration per zone, in minutes. Reps and
  // intervals are short bouts with recovery, so heat bites far less than it
  // does during a steady 90-minute long run.
  const zoneMinutes: Record<string, number> = {
    Easy: 60,
    Marathon: 90,
    Threshold: 25,
    Interval: 5,
    Repetition: 2,
  };

  return calculateTrainingZones(baselineVdot).map((zone) => {
    const slowdown = base * durationHeatFactor(zoneMinutes[zone.name] ?? 30);

    // Recompute the zone's velocities off the altitude-adjusted VDOT, then
    // apply the heat time penalty to the resulting pace.
    const fastVelocity = trainingVelocity(altitudeVdot, zone.intensityRange[1]);
    const slowVelocity = trainingVelocity(altitudeVdot, zone.intensityRange[0]);

    const adjKmFast = velocityToPacePerKm(fastVelocity) * (1 + slowdown);
    const adjKmSlow = velocityToPacePerKm(slowVelocity) * (1 + slowdown);
    const adjMiFast = velocityToPacePerMile(fastVelocity) * (1 + slowdown);
    const adjMiSlow = velocityToPacePerMile(slowVelocity) * (1 + slowdown);

    return {
      name: zone.name,
      shortName: zone.shortName,
      description: zone.description,
      color: zone.color,
      basePacePerKmSeconds: zone.pacePerKmSeconds,
      basePacePerMileSeconds: zone.pacePerMileSeconds,
      adjustedPacePerKmSeconds: [adjKmFast, adjKmSlow],
      adjustedPacePerMileSeconds: [adjMiFast, adjMiSlow],
      slowdownFraction: slowdown,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Sensitivity sweep (for the chart)                                   */
/* ------------------------------------------------------------------ */

export interface SensitivityPoint {
  tempC: number;
  adjustedTimeSeconds: number;
}

/**
 * Sweep finish time across a temperature range, holding humidity and altitude
 * fixed. This is what turns a single number into a decision: seeing the curve
 * go nearly flat below 15°C and then bend sharply upward tells a runner how
 * much a 6am start is actually worth.
 */
export function temperatureSensitivity(
  input: ConditionsInput,
  fromC = -5,
  toC = 40,
  stepC = 1
): SensitivityPoint[] {
  const points: SensitivityPoint[] = [];
  for (let t = fromC; t <= toC; t += stepC) {
    const result = calculateConditions({ ...input, tempC: t });
    if (result) {
      points.push({ tempC: t, adjustedTimeSeconds: result.adjustedTimeSeconds });
    }
  }
  return points;
}
