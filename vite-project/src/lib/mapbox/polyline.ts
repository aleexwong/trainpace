/**
 * Route geometry helpers for Static Images API overlays
 *
 * A course can carry thousands of GPX points; a Static Images URL has to stay
 * under 8KB. These helpers thin a route down to a shape that still reads
 * correctly at preview size, then encode it as a Google-format polyline (the
 * compact geometry format Mapbox accepts in a `path(...)` overlay).
 */

export interface RoutePoint {
  lat: number;
  lng: number;
}

/**
 * Perpendicular distance from `point` to the segment `start`-`end`, in degree
 * space with longitude scaled by cos(lat) so the metric stays roughly
 * isotropic away from the equator.
 */
function perpendicularDistance(
  point: RoutePoint,
  start: RoutePoint,
  end: RoutePoint
): number {
  const scale = Math.cos((point.lat * Math.PI) / 180) || 1;

  const px = (point.lng - start.lng) * scale;
  const py = point.lat - start.lat;
  const dx = (end.lng - start.lng) * scale;
  const dy = end.lat - start.lat;

  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px, py);

  // Project the point onto the segment, clamped to the segment's extent.
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSq));
  return Math.hypot(px - t * dx, py - t * dy);
}

/** Ramer-Douglas-Peucker, iterative so a long route cannot blow the stack. */
function douglasPeucker(points: RoutePoint[], tolerance: number): RoutePoint[] {
  if (points.length < 3) return points;

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack: Array<[number, number]> = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    if (last - first < 2) continue;

    let maxDistance = 0;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const distance = perpendicularDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

/**
 * Reduce a route to at most `maxPoints` while keeping as much of its shape as
 * possible.
 *
 * Tolerance is found by search rather than by a single geometric climb: a
 * climb that overshoots collapses a winding course to a straight line, which
 * is exactly the case a small `maxPoints` hits. The search brackets the
 * tolerance first, then bisects, keeping the densest result that still fits.
 */
export function simplifyRoute(
  points: RoutePoint[],
  maxPoints: number
): RoutePoint[] {
  const clean = points.filter(
    (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)
  );
  if (clean.length <= maxPoints || maxPoints < 2) return clean;

  // Bracket: start below one preview pixel and double until the route fits.
  let low = 0;
  let high = 1e-5;
  let best = douglasPeucker(clean, high);

  for (let i = 0; i < 30 && best.length > maxPoints; i++) {
    low = high;
    high *= 2;
    best = douglasPeucker(clean, high);
  }

  if (best.length > maxPoints) {
    // Pathological geometry — fall back to even sampling.
    const stride = Math.ceil(clean.length / maxPoints);
    const sampled = clean.filter((_, i) => i % stride === 0);
    const last = clean[clean.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
    return sampled;
  }

  // Bisect toward the largest point count that still fits.
  for (let i = 0; i < 14 && best.length < maxPoints; i++) {
    const mid = (low + high) / 2;
    if (mid === low || mid === high) break;

    const candidate = douglasPeucker(clean, mid);
    if (candidate.length > maxPoints) {
      low = mid;
    } else {
      high = mid;
      best = candidate;
    }
  }

  return best;
}

function encodeSignedNumber(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let output = "";

  while (v >= 0x20) {
    output += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  output += String.fromCharCode(v + 63);
  return output;
}

/**
 * Encode points as a Google-format polyline (precision 5), the format Mapbox
 * expects in `path-...(...)`. Deltas are accumulated against the *rounded*
 * previous value so rounding error does not drift along the line.
 */
export function encodePolyline(points: RoutePoint[]): string {
  const factor = 1e5;
  let previousLat = 0;
  let previousLng = 0;
  let encoded = "";

  for (const point of points) {
    const lat = Math.round(point.lat * factor);
    const lng = Math.round(point.lng * factor);

    encoded += encodeSignedNumber(lat - previousLat);
    encoded += encodeSignedNumber(lng - previousLng);

    previousLat = lat;
    previousLng = lng;
  }

  return encoded;
}

/**
 * Cheap identity for a route: enough to notice when the geometry is replaced
 * (e.g. bundled thumbnail points swapped for the fuller Firestore track)
 * without re-running simplification, or re-creating a map, on every render.
 *
 * Callers use this instead of array identity, because a parent that rebuilds
 * its points array each render would otherwise buy a new Mapbox request each
 * time.
 */
export function fingerprintRoute(points: RoutePoint[]): string {
  if (!points?.length) return "0";

  const at = (index: number) => {
    const p = points[index];
    return `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
  };

  return [
    points.length,
    at(0),
    at(Math.floor(points.length / 2)),
    at(points.length - 1),
  ].join("|");
}

export interface RouteBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function getRouteBounds(points: RoutePoint[]): RouteBounds | null {
  const valid = points.filter(
    (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)
  );
  if (valid.length === 0) return null;

  return valid.reduce<RouteBounds>(
    (acc, p) => ({
      minLat: Math.min(acc.minLat, p.lat),
      maxLat: Math.max(acc.maxLat, p.lat),
      minLng: Math.min(acc.minLng, p.lng),
      maxLng: Math.max(acc.maxLng, p.lng),
    }),
    {
      minLat: valid[0].lat,
      maxLat: valid[0].lat,
      minLng: valid[0].lng,
      maxLng: valid[0].lng,
    }
  );
}
