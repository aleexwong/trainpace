/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { processGPXUpload } from "./gpxMetaData";
import garminActivity from "./__fixtures__/gpx/garmin-connect-activity.gpx?raw";
import stravaActivity from "./__fixtures__/gpx/strava-activity.gpx?raw";
import stravaRoute from "./__fixtures__/gpx/strava-route.gpx?raw";

// Service-format GPX files: what Garmin Connect and Strava actually hand a
// user, as opposed to the minimal hand-built documents in gpxMetaData.test.ts.
// See __fixtures__/gpx/README.md for where they come from.
//
// Every .gpx in that folder runs through the generic checks below, so a new
// export (Coros, Apple Watch, a user's bug-report file) only needs dropping in.
const allFixtures = import.meta.glob<string>("./__fixtures__/gpx/*.gpx", {
  query: "?raw",
  import: "default",
  eager: true,
});

// ---------------------------------------------------------------------------
// Reference reader
// ---------------------------------------------------------------------------

type RefPoint = { lat: number; lng: number; ele?: number };

/** Read track points with plain regexes, not DOMParser, so the expected
 * values do not share a code path with the module under test. Handles either
 * attribute order and self-closing <trkpt/>. */
function readReference(xml: string): RefPoint[] {
  const points: RefPoint[] = [];
  for (const m of xml.matchAll(/<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/g)) {
    const attrs = m[1];
    const lat = parseFloat(/\blat="([^"]+)"/.exec(attrs)![1]);
    const lng = parseFloat(/\blon="([^"]+)"/.exec(attrs)![1]);
    const eleMatch = /<ele>([^<]+)<\/ele>/.exec(m[2] ?? "");
    const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined;
    points.push({ lat, lng, ...(ele !== undefined && { ele }) });
  }
  return points;
}

function haversineKm(a: RefPoint, b: RefPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function summarise(points: RefPoint[]) {
  let distanceKm = 0;
  let gain = 0;
  let lastEle: number | undefined;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) distanceKm += haversineKm(points[i - 1], points[i]);
    const ele = points[i].ele;
    if (ele === undefined) continue;
    if (lastEle !== undefined && ele > lastEle) gain += ele - lastEle;
    lastEle = ele;
  }
  const eles = points.flatMap((p) => (p.ele === undefined ? [] : [p.ele]));
  return {
    distanceKm,
    gain,
    minEle: eles.length ? Math.min(...eles) : null,
    maxEle: eles.length ? Math.max(...eles) : null,
    minLat: Math.min(...points.map((p) => p.lat)),
    maxLat: Math.max(...points.map((p) => p.lat)),
    minLng: Math.min(...points.map((p) => p.lng)),
    maxLng: Math.max(...points.map((p) => p.lng)),
  };
}

// ---------------------------------------------------------------------------
// Generic checks: every fixture in the folder
// ---------------------------------------------------------------------------

