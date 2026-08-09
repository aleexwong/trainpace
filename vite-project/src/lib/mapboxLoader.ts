/**
 * Loads Mapbox GL JS from the CDN on demand.
 *
 * Mapbox is not an npm dependency here — it is injected at runtime so pages that
 * never show a map don't pay for it. The loader is a module-level singleton, and
 * it short-circuits when `window.mapboxgl` is already present, so a session that
 * has visited another map page reuses whatever version that page injected
 * instead of loading a second copy.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapboxgl: any;
  }
}

const MAPBOX_GL_VERSION = "3.8.0";

export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

let loadPromise: Promise<void> | null = null;

export function loadMapboxGl(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mapbox GL requires a browser environment"));
  }
  if (window.mapboxgl) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.href = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css`;
    link.rel = "stylesheet";
    link.crossOrigin = "anonymous";

    const script = document.createElement("script");
    script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.js`;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      loadPromise = null;
      reject(new Error("Failed to load Mapbox GL JS"));
    };

    document.head.appendChild(link);
    document.head.appendChild(script);
  });

  return loadPromise;
}
