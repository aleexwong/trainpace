import { useEffect, useMemo, useRef, useState } from "react";
import { Globe2, Loader2, TriangleAlert } from "lucide-react";

import { MAPBOX_TOKEN, loadMapboxGl } from "@/lib/mapboxLoader";

import { TIER_COLOR } from "../races";
import type { MajorRace, RoutePoint, RouteStatus } from "../types";
import { boundsOf, toLineStringCoordinates } from "../utils";

const HOME_VIEW = { center: [10, 25] as [number, number], zoom: 1.4 };
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
/**
 * The shipped course files are simplified outlines, so the camera stops short of
 * street level — zooming further would imply a precision the line doesn't have.
 */
const MAX_COURSE_ZOOM = 11.5;
const SPIN_DEGREES_PER_TICK = 5;
/** Once the viewer has zoomed in this far, drifting the camera is just annoying. */
const SPIN_MAX_ZOOM = 3;
/**
 * Below this zoom the featured courses are hidden and only the majors show.
 * Measured at the globe view: Amsterdam and Rotterdam land 1.8px apart there,
 * so every marker in that cluster is a coin-flip to click.
 */
const FEATURED_MARKER_MIN_ZOOM = 3;

const ROUTE_SOURCE = "majors-route";
const ENDPOINT_SOURCE = "majors-route-endpoints";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapboxMap = any;

interface GlobeMapProps {
  races: MajorRace[];
  selectedRace: MajorRace | null;
  routePoints: RoutePoint[];
  routeStatus: RouteStatus;
  routeError: string | null;
  onSelectRace: (id: string) => void;
}

function emptyFeatureCollection() {
  return { type: "FeatureCollection" as const, features: [] };
}

