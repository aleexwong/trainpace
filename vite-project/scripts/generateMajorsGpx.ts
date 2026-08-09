/**
 * Generates the GPX course files served at /gpx/majors/<key>.gpx and consumed by
 * the World Majors globe (src/features/majors).
 *
 * Source of the coordinates is `src/data/marathon-data.json`, the same course
 * points the preview-route pages have always drawn. Those points are a coarse
 * outline — 13-29 points for a 42 km course — so the files are written as
 * "approximate course outline", never as surveyed course data. Anyone holding a
 * real course GPX can overwrite the file in public/gpx/majors/ and the globe
 * picks it up with no code change: geometry is read from the file, while the
 * stats shown next to the map come from the race registry.
 *
 * Run with: npm run generate-majors-gpx
 */

import fs from "fs";
import path from "path";

import marathonData from "../src/data/marathon-data.json";

interface CoursePoint {
  lat: number;
  lng: number;
  ele?: number;
}

interface MarathonEntry {
  name: string;
  city: string;
  country: string;
  website?: string;
  thumbnailPoints?: CoursePoint[];
}

const OUT_DIR = path.resolve(process.cwd(), "public", "gpx", "majors");

const DISCLAIMER =
  "Approximate course outline for map display, generated from TrainPace course " +
  "preview data. Simplified to a few dozen points and not a surveyed or " +
  "certified course file - do not use for navigation or course measurement.";

/** Escape the five XML predefined entities so names/URLs can't break the document. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Trim float noise without moving a point more than ~1cm. */
function coord(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function buildGpx(key: string, race: MarathonEntry): string | null {
  const points = race.thumbnailPoints ?? [];
  if (points.length < 2) {
    console.warn(`Skipping ${key}: needs at least 2 course points`);
    return null;
  }

  const trackPoints = points
    .map((p) => {
      const ele =
        typeof p.ele === "number" && Number.isFinite(p.ele)
          ? `<ele>${Number(p.ele.toFixed(1))}</ele>`
          : "";
      return `      <trkpt lat="${coord(p.lat)}" lon="${coord(p.lng)}">${ele}</trkpt>`;
    })
    .join("\n");

  const link = race.website
    ? `    <link href="${xmlEscape(race.website)}">\n      <text>Official race website</text>\n    </link>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrainPace" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${xmlEscape(race.name)}</name>
    <desc>${xmlEscape(DISCLAIMER)}</desc>
${link}    <keywords>${xmlEscape(`${race.city}, ${race.country}, marathon, course outline`)}</keywords>
  </metadata>
  <trk>
    <name>${xmlEscape(race.name)}</name>
    <type>marathon</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>
`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const races = marathonData as unknown as Record<string, MarathonEntry>;
  let written = 0;

  for (const [key, race] of Object.entries(races)) {
    const gpx = buildGpx(key, race);
    if (!gpx) continue;

    fs.writeFileSync(path.join(OUT_DIR, `${key}.gpx`), gpx, "utf8");
    written += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Wrote ${written} GPX course files to ${OUT_DIR}`);
}

main();
