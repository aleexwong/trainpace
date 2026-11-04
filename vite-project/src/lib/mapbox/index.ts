/**
 * Shared Mapbox layer.
 *
 * Everything that spends the public Mapbox token goes through here: one CDN
 * loader, one rolling request budget, one persistent image cache. See
 * docs/mapbox.md for how the pieces fit together.
 */

export {
  MAPBOX_TOKEN,
  MAPBOX_LIMITS,
  DEFAULT_GL_STYLE,
  DEFAULT_STATIC_STYLE,
  hasMapboxToken,
  type MapboxRequestKind,
} from "./config";

export {
  checkMapboxBudget,
  consumeMapboxBudget,
  getMapboxBudgetSnapshot,
  resetMapboxBudget,
  type BudgetDecision,
  type BudgetDenialReason,
} from "./budget";

export { loadMapboxGl, isMapboxGlLoaded } from "./loader";

export {
  buildStaticMapRequest,
  quantizeDimension,
  type StaticMapOptions,
  type StaticMapRequest,
} from "./staticMap";

export {
  clearMapImageCache,
  getCachedMapImage,
  pruneMapImageCache,
  putCachedMapImage,
} from "./imageCache";

export {
  useStaticRouteMap,
  type StaticMapStatus,
  type StaticRouteMapState,
} from "./useStaticRouteMap";

export {
  encodePolyline,
  fingerprintRoute,
  getRouteBounds,
  simplifyRoute,
  type RoutePoint,
  type RouteBounds,
} from "./polyline";
