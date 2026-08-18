/**
 * Mapbox configuration
 *
 * Every Mapbox request in the app is billed against a single public token, so
 * the knobs that decide how often we are allowed to spend it live here rather
 * than being scattered across components.
 */

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

export const hasMapboxToken = (): boolean => MAPBOX_TOKEN.length > 0;

/** Pinned GL JS version loaded from the Mapbox CDN. */
export const MAPBOX_GL_VERSION = "v3.8.0";

/** Style used for interactive GL maps. */
export const DEFAULT_GL_STYLE = "mapbox://styles/mapbox/outdoors-v12";

/** Style id (owner/style) used for Static Images API requests. */
export const DEFAULT_STATIC_STYLE = "mapbox/outdoors-v12";

/** Mapbox rejects Static Images requests whose URL exceeds this length. */
export const STATIC_URL_MAX_LENGTH = 8192;

/** Static Images API caps each dimension at 1280px (before the @2x factor). */
export const STATIC_IMAGE_MAX_DIMENSION = 1280;

/**
 * What we meter. Mapbox prices these very differently: a GL session is a
 * "map load", a static image is a single API request, and geocoding is billed
 * per lookup.
 */
export type MapboxRequestKind = "gl-session" | "static-image" | "geocoding";

export interface RateWindow {
  /** Maximum requests allowed inside the window. */
  max: number;
  windowMs: number;
}

export interface KindLimits {
  /** Stops a burst of reloads (the F5-on-the-same-page case). */
  burst: RateWindow;
  /** Stops a slow drip that would still add up over a session. */
  sustained: RateWindow;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Limits are per browser, not per page. They are deliberately well above what
 * ordinary use needs: a visitor reading three race pages and opening one
 * interactive map spends 3 static images and 1 GL session.
 */
export const MAPBOX_LIMITS: Record<MapboxRequestKind, KindLimits> = {
  "gl-session": {
    burst: { max: 4, windowMs: 30_000 },
    sustained: { max: 40, windowMs: HOUR },
  },
  "static-image": {
    burst: { max: 12, windowMs: 30_000 },
    sustained: { max: 120, windowMs: HOUR },
  },
  // One reverse lookup per poster the user builds, and the caller memoizes by
  // rounded coordinate, so anything past a handful is a loop.
  geocoding: {
    burst: { max: 6, windowMs: 30_000 },
    sustained: { max: 60, windowMs: HOUR },
  },
};

/** localStorage key holding the rolling request log. */
export const BUDGET_STORAGE_KEY = "trainpace.mapbox.budget.v1";

/** IndexedDB names for the rendered static-map cache. */
export const IMAGE_CACHE_DB = "trainpace-mapbox-cache";
export const IMAGE_CACHE_STORE = "static-maps";
export const IMAGE_CACHE_VERSION = 1;

/** How long a cached static map stays valid. Course maps change rarely. */
export const IMAGE_CACHE_TTL_MS = 7 * 24 * HOUR;

/** Cache ceilings; whichever is hit first triggers LRU eviction. */
export const IMAGE_CACHE_MAX_ENTRIES = 60;
export const IMAGE_CACHE_MAX_BYTES = 12 * 1024 * 1024;