describe("processGPXUpload — every fixture in __fixtures__/gpx", () => {
  const entries = Object.entries(allFixtures);

  it("finds the fixture files (guards against an empty glob passing silently)", () => {
    expect(entries.length).toBeGreaterThanOrEqual(3);
  });

  describe.each(entries)("%s", (_path, xml) => {
    const ref = readReference(xml);
    const want = summarise(ref);
    const { metadata, displayPoints, thumbnailPoints } = processGPXUpload(xml);

    it("reads every track point", () => {
      expect(ref.length).toBeGreaterThan(0);
      expect(metadata.pointCount).toBe(ref.length);
    });

    it("matches the reference distance", () => {
      // metadata rounds to 0.1 km, so it can sit up to 0.05 km away.
      expect(Math.abs(metadata.totalDistance - want.distanceKm)).toBeLessThanOrEqual(0.05 + 1e-9);
    });

    it("matches the reference elevation range and gain", () => {
      expect(metadata.hasElevationData).toBe(want.minEle !== null);
      expect(metadata.minElevation).toBe(want.minEle === null ? null : Math.round(want.minEle));
      expect(metadata.maxElevation).toBe(want.maxEle === null ? null : Math.round(want.maxEle));
      expect(metadata.elevationGain).toBe(Math.round(want.gain));
    });

    it("matches the reference bounds", () => {
      expect(metadata.bounds).toEqual({
        minLat: want.minLat,
        maxLat: want.maxLat,
        minLng: want.minLng,
        maxLng: want.maxLng,
      });
    });

    it("produces finite, capped display and thumbnail points that keep both ends", () => {
      for (const [list, cap] of [
        [displayPoints, 300],
        [thumbnailPoints, 50],
      ] as const) {
        expect(list.length).toBeLessThanOrEqual(cap);
        for (const p of list) {
          expect(Number.isFinite(p.lat) && Number.isFinite(p.lng)).toBe(true);
          if (p.ele !== undefined) expect(Number.isFinite(p.ele)).toBe(true);
        }
        expect(list[0]).toEqual(ref[0]);
        expect(list[list.length - 1]).toEqual(ref[ref.length - 1]);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Garmin Connect activity export
// ---------------------------------------------------------------------------

describe("processGPXUpload — Garmin Connect activity export", () => {
  const { metadata, displayPoints } = processGPXUpload(
    garminActivity,
    "activity_17201234567.gpx"
  );

  it("takes the name from <trk><name>, not the metadata link text 'Garmin Connect'", () => {
    expect(metadata.routeName).toBe("Vancouver Running");
  });

  it("reads all 598 one-second points of a 2 km run", () => {
    expect(metadata.pointCount).toBe(598);
    expect(metadata.totalDistance).toBe(2);
  });

  it("parses Garmin's full binary-expansion coordinates (30+ digit decimals)", () => {
    expect(garminActivity).toContain(
      '<trkpt lat="49.24263046123087406158447265625" lon="-123.1105608679354190826416015625">'
    );
    expect(displayPoints[0].lat).toBe(49.242630461230874);
    expect(displayPoints[0].lng).toBe(-123.11056086793542);
  });

  it("ignores ns3:TrackPointExtension values (atemp 14, hr 108-155, cad ~86) when reading elevation", () => {
    // Course elevation on this stretch is 91-103 m. A parser that read any
    // extension child as <ele> would push min down to 14 or max up past 108.
    expect(metadata.minElevation).toBe(91);
    expect(metadata.maxElevation).toBe(103);
  });
});

// ---------------------------------------------------------------------------
// Strava activity export
// ---------------------------------------------------------------------------

describe("processGPXUpload — Strava activity export", () => {
  const { metadata } = processGPXUpload(stravaActivity, "Sunday_Shakeout.gpx");

  it("decodes the entity and keeps the en dash and emoji in a user-edited name", () => {
    expect(metadata.routeName).toBe("Sunday Shakeout – Queen E & Cambie 🌧️");
  });

  it("reads all 598 points of a 2 km run", () => {
    expect(metadata.pointCount).toBe(598);
    expect(metadata.totalDistance).toBe(2);
  });

  it("ignores gpxtpx:hr / gpxtpx:cad when reading elevation", () => {
    expect(metadata.minElevation).toBe(90);
    expect(metadata.maxElevation).toBe(103);
  });
});

// ---------------------------------------------------------------------------
// Strava route export (route builder: no timestamps, sparse points)
// ---------------------------------------------------------------------------

describe("processGPXUpload — Strava route export", () => {
  const { metadata, displayPoints, thumbnailPoints } = processGPXUpload(stravaRoute);

  it("parses a route with no <time> elements", () => {
    expect(stravaRoute).not.toContain("<time>");
    expect(metadata.pointCount).toBe(48);
    expect(metadata.totalDistance).toBe(5);
  });

  it("uses the route name", () => {
    expect(metadata.routeName).toBe("BMO Marathon – First 5k");
  });

  it("keeps every point of a route already under both caps", () => {
    expect(displayPoints).toHaveLength(48);
    expect(thumbnailPoints).toHaveLength(48);
  });
});