export default function GlobeMap({
  races,
  selectedRace,
  routePoints,
  routeStatus,
  routeError,
  onSelectRace,
}: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const spinEnabledRef = useRef(false);
  const spinGlobeRef = useRef<(() => void) | null>(null);
  const hasFlownRef = useRef(false);
  // Mirrors mapReady for handlers registered once, which can't see the state.
  const mapReadyRef = useRef(false);
  const onSelectRaceRef = useRef(onSelectRace);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [featuredVisible, setFeaturedVisible] = useState(false);

  const racesById = useMemo(
    () => new Map(races.map((race) => [race.id, race])),
    [races]
  );

  // Markers are built once, so let their click handler read the latest callback
  // instead of tearing every marker down when the parent re-renders.
  useEffect(() => {
    onSelectRaceRef.current = onSelectRace;
  }, [onSelectRace]);

  // Create the globe. Runs once — subsequent updates go through the effects below.
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    let cancelled = false;

    const init = async () => {
      try {
        await loadMapboxGl();
        if (cancelled || !containerRef.current) return;

        const mapboxgl = window.mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          projection: "globe",
          center: HOME_VIEW.center,
          zoom: HOME_VIEW.zoom,
          minZoom: 0.8,
          maxZoom: 14,
          // Keeps page scrolling intact: zoom needs ctrl/⌘ + wheel, pan needs two fingers.
          cooperativeGestures: true,
          attributionControl: true,
        });
        mapRef.current = map;

        if (import.meta.env.DEV) {
          // Debug handle so browser-verification scripts can read the camera and
          // source state. Dead code in production builds.
          (window as unknown as { __globeMap?: MapboxMap }).__globeMap = map;
        }

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

        // Idle attract loop: drift west until the viewer takes over or picks a race.
        const spinGlobe = () => {
          if (!spinEnabledRef.current || document.visibilityState === "hidden") return;
          if (map.getZoom() > SPIN_MAX_ZOOM) return;

          const center = map.getCenter();
          center.lng -= SPIN_DEGREES_PER_TICK;
          map.easeTo({ center, duration: 1000, easing: (n: number) => n });
        };

        // The loop is driven by moveend, and the hidden-tab check above breaks
        // that chain — the visibilitychange effect below restarts it.
        spinGlobeRef.current = spinGlobe;

        const stopSpin = () => {
          spinEnabledRef.current = false;
        };

        // Same value re-set is a no-op re-render, so this can fire per frame.
        const syncFeaturedVisibility = () =>
          setFeaturedVisible(map.getZoom() >= FEATURED_MARKER_MIN_ZOOM);

        map.on("zoom", syncFeaturedVisibility);
        map.on("moveend", spinGlobe);
        map.on("mousedown", stopSpin);
        map.on("touchstart", stopSpin);
        map.on("wheel", stopSpin);

        map.on("error", (event: { error?: { message?: string; status?: number } }) => {
          console.error("Mapbox error:", event?.error);

          // Before the style loads, an error means the map is never coming up:
          // a rejected token, a blocked api.mapbox.com, an offline client. "load"
          // won't fire, so without this the loading overlay spins forever. Once
          // the map is up, a single failed tile must not tear it down.
          if (mapReadyRef.current) return;

          const status = event?.error?.status;
          setMapError(
            status === 401 || status === 403
              ? "Mapbox rejected the access token, so the globe can't load."
              : "The globe could not load. Check your connection and try again."
          );
        });

        map.on("style.load", () => {
          map.setFog({
            color: "rgb(12, 18, 28)",
            "high-color": "rgb(30, 60, 90)",
            "horizon-blend": 0.02,
            "space-color": "rgb(6, 9, 15)",
            "star-intensity": 0.35,
          });

          // dark-v11 paints land and water as two near-identical darks, so at
          // globe zoom the sphere reads as blank — you can't pick out the
          // continents. Push them apart, while staying dark enough for the
          // route line to carry. Guarded by getLayer so a style without these
          // layers (or a future rename) simply keeps its own colours.
          const repaint = (layerId: string, property: string, value: string) => {
            if (map.getLayer(layerId)) map.setPaintProperty(layerId, property, value);
          };

          repaint("land", "background-color", "#2b3d4f");
          repaint("water", "fill-color", "#08131f");
        });

        map.on("load", () => {
          if (cancelled) return;

          map.addSource(ROUTE_SOURCE, {
            type: "geojson",
            data: emptyFeatureCollection(),
          });
          map.addSource(ENDPOINT_SOURCE, {
            type: "geojson",
            data: emptyFeatureCollection(),
          });

          map.addLayer({
            id: "majors-route-glow",
            type: "line",
            source: ROUTE_SOURCE,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 12,
              "line-blur": 8,
              "line-opacity": 0.4,
            },
          });
          map.addLayer({
            id: "majors-route-line",
            type: "line",
            source: ROUTE_SOURCE,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 3,
            },
          });
          map.addLayer({
            id: "majors-route-endpoints",
            type: "circle",
            source: ENDPOINT_SOURCE,
            paint: {
              "circle-radius": 6,
              "circle-color": [
                "match",
                ["get", "kind"],
                "start",
                "#22c55e",
                "#f97316",
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#0b1220",
            },
          });

          mapReadyRef.current = true;
          setMapReady(true);

          const prefersReducedMotion =
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
          if (!prefersReducedMotion) {
            spinEnabledRef.current = true;
            spinGlobe();
          }
        });
      } catch (error) {
        if (cancelled) return;
        setMapError(
          error instanceof Error ? error.message : "Could not load the map"
        );
      }
    };

    init();

    return () => {
      cancelled = true;
      spinEnabledRef.current = false;
      spinGlobeRef.current = null;
      // Markers are torn down by the effect that created them.
      mapRef.current?.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
      setMapReady(false);
    };
  }, []);

  // Hiding the tab stops the spin mid-chain (no easeTo, so no moveend to
  // continue on). Kick it off again when the viewer comes back.
  useEffect(() => {
    const resumeSpin = () => {
      if (document.visibilityState === "visible") spinGlobeRef.current?.();
    };

    document.addEventListener("visibilitychange", resumeSpin);
    return () => document.removeEventListener("visibilitychange", resumeSpin);
  }, []);

  // Keep the canvas sized to its container (sidebar collapse, orientation change).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // One marker per race, created once the style is up.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const mapboxgl = window.mapboxgl;
    const markers = markersRef.current;

    races.forEach((race) => {
      const button = document.createElement("button");
      button.type = "button";
      button.title = `${race.name} — ${race.city}`;
      button.setAttribute("aria-label", `Show the ${race.name} course`);
      button.setAttribute("data-race-marker", race.id);
      // p-0 matters: index.css gives every button 0.6em/1.2em padding, which
      // inflated these dots to 33x18px and made neighbouring cities overlap.
      button.className =
        "block h-3.5 w-3.5 cursor-pointer rounded-full border-2 border-white/80 p-0 shadow-[0_0_12px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:scale-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";
      button.style.backgroundColor = TIER_COLOR[race.tier];
      button.addEventListener("click", () => onSelectRaceRef.current(race.id));

      const marker = new mapboxgl.Marker({ element: button, anchor: "center" })
        .setLngLat(race.center)
        .addTo(mapRef.current);

      markers.set(race.id, marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
    };
  }, [mapReady, races]);

  // Marker emphasis and decluttering. Which markers are even shown depends on
  // zoom, so this runs on selection changes and on crossing the zoom threshold.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement() as HTMLElement;
      const race = racesById.get(id);
      if (!race) return;

      const isSelected = id === selectedRace?.id;
      const isVisible = race.tier === "major" || featuredVisible || isSelected;

      element.style.display = isVisible ? "block" : "none";
      // Deterministic stacking, so a click in a cluster always lands on the
      // marker drawn on top: selected > major > featured.
      element.style.zIndex = isSelected ? "3" : race.tier === "major" ? "2" : "1";
      element.classList.toggle("scale-150", isSelected);
      element.classList.toggle("ring-2", isSelected);
      element.classList.toggle("ring-white/70", isSelected);
    });
  }, [mapReady, selectedRace, featuredVisible, racesById]);

  // Draw the selected course and fly to it; clearing the selection returns to the globe.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const routeSource = map.getSource(ROUTE_SOURCE);
    const endpointSource = map.getSource(ENDPOINT_SOURCE);
    if (!routeSource || !endpointSource) return;

    if (!selectedRace || routePoints.length < 2) {
      routeSource.setData(emptyFeatureCollection());
      endpointSource.setData(emptyFeatureCollection());

      if (!selectedRace && hasFlownRef.current) {
        hasFlownRef.current = false;
        map.flyTo({ ...HOME_VIEW, duration: 1800, essential: true });
      }
      return;
    }

    const coordinates = toLineStringCoordinates(routePoints);
    const color = TIER_COLOR[selectedRace.tier];

    routeSource.setData({
      type: "Feature",
      properties: { color },
      geometry: { type: "LineString", coordinates },
    });

    const start = coordinates[0];
    const finish = coordinates[coordinates.length - 1];
    endpointSource.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { kind: "start" },
          geometry: { type: "Point", coordinates: start },
        },
        {
          type: "Feature",
          properties: { kind: "finish" },
          geometry: { type: "Point", coordinates: finish },
        },
      ],
    });

    const bounds = boundsOf(routePoints);
    if (bounds) {
      spinEnabledRef.current = false;
      hasFlownRef.current = true;
      map.fitBounds(bounds, {
        padding: { top: 64, bottom: 64, left: 48, right: 48 },
        maxZoom: MAX_COURSE_ZOOM,
        duration: 2000,
        essential: true,
      });
    }
  }, [mapReady, selectedRace, routePoints]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        data-testid="globe-map-unavailable"
        className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center"
      >
        <Globe2 className="h-8 w-8 text-slate-500" aria-hidden="true" />
        <p className="text-base font-semibold text-slate-100">
          Interactive globe unavailable
        </p>
        <p className="max-w-sm text-sm text-slate-400">
          The map needs a Mapbox token (<code>VITE_MAPBOX_TOKEN</code>). Every
          course below still links to its full elevation profile and race prep
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        data-testid="globe-map"
        className="h-full w-full rounded-2xl bg-slate-950"
      />

      {!mapReady && !mapError && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/80"
        >
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading globe…
          </span>
        </div>
      )}

      {mapError && (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/90 p-6 text-center"
        >
          <p className="flex items-center gap-2 text-sm text-amber-300">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            {mapError}
          </p>
        </div>
      )}

      {(routeStatus === "loading" || routeStatus === "error") && (
        <div
          role={routeStatus === "error" ? "alert" : "status"}
          className="absolute bottom-3 left-3 rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-200 shadow-lg"
        >
          {routeStatus === "loading" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Loading course…
            </span>
          ) : (
            <span className="flex items-center gap-2 text-amber-300">
              <TriangleAlert className="h-3 w-3" aria-hidden="true" />
              {routeError ?? "Course unavailable"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
