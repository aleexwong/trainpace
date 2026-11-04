/**
 * Mapbox Static Images API URL builder
 *
 * A static image is one cheap, cacheable HTTP request instead of a GL JS map
 * load, and it renders as a plain <img> — so it survives prerendering, gets
 * real alt text, and costs nothing when the browser or our own IndexedDB cache
 * already has it.
 */

import {
  DEFAULT_STATIC_STYLE,
  MAPBOX_TOKEN,
  STATIC_IMAGE_MAX_DIMENSION,
  STATIC_URL_MAX_LENGTH,
} from "./config";
import { encodePolyline, getRouteBounds, simplifyRoute, type RoutePoint } from "./polyline";

export interface StaticMapOptions {
  routePoints: RoutePoint[];
  /** CSS pixels. Clamped to the Static Images API's 1280px ceiling. */
  width: number;
  height: number;
  /** Style id in `owner/style` form, e.g. `mapbox/outdoors-v12`. */
  style?: string;
  /** Route line colour, hex with or without the leading `#`. */
  lineColor?: string;
  lineWidth?: number;
  /** Request a 2x asset for retina screens. */
  retina?: boolean;
  /** Padding between the route and the image edge, in pixels. */
  padding?: number;
  showStartEnd?: boolean;
}

export interface StaticMapRequest {
  /** Full request URL, token included. Never render this server-side. */
  url: string;
  /** Stable cache key — the URL with the token stripped out. */
  cacheKey: string;
  /** How many route points survived simplification. */
  pointCount: number;
}

const normalizeHex = (color: string): string => {
  const hex = color.replace("#", "").trim();
  return /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex) ? hex : "c2410c";
};

/**
 * Quantize a measured dimension so that a few pixels of layout drift (a
 * scrollbar appearing, a window nudge) reuses the cached image instead of
 * buying a new one.
 */
export const quantizeDimension = (value: number, step = 40): number => {
  const clamped = Math.max(step, Math.min(STATIC_IMAGE_MAX_DIMENSION, value));
  return Math.min(
    STATIC_IMAGE_MAX_DIMENSION,
    Math.ceil(clamped / step) * step
  );
};

/**
 * Mapbox caps `padding` at less than half of each dimension; overshooting
 * returns a 422 rather than clamping for us.
 */
const safePadding = (padding: number, width: number, height: number): number => {
  const ceiling = Math.floor(Math.min(width, height) / 2) - 1;
  return Math.max(0, Math.min(padding, ceiling));
};

/**
 * Build the Static Images request for a route, thinning the geometry until the
 * URL fits inside Mapbox's 8192-character limit. Returns null when there is no
 * token or no usable geometry.
 */
export function buildStaticMapRequest(
  options: StaticMapOptions
): StaticMapRequest | null {
  const {
    routePoints,
    width,
    height,
    style = DEFAULT_STATIC_STYLE,
    lineColor = "#c2410c",
    lineWidth = 4,
    retina = true,
    padding = 24,
    showStartEnd = true,
  } = options;

  if (!MAPBOX_TOKEN) return null;

  // Filter once, up front. Deriving the bounds from clean points but the pins
  // from the raw array is how you get `pin-s+27ae60(NaN,NaN)` and a 422 on a
  // request whose budget slot is already spent.
  const points = (routePoints ?? []).filter(
    (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)
  );

  const bounds = getRouteBounds(points);
  if (!bounds || points.length < 2) return null;

  const imageWidth = Math.round(Math.min(STATIC_IMAGE_MAX_DIMENSION, Math.max(1, width)));
  const imageHeight = Math.round(Math.min(STATIC_IMAGE_MAX_DIMENSION, Math.max(1, height)));
  const stroke = normalizeHex(lineColor);
  const size = `${imageWidth}x${imageHeight}${retina ? "@2x" : ""}`;

  const first = points[0];
  const last = points[points.length - 1];
  const markers =
    showStartEnd
      ? [
          `pin-s+27ae60(${first.lng.toFixed(5)},${first.lat.toFixed(5)})`,
          `pin-s+e74c3c(${last.lng.toFixed(5)},${last.lat.toFixed(5)})`,
        ]
      : [];

  const query = new URLSearchParams({
    padding: String(safePadding(padding, imageWidth, imageHeight)),
    access_token: MAPBOX_TOKEN,
  });

  // Start generous and halve until the URL fits. Preview maps are small enough
  // that 900 points already exceeds one point per pixel of route.
  for (let maxPoints = 900; maxPoints >= 24; maxPoints = Math.floor(maxPoints / 2)) {
    const simplified = simplifyRoute(points, maxPoints);
    if (simplified.length < 2) break;

    const path = `path-${lineWidth}+${stroke}-0.9(${encodeURIComponent(
      encodePolyline(simplified)
    )})`;
    // Overlays draw in the order given, so pins land on top of the line.
    const overlay = [path, ...markers].join(",");
    const base = `https://api.mapbox.com/styles/v1/${style}/static/${overlay}/auto/${size}`;
    const url = `${base}?${query.toString()}`;

    if (url.length <= STATIC_URL_MAX_LENGTH) {
      return {
        url,
        cacheKey: `${base}?padding=${query.get("padding")}`,
        pointCount: simplified.length,
      };
    }
  }

  return null;
}
