/**
 * Mapbox GL JS loader
 *
 * One shared, deduplicated CDN load for the whole app. Previously the poster
 * feature and the route preview each shipped their own copy of this, pinned to
 * different GL versions, which meant whichever mounted first decided what the
 * other one got.
 *
 * Loading the script is free. Constructing a `mapboxgl.Map` is the billable
 * "map load", so callers spend budget at construction time, not here.
 */

import { MAPBOX_GL_VERSION } from "./config";

declare global {
  interface Window {
    // GL JS has no bundled types when loaded from the CDN.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapboxgl: any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapboxGl = any;

let loadPromise: Promise<MapboxGl> | null = null;

export function loadMapboxGl(): Promise<MapboxGl> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Mapbox GL is browser-only"));
  }

  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<MapboxGl>((resolve, reject) => {
    const base = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_GL_VERSION}`;

    if (!document.querySelector(`link[data-mapbox-gl="${MAPBOX_GL_VERSION}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${base}/mapbox-gl.css`;
      link.crossOrigin = "anonymous";
      link.dataset.mapboxGl = MAPBOX_GL_VERSION;
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = `${base}/mapbox-gl.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.mapboxgl) {
        resolve(window.mapboxgl);
      } else {
        loadPromise = null;
        reject(new Error("Mapbox GL loaded but did not register"));
      }
    };
    script.onerror = () => {
      // Let a later mount retry rather than caching the failure forever.
      loadPromise = null;
      script.remove();
      reject(new Error("Failed to load Mapbox GL"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/** True once GL JS is on the page, so a second map costs no extra download. */
export const isMapboxGlLoaded = (): boolean =>
  typeof window !== "undefined" && Boolean(window.mapboxgl);
