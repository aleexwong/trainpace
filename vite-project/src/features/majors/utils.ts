/**
 * World Majors Globe - Pure helpers (GPX parsing, bounds, dates).
 */

import type { MajorRace, RoutePoint } from "./types";

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/**
 * Parse the track points out of a GPX document.
 *
 * Reads `<trkpt>` and falls back to `<rtept>`, which is what some course files
 * published by race organisers use. Points without a usable lat/lon are dropped
 * rather than poisoning the line with NaNs.
 */
export function parseGpxTrackPoints(gpxText: string): RoutePoint[] {
  const parser = new DOMParser();
  const dom = parser.parseFromString(gpxText, "application/xml");

  if (dom.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Course file is not valid GPX");
  }

  const nodes = dom.getElementsByTagName("trkpt").length
    ? dom.getElementsByTagName("trkpt")
    : dom.getElementsByTagName("rtept");

  const points: RoutePoint[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const lat = Number(node.getAttribute("lat"));
    const lng = Number(node.getAttribute("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const eleText = node.getElementsByTagName("ele")[0]?.textContent;
    const ele = eleText === undefined || eleText === null ? NaN : Number(eleText);

    points.push(
      Number.isFinite(ele) ? { lat, lng, ele } : { lat, lng }
    );
  }

  if (points.length < 2) {
    throw new Error("Course file has no usable track points");
  }

  return points;
}

/** GeoJSON `[lng, lat]` pairs, ready for a Mapbox LineString source. */
export function toLineStringCoordinates(points: RoutePoint[]): [number, number][] {
  return points.map((p) => [p.lng, p.lat]);
}

/** `[[west, south], [east, north]]`, the shape Mapbox `fitBounds` wants. */
export function boundsOf(
  points: RoutePoint[]
): [[number, number], [number, number]] | null {
  if (!points.length) return null;

  let west = points[0].lng;
  let east = points[0].lng;
  let south = points[0].lat;
  let north = points[0].lat;

  for (const p of points) {
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
  }

  return [
    [west, south],
    [east, north],
  ];
}

/**
 * Turn a stored race date into an ISO date.
 *
 * `Date.parse` handles "April 20, 2026" in V8 but is engine-dependent for looser
 * forms like "September 2026", so the two shapes we actually store are matched
 * explicitly and built in UTC — no timezone can shift the day.
 */
export function parseRaceDate(raceDate: string): string | null {
  const full = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(raceDate.trim());
  if (full) {
    const month = MONTHS[full[1].toLowerCase()];
    if (month === undefined) return null;
    const day = Number(full[2]);
    if (day < 1 || day > 31) return null;
    return new Date(Date.UTC(Number(full[3]), month, day))
      .toISOString()
      .slice(0, 10);
  }

  const monthOnly = /^([A-Za-z]+)\s+(\d{4})$/.exec(raceDate.trim());
  if (monthOnly) {
    const month = MONTHS[monthOnly[1].toLowerCase()];
    if (month === undefined) return null;
    return new Date(Date.UTC(Number(monthOnly[2]), month, 1))
      .toISOString()
      .slice(0, 10);
  }

  return null;
}

/**
 * Whole days from today until an ISO date, or null when it is unparseable or
 * already past. Both sides are compared at UTC midnight so the count doesn't
 * flicker with the viewer's clock.
 */
export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;

  const target = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(target)) return null;

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((target - today) / 86_400_000);

  return days >= 0 ? days : null;
}

/** "in 12 days" / "race day" for an upcoming date, null once it has passed. */
export function formatCountdown(race: MajorRace, now: Date = new Date()): string | null {
  const days = daysUntil(race.raceDateIso, now);
  if (days === null) return null;
  if (days === 0) return "Race day";
  if (days === 1) return "Tomorrow";
  if (days < 45) return `In ${days} days`;

  const months = Math.round(days / 30);
  return `In ~${months} month${months === 1 ? "" : "s"}`;
}

/** Signed net elevation change, e.g. "-140m" for a net-downhill course. */
export function formatNetElevation(race: MajorRace): string {
  const net = Math.round(race.elevationGainM - race.elevationLossM);
  return `${net > 0 ? "+" : ""}${net}m`;
}
