/**
 * Minimal structural types for the Mapbox GL JS surface we actually use.
 *
 * GL JS is loaded from the CDN, so it brings no types with it. Declaring the
 * whole thing `any` costs real checking: `map.addLayer({ padnt: {...} })` would
 * compile, and every call site inherits `any` from there.
 *
 * This is deliberately partial — add members here as call sites need them
 * rather than widening anything back to `any`.
 */

export type LngLatTuple = [number, number];

export interface GeoJsonLineSource {
  type: "geojson";
  data: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: { type: "LineString"; coordinates: LngLatTuple[] };
  };
}

export interface LineLayerSpec {
  id: string;
  type: "line";
  source: string;
  layout?: { "line-join"?: string; "line-cap"?: string };
  paint?: { "line-color"?: string; "line-width"?: number };
}

export interface MapboxGlError {
  error?: { message?: string };
  [key: string]: unknown;
}

export interface MapOptions {
  container: HTMLElement;
  style: string;
  bounds?: MapboxLngLatBounds;
  center?: LngLatTuple;
  zoom?: number;
  fitBoundsOptions?: { padding?: number };
  interactive?: boolean;
  minZoom?: number;
  maxZoom?: number;
  scrollZoom?: boolean;
  doubleClickZoom?: boolean;
  boxZoom?: boolean;
  touchZoomRotate?: boolean;
  preserveDrawingBuffer?: boolean;
}

/** Only the events we bind. */
export type MapEvent = "load" | "error" | "moveend" | "styledata" | "idle";

export interface MapboxMap {
  on(event: MapEvent, handler: (event: MapboxGlError) => void): void;
  once(event: MapEvent, handler: (event: MapboxGlError) => void): void;
  fire(event: MapEvent): void;
  addSource(id: string, source: GeoJsonLineSource): void;
  removeSource(id: string): void;
  getSource(id: string): unknown;
  addLayer(layer: LineLayerSpec): void;
  removeLayer(id: string): void;
  getLayer(id: string): unknown;
  getStyle(): { sprite?: string } | undefined;
  setStyle(style: string): void;
  setPaintProperty(layer: string, property: string, value: string | number): void;
  triggerRepaint(): void;
  isStyleLoaded(): boolean;
  loaded(): boolean;
  getCanvas(): HTMLCanvasElement;
  remove(): void;
}

export interface MapboxMarker {
  setLngLat(lngLat: LngLatTuple): MapboxMarker;
  addTo(map: MapboxMap): MapboxMarker;
  remove(): void;
}

export interface MapboxLngLatBounds {
  readonly _brand?: never;
}

/** The `window.mapboxgl` namespace object. */
export interface MapboxGl {
  accessToken: string;
  Map: new (options: MapOptions) => MapboxMap;
  Marker: new (options?: { color?: string }) => MapboxMarker;
  LngLatBounds: new (sw: LngLatTuple, ne: LngLatTuple) => MapboxLngLatBounds;
}
