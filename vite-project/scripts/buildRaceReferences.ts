/**
 * buildRaceReferences.ts
 *
 * Derives race-course reference metrics from real GPX files, the SAME way user
 * routes are measured, so the "compare your route to a race" feature compares
 * measured-against-measured instead of measured-against-hand-typed estimates.
 *
 * Honesty rules this script enforces:
 *  - Every metric is COMPUTED from the course GPX, never hand-entered.
 *  - Every record carries provenance: which file it came from and when it was
 *    parsed. `measured: true` marks GPX-derived records.
 *  - Elevation gain/loss use a 3 m hysteresis threshold so GPS noise doesn't
 *    inflate climbing (raw accumulation double-counts jitter).
 *
 * Usage (from vite-project/):
 *   npx vite-node scripts/buildRaceReferences.ts -- <inputDir> [outputFile]
 * Defaults: inputDir = data/race-courses, outputFile = data/race-references.json
 *
 * Drop official/collected course GPX files into the input dir (one per race,
 * named <slug>.gpx) and rerun. Do not edit the output JSON by hand — regenerate.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const EARTH_RADIUS_KM = 6371;
// Minimum elevation change (m) before it counts toward gain/loss. Filters GPS
// jitter; a common, defensible value for consumer-grade barometric/GPS tracks.
const ELEVATION_THRESHOLD_M = 3;

interface TrackPoint {
  lat: number;
  lng: number;
  ele: number | null;
}

interface RaceReferenceRecord {
  slug: string;
  name: string;
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  startElevation: number | null;
  endElevation: number | null;
  climbPerKm: number;
  netDropPerKm: number;
  terrain: "Flat" | "Rolling" | "Hilly" | "Mountainous";
  pointCount: number;
  hasElevationData: boolean;
  // Provenance — never omit these.
  source: string;
  measured: true;
  retrievedAt: string;
}

function haversineKm(a: TrackPoint, b: TrackPoint): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Parse <trkpt> points without a DOM. Patterns use negated character classes
// only (no nested quantifiers) so they run in linear time on any input.
function parseTrackPoints(gpx: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const ptRe = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/g;
  const latRe = /\blat="([^"]+)"/;
  const lonRe = /\blon="([^"]+)"/;
  const eleRe = /<ele>\s*([^<]+)/;

  let m: RegExpExecArray | null;
  while ((m = ptRe.exec(gpx)) !== null) {
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    const lat = latRe.exec(attrs);
    const lon = lonRe.exec(attrs);
    if (!lat || !lon) continue;
    const eleMatch = eleRe.exec(body);
    points.push({
      lat: parseFloat(lat[1]),
      lng: parseFloat(lon[1]),
      ele: eleMatch ? parseFloat(eleMatch[1]) : null,
    });
  }
  return points;
}

function terrainLabel(climbPerKm: number): RaceReferenceRecord["terrain"] {
  if (climbPerKm < 4) return "Flat";
  if (climbPerKm < 9) return "Rolling";
  if (climbPerKm < 16) return "Hilly";
  return "Mountainous";
}

function extractRouteName(gpx: string, fallback: string): string {
  const nameRe = /<name>\s*([^<]+?)\s*<\/name>/;
  const m = nameRe.exec(gpx);
  return m ? m[1].trim() : fallback;
}

export function analyzeGpx(gpx: string, slug: string): RaceReferenceRecord {
  const points = parseTrackPoints(gpx);
  if (points.length === 0) {
    throw new Error(`No <trkpt> points found for "${slug}"`);
  }

  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);
  }

  const elevations = points.filter((p) => p.ele !== null) as Array<
    TrackPoint & { ele: number }
  >;
  const hasElevationData = elevations.length >= 2;

  let elevationGain = 0;
  let elevationLoss = 0;
  let startElevation: number | null = null;
  let endElevation: number | null = null;

  if (hasElevationData) {
    startElevation = elevations[0].ele;
    endElevation = elevations[elevations.length - 1].ele;
    // Hysteresis-threshold accumulation: only commit a change once it exceeds
    // the noise threshold, then rebase. Avoids inflating gain from GPS jitter.
    let ref = elevations[0].ele;
    for (let i = 1; i < elevations.length; i++) {
      const delta = elevations[i].ele - ref;
      if (Math.abs(delta) >= ELEVATION_THRESHOLD_M) {
        if (delta > 0) elevationGain += delta;
        else elevationLoss += -delta;
        ref = elevations[i].ele;
      }
    }
  }

  const d = distanceKm > 0 ? distanceKm : 1;
  const climbPerKm = elevationGain / d;
  const netDropPerKm =
    startElevation !== null && endElevation !== null
      ? (startElevation - endElevation) / d
      : (elevationLoss - elevationGain) / d;

  return {
    slug,
    name: extractRouteName(gpx, slug),
    distanceKm: Number(distanceKm.toFixed(3)),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    startElevation: startElevation !== null ? Math.round(startElevation) : null,
    endElevation: endElevation !== null ? Math.round(endElevation) : null,
    climbPerKm: Number(climbPerKm.toFixed(2)),
    netDropPerKm: Number(netDropPerKm.toFixed(2)),
    terrain: terrainLabel(climbPerKm),
    pointCount: points.length,
    hasElevationData,
    source: `${slug}.gpx`,
    measured: true,
    retrievedAt: new Date().toISOString(),
  };
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const inputDir = resolve(args[0] ?? "data/race-courses");
  const outputFile = resolve(args[1] ?? "data/race-references.json");

  if (!existsSync(inputDir)) {
    console.error(`Input dir not found: ${inputDir}`);
    console.error(
      "Create it and drop course GPX files in as <slug>.gpx, then rerun."
    );
    process.exit(1);
  }

  const files = readdirSync(inputDir).filter((f) => f.toLowerCase().endsWith(".gpx"));
  if (files.length === 0) {
    console.error(`No .gpx files in ${inputDir}`);
    process.exit(1);
  }

  const records: RaceReferenceRecord[] = [];
  for (const file of files) {
    const slug = basename(file, ".gpx");
    try {
      const gpx = readFileSync(join(inputDir, file), "utf8");
      const record = analyzeGpx(gpx, slug);
      records.push(record);
      console.log(
        `✓ ${slug}: ${record.distanceKm} km, ${record.climbPerKm} m/km climb, ` +
          `net ${record.netDropPerKm} m/km (${record.terrain})`
      );
    } catch (err) {
      console.error(`✗ ${slug}: ${(err as Error).message}`);
    }
  }

  records.sort((a, b) => a.climbPerKm - b.climbPerKm);
  writeFileSync(outputFile, JSON.stringify(records, null, 2) + "\n");
  console.log(`\nWrote ${records.length} race references → ${outputFile}`);
}

main();
