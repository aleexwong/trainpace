/**
 * GPX route analysis — distance, elevation, simplified point sets.
 * Isomorphic: uses fast-xml-parser, so it runs in Node and the browser alike
 * (unlike the web app's original DOMParser implementation).
 */

import { XMLParser } from "fast-xml-parser";
import type { GpxPoint, GpxMetadata } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
});

/** Recursively collect every <trkpt> node, regardless of trk/trkseg nesting. */
function collectTrkpts(node: unknown, out: Record<string, unknown>[]): void {
  if (node === null || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "trkpt") {
      const arr = Array.isArray(value) ? value : [value];
      for (const pt of arr) {
        if (pt && typeof pt === "object") out.push(pt as Record<string, unknown>);
      }
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) value.forEach((item) => collectTrkpts(item, out));
      else collectTrkpts(value, out);
    }
  }
}

/** Find the first string value for a key anywhere in the parsed tree. */
function findFirst(node: unknown, key: string): string | null {
  if (node === null || typeof node !== "object") return null;
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === key) {
      if (typeof v === "string") return v.trim();
      if (typeof v === "number") return String(v);
    }
    if (v && typeof v === "object") {
      const found = findFirst(v, key);
      if (found) return found;
    }
  }
  return null;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

/** Parse raw GPX XML into ordered track points. */
export function parseGpxToPoints(gpxContent: string): GpxPoint[] {
  const doc = parser.parse(gpxContent);
  const raw: Record<string, unknown>[] = [];
  collectTrkpts(doc, raw);

  return raw.map((pt) => {
    const lat = toNumber(pt["@_lat"]) ?? 0;
    const lng = toNumber(pt["@_lon"]) ?? 0;
    const ele = toNumber(pt["ele"]);
    return ele !== undefined ? { lat, lng, ele } : { lat, lng };
  });
}

/** Compute summary metadata (distance, elevation, bounds) from a GPX string. */
export function extractGpxMetadata(
  gpxContent: string,
  filename?: string
): GpxMetadata {
  const doc = parser.parse(gpxContent);
  const points: Record<string, unknown>[] = [];
  collectTrkpts(doc, points);

  if (points.length === 0) {
    throw new Error("No track points found in GPX");
  }

  const fallbackName = filename
    ? filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
    : "Unnamed Route";
  const routeName = findFirst(doc, "name") || fallbackName;

  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  let totalDistance = 0;
  let elevationGain = 0;
  let maxElevation = -Infinity;
  let minElevation = Infinity;
  let lastElevation: number | null = null;
  let lastPoint: { lat: number; lng: number } | null = null;

  for (const pt of points) {
    const lat = toNumber(pt["@_lat"]) ?? 0;
    const lng = toNumber(pt["@_lon"]) ?? 0;
    const ele = toNumber(pt["ele"]) ?? null;

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);

    if (lastPoint) {
      const R = 6371; // km
      const dLat = ((lat - lastPoint.lat) * Math.PI) / 180;
      const dLng = ((lng - lastPoint.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lastPoint.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    if (ele !== null && !Number.isNaN(ele)) {
      if (lastElevation !== null && ele > lastElevation) {
        elevationGain += ele - lastElevation;
      }
      maxElevation = Math.max(maxElevation, ele);
      minElevation = Math.min(minElevation, ele);
      lastElevation = ele;
    }

    lastPoint = { lat, lng };
  }

  return {
    routeName,
    totalDistance: Math.round(totalDistance * 10) / 10,
    elevationGain: Math.round(elevationGain),
    maxElevation: maxElevation > -Infinity ? Math.round(maxElevation) : null,
    minElevation: minElevation < Infinity ? Math.round(minElevation) : null,
    pointCount: points.length,
    bounds: { minLat, maxLat, minLng, maxLng },
    hasElevationData: maxElevation > -Infinity,
  };
}

// --- Douglas-Peucker simplification -----------------------------------------

function perpendicularDistance(
  point: GpxPoint,
  lineStart: GpxPoint,
  lineEnd: GpxPoint
): number {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  if (lenSq === 0) return Math.sqrt(A * A + B * B);

  const param = dot / lenSq;
  let xx: number, yy: number;
  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }
  const dx = point.lat - xx;
  const dy = point.lng - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function douglasPeucker(points: GpxPoint[], tolerance: number): GpxPoint[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

export function simplifyToMaxPoints(points: GpxPoint[], maxPoints: number): GpxPoint[] {
  if (points.length <= maxPoints) return points;

  let tolerance = 0.0001;
  let simplified = douglasPeucker(points, tolerance);
  while (simplified.length > maxPoints && tolerance < 0.01) {
    tolerance *= 1.5;
    simplified = douglasPeucker(points, tolerance);
  }

  if (simplified.length > maxPoints) {
    const step = Math.floor(points.length / maxPoints);
    simplified = points.filter((_, index) => index % step === 0).slice(0, maxPoints);
    if (simplified.length >= 2) {
      simplified[0] = points[0];
      simplified[simplified.length - 1] = points[points.length - 1];
    } else if (simplified.length === 1) {
      simplified[0] = points[0];
    }
  }
  return simplified;
}

/** Full GPX analysis: metadata plus simplified point sets for display/thumbnails. */
export function analyzeGpx(
  gpxContent: string,
  filename?: string
): {
  metadata: GpxMetadata;
  displayPoints: GpxPoint[];
  thumbnailPoints: GpxPoint[];
} {
  const allPoints = parseGpxToPoints(gpxContent);
  const metadata = extractGpxMetadata(gpxContent, filename);
  return {
    metadata,
    displayPoints: simplifyToMaxPoints(allPoints, 300),
    thumbnailPoints: simplifyToMaxPoints(allPoints, 50),
  };
}
