/**
 * Race comparison logic
 *
 * Lets a runner see how the route they just analyzed stacks up against a famous
 * race course (Boston, NYC, Big Sur, ...). Everything is normalized *per km* so
 * a short training run compares fairly against a full marathon — the question is
 * "does my terrain look like the race's terrain?", not "is my run as long?".
 *
 * Pure functions only; the reference data comes from marathon-data.json.
 */
import marathonData from "@/data/marathon-data.json";

export interface RaceReference {
  key: string;
  name: string;
  city: string;
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  /** Climbing per km (m/km) — the grade-adjusted intensity of the course. */
  climbPerKm: number;
  /** Net descent per km (m/km); positive = net downhill, negative = net uphill. */
  netDropPerKm: number;
}

export interface RouteMetricsInput {
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
}

export interface RouteMetrics {
  climbPerKm: number;
  netDropPerKm: number;
}

/** Coarse terrain label from climbing intensity (m/km). */
export type TerrainLabel = "Flat" | "Rolling" | "Hilly" | "Mountainous";

export function terrainLabel(climbPerKm: number): TerrainLabel {
  if (climbPerKm < 4) return "Flat";
  if (climbPerKm < 9) return "Rolling";
  if (climbPerKm < 16) return "Hilly";
  return "Mountainous";
}

function toMetrics(distanceKm: number, gain: number, loss: number): RouteMetrics {
  const d = distanceKm > 0 ? distanceKm : 1;
  return {
    climbPerKm: gain / d,
    netDropPerKm: (loss - gain) / d,
  };
}

/**
 * Reference races, sorted by climbing intensity (flattest first) so the picker
 * reads as a difficulty ladder. Records missing elevation data are skipped.
 */
export const RACE_REFERENCES: RaceReference[] = Object.entries(
  marathonData as Record<
    string,
    {
      name: string;
      city: string;
      distance: number;
      elevationGain: number;
      elevationLoss: number;
      startElevation: number;
      endElevation: number;
    }
  >
)
  .map(([key, r]) => {
    const d = r.distance > 0 ? r.distance : 1;
    // Net direction from start/end elevation — more reliable for point-to-point
    // courses than gain−loss, which can disagree in approximate course data.
    const netDropPerKm = (r.startElevation - r.endElevation) / d;
    return {
      key,
      name: r.name,
      city: r.city,
      distanceKm: r.distance,
      elevationGain: r.elevationGain,
      elevationLoss: r.elevationLoss,
      climbPerKm: r.elevationGain / d,
      netDropPerKm,
    };
  })
  .sort((a, b) => a.climbPerKm - b.climbPerKm);

export const DEFAULT_RACE_KEY = "boston";

export function getRaceByKey(key: string): RaceReference | undefined {
  return RACE_REFERENCES.find((r) => r.key === key);
}

export interface RaceComparisonResult {
  route: RouteMetrics;
  race: RaceReference;
  /** route climb per km ÷ race climb per km (1 = identical intensity). */
  climbRatio: number;
  routeTerrain: TerrainLabel;
  raceTerrain: TerrainLabel;
  /** One-line headline comparing climbing intensity. */
  verdict: string;
  /** Optional caveat about net downhill / uphill demands, or null. */
  netNote: string | null;
}

/**
 * Compare a route's terrain to a reference race. Both sides are already
 * normalized per km, so the comparison is intensity-to-intensity.
 */
export function compareToRace(
  input: RouteMetricsInput,
  race: RaceReference
): RaceComparisonResult {
  const route = toMetrics(
    input.distanceKm,
    input.elevationGain,
    input.elevationLoss
  );

  const climbRatio =
    race.climbPerKm > 0.1 ? route.climbPerKm / race.climbPerKm : route.climbPerKm > 0.1 ? Infinity : 1;

  let verdict: string;
  if (!Number.isFinite(climbRatio)) {
    verdict = `Your route climbs ${route.climbPerKm.toFixed(
      1
    )} m/km; ${race.name} is essentially flat, so this is much hillier.`;
  } else if (climbRatio >= 1.15) {
    verdict = `Your route climbs about ${climbRatio.toFixed(
      1
    )}× more per km than ${race.name} — it's the tougher course for climbing.`;
  } else if (climbRatio <= 0.85) {
    const inv = climbRatio > 0 ? 1 / climbRatio : Infinity;
    verdict = Number.isFinite(inv)
      ? `Your route is flatter per km than ${race.name}, which climbs about ${inv.toFixed(
          1
        )}× more.`
      : `Your route is essentially flat compared to ${race.name}.`;
  } else {
    verdict = `Your route has similar climbing per km to ${race.name} (${route.climbPerKm.toFixed(
      1
    )} vs ${race.climbPerKm.toFixed(1)} m/km).`;
  }

  // Net-elevation caveat: the most common training blind spot is a net-downhill
  // race (Boston, CIM, Big Sur point-to-point) run on flat training terrain,
  // which leaves quads unprepared for the eccentric load.
  let netNote: string | null = null;
  const raceNetDownhill = race.netDropPerKm >= 1;
  const raceNetUphill = race.netDropPerKm <= -1;
  const routeIsFlatNet = Math.abs(route.netDropPerKm) < 0.75;

  if (raceNetDownhill && (routeIsFlatNet || route.netDropPerKm < race.netDropPerKm - 1)) {
    netNote = `${race.name} runs net downhill (${race.netDropPerKm.toFixed(
      1
    )} m/km of net descent). Add some downhill running so your quads are ready for the eccentric load.`;
  } else if (raceNetUphill && route.netDropPerKm > race.netDropPerKm + 1) {
    netNote = `${race.name} is net uphill (${Math.abs(race.netDropPerKm).toFixed(
      1
    )} m/km net climb). Practice sustained climbing at goal effort.`;
  }

  return {
    route,
    race,
    climbRatio,
    routeTerrain: terrainLabel(route.climbPerKm),
    raceTerrain: terrainLabel(race.climbPerKm),
    verdict,
    netNote,
  };
}
