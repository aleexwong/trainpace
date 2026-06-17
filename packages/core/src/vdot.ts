/**
 * VDOT — Core Math Engine
 * Implements the Daniels & Gilbert running formula for VDOT calculation.
 *
 * VDOT is a measure of running ability based on race performance, using:
 *   1. VO2 cost at a given velocity
 *   2. Percent of VO2max sustained for a given duration
 *
 * Reference: "Daniels' Running Formula" by Jack Daniels.
 */

/** Oxygen cost (VO2, ml/kg/min) of running at a velocity in meters/minute. */
export function oxygenCost(velocity: number): number {
  return -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
}

/** Fraction of VO2max sustainable for a duration in minutes. */
export function percentVO2max(timeMinutes: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes)
  );
}

/** Calculate VDOT from a race performance (distance in meters, time in seconds). */
export function calculateVdot(distanceMeters: number, timeSeconds: number): number {
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes; // meters per minute
  const vo2 = oxygenCost(velocity);
  const pctVO2max = percentVO2max(timeMinutes);
  return vo2 / pctVO2max;
}

/** Solve for velocity (m/min) given a target VO2, via the quadratic formula. */
export function velocityFromVO2(targetVO2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - targetVO2;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return 0;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

/** Predict race time (seconds) for a distance (meters) at a given VDOT, via bisection. */
export function predictRaceTime(vdot: number, distanceMeters: number): number {
  let lo = distanceMeters / 500; // ~500 m/min = very fast
  let hi = distanceMeters / 50; // ~50 m/min = walking

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const midTimeSeconds = mid * 60;
    const midVdot = calculateVdot(distanceMeters, midTimeSeconds);

    if (Math.abs(midVdot - vdot) < 0.001) {
      return midTimeSeconds;
    }
    if (midVdot > vdot) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return ((lo + hi) / 2) * 60;
}

/** Training velocity (m/min) at a fraction of VO2max for a given VDOT. */
export function trainingVelocity(vdot: number, intensityFraction: number): number {
  return velocityFromVO2(vdot * intensityFraction);
}

/** Velocity (m/min) to pace in seconds per kilometer. */
export function velocityToPacePerKm(velocity: number): number {
  if (velocity <= 0) return 0;
  return (1000 / velocity) * 60;
}

/** Velocity (m/min) to pace in seconds per mile. */
export function velocityToPacePerMile(velocity: number): number {
  if (velocity <= 0) return 0;
  return (1609.34 / velocity) * 60;
}

/** Format seconds into HH:MM:SS or MM:SS. Rounds first to avoid `:60` bugs. */
export function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Format pace seconds into M:SS. */
export function formatPace(paceSeconds: number): string {
  const rounded = Math.round(paceSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** A Daniels training zone with raw (unformatted) pace ranges. */
export interface TrainingZoneResult {
  name: string;
  shortName: string;
  description: string;
  pacePerKmSeconds: [number, number]; // [fast, slow]
  pacePerMileSeconds: [number, number];
  intensityRange: [number, number]; // [low, high] % VO2max
  color: string;
}

/** Compute all five Daniels training zones for a VDOT value. */
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
