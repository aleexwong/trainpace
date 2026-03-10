/**
 * VDOT Calculator - Core Math Engine
 * Implements the Daniels & Gilbert running formula for VDOT calculation.
 *
 * VDOT is a measure of running ability based on race performance. It uses
 * two equations:
 *   1. VO2 cost at a given velocity
 *   2. Percent of VO2max sustained for a given duration
 *
 * Reference: "Daniels' Running Formula" by Jack Daniels
 */

/**
 * Calculate the oxygen cost (VO2) of running at a given velocity.
 * @param velocity - Running velocity in meters per minute
 * @returns VO2 in ml/kg/min
 */
export function oxygenCost(velocity: number): number {
  return -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
}

/**
 * Calculate the percentage of VO2max that can be sustained for a given duration.
 * @param timeMinutes - Race duration in minutes
 * @returns Fraction of VO2max (e.g., 0.85 = 85%)
 */
export function percentVO2max(timeMinutes: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes)
  );
}

/**
 * Calculate VDOT from a race performance.
 * @param distanceMeters - Race distance in meters
 * @param timeSeconds - Race time in seconds
 * @returns VDOT value (estimated VO2max)
 */
export function calculateVdot(
  distanceMeters: number,
  timeSeconds: number
): number {
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes; // meters per minute

  const vo2 = oxygenCost(velocity);
  const pctVO2max = percentVO2max(timeMinutes);

  return vo2 / pctVO2max;
}

/**
 * Given a target VO2, solve for the running velocity using the quadratic formula.
 * VO2 = -4.6 + 0.182258*v + 0.000104*v²
 * => 0.000104*v² + 0.182258*v + (-4.6 - VO2) = 0
 *
 * @param targetVO2 - Target VO2 in ml/kg/min
 * @returns velocity in meters per minute
 */
export function velocityFromVO2(targetVO2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - targetVO2;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return 0;

  // Use the positive root
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

/**
 * Predict race time for a given distance based on VDOT.
 * Uses bisection method to find the time where calculated VDOT matches.
 *
 * @param vdot - VDOT value
 * @param distanceMeters - Target race distance in meters
 * @returns Predicted time in seconds
 */
export function predictRaceTime(
  vdot: number,
  distanceMeters: number
): number {
  // Set reasonable bounds for bisection
  // Lower bound: very fast (world record-ish pace)
  // Upper bound: very slow pace
  let lo = distanceMeters / 500; // ~500 m/min = very fast
  let hi = distanceMeters / 50; // ~50 m/min = very slow (walking)

  // Bisection: find time t such that calculateVdot(d, t*60) ≈ vdot
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const midTimeSeconds = mid * 60;
    const midVdot = calculateVdot(distanceMeters, midTimeSeconds);

    if (Math.abs(midVdot - vdot) < 0.001) {
      return midTimeSeconds;
    }

    // Higher VDOT = faster time, so if midVdot > vdot, time is too fast
    if (midVdot > vdot) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return ((lo + hi) / 2) * 60;
}

/**
 * Calculate training pace (velocity) at a given percentage of VO2max.
 * @param vdot - VDOT value
 * @param intensityFraction - Fraction of VO2max (e.g., 0.70 for 70%)
 * @returns velocity in meters per minute
 */
export function trainingVelocity(
  vdot: number,
  intensityFraction: number
): number {
  const targetVO2 = vdot * intensityFraction;
  return velocityFromVO2(targetVO2);
}

/**
 * Convert velocity (m/min) to pace per kilometer.
 * @param velocity - meters per minute
 * @returns pace in seconds per kilometer
 */
export function velocityToPacePerKm(velocity: number): number {
  if (velocity <= 0) return 0;
  return (1000 / velocity) * 60; // seconds per km
}

/**
 * Convert velocity (m/min) to pace per mile.
 * @param velocity - meters per minute
 * @returns pace in seconds per mile
 */
export function velocityToPacePerMile(velocity: number): number {
  if (velocity <= 0) return 0;
  return (1609.34 / velocity) * 60; // seconds per mile
}

/**
 * Format seconds into a readable time string.
 * @param totalSeconds - Time in seconds
 * @returns Formatted string (HH:MM:SS or MM:SS or M:SS)
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format seconds into a pace string (M:SS).
 * @param paceSeconds - Pace in seconds per unit
 * @returns Formatted pace string
 */
export function formatPace(paceSeconds: number): string {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Daniels training zones with intensity ranges.
 * Returns training paces for all zones given a VDOT value.
 */
export interface TrainingZoneResult {
  name: string;
  shortName: string;
  description: string;
  pacePerKmSeconds: [number, number]; // [fast, slow] pace range
  pacePerMileSeconds: [number, number];
  intensityRange: [number, number]; // [low, high] % VO2max
  color: string;
}

export function calculateTrainingZones(vdot: number): TrainingZoneResult[] {
  const zones: {
    name: string;
    shortName: string;
    description: string;
    intensityRange: [number, number];
    color: string;
  }[] = [
    {
      name: "Easy",
      shortName: "E",
      description:
        "Recovery and base building. Conversational pace. Most of your weekly mileage.",
      intensityRange: [0.59, 0.74],
      color: "emerald",
    },
    {
      name: "Marathon",
      shortName: "M",
      description:
        "Marathon race pace. Sustained effort for marathon-specific training.",
      intensityRange: [0.75, 0.84],
      color: "blue",
    },
    {
      name: "Threshold",
      shortName: "T",
      description:
        "Comfortably hard. Lactate threshold pace for tempo runs and cruise intervals.",
      intensityRange: [0.83, 0.88],
      color: "yellow",
    },
    {
      name: "Interval",
      shortName: "I",
      description:
        "Hard effort. VO2max training for 3-5 minute repeats at near maximum aerobic capacity.",
      intensityRange: [0.95, 1.0],
      color: "orange",
    },
    {
      name: "Repetition",
      shortName: "R",
      description:
        "Very fast, short reps (200-400m). Develops speed, running economy, and neuromuscular power.",
      intensityRange: [1.05, 1.2],
      color: "red",
    },
  ];

  return zones.map((zone) => {
    const fastVelocity = trainingVelocity(vdot, zone.intensityRange[1]);
    const slowVelocity = trainingVelocity(vdot, zone.intensityRange[0]);

    return {
      ...zone,
      pacePerKmSeconds: [
        velocityToPacePerKm(fastVelocity),
        velocityToPacePerKm(slowVelocity),
      ],
      pacePerMileSeconds: [
        velocityToPacePerMile(fastVelocity),
        velocityToPacePerMile(slowVelocity),
      ],
    };
  });
}
