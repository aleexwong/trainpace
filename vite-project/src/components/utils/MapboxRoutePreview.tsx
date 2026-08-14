import { useEffect, useMemo, useRef, useState } from "react";

import {
  consumeMapboxBudget,
  DEFAULT_GL_STYLE,
  fingerprintRoute,
  loadMapboxGl,
  MAPBOX_TOKEN,
  type BudgetDenialReason,
  type RoutePoint,
} from "@/lib/mapbox";
import { cn } from "@/lib/utils";
import RouteSketch from "./RouteSketch";

interface MapboxRoutePreviewProps {
  routePoints: RoutePoint[];
  routeName?: string | null;
  height?: string;
  width?: string;
  showStartEnd?: boolean;
  className?: string;
  lineColor?: string;
  lineWidth?: number;
  mapStyle?: string;
  padding?: number;
  interactive?: boolean;
  minZoom?: number;
  maxZoom?: number;
  scrollZoom?: boolean;
  doubleClickZoom?: boolean;
  boxZoom?: boolean;
  touchZoomRotate?: boolean;
  // A point to highlight on the route (e.g. driven by elevation-chart hover).
  // Rendered as a single marker that moves as it changes, removed when null.
  highlightPoint?: RoutePoint | null;
}

type PreviewStatus = "loading" | "ready" | "blocked" | "error";

const blockedMessage = (reason?: BudgetDenialReason): string => {
  if (reason === "no-token") {
    return "Interactive map unavailable — showing the course outline.";
  }
  return "Interactive map paused to protect our map quota — showing the course outline.";
};

/**
 * A live Mapbox GL map of a route.
 *
 * Every mount of this component is a billable Mapbox map load, so it takes a
 * slot from the shared request budget before constructing the map and renders
 * a tile-free `RouteSketch` when there is none to take. Prefer
 * `StaticRouteMap` wherever the map does not need to be panned or zoomed.
 */
export function MapboxRoutePreview({
  routePoints,
  routeName,
  height = "300px",
  width = "100%",
  showStartEnd = true,
  className = "",
  lineColor = "#059669",
  lineWidth = 4,
  mapStyle = DEFAULT_GL_STYLE,
  padding = 20,
  interactive = true,
  minZoom = 3,
  maxZoom = 16,
  scrollZoom = true,
  doubleClickZoom = true,
  boxZoom = true,
  touchZoomRotate = true,
  highlightPoint = null,
}: MapboxRoutePreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightMarker = useRef<any>(null);

  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [blockedReason, setBlockedReason] = useState<BudgetDenialReason>();

  // A parent that rebuilds its points array each render must not re-create the
  // map (and spend another map load), so the effect keys off the geometry, not
  // the array's identity.
  const routeSignature = useMemo(() => fingerprintRoute(routePoints), [routePoints]);
  const routePointsRef = useRef(routePoints);
  routePointsRef.current = routePoints;

  useEffect(() => {
    const points = routePointsRef.current;
    if (!mapContainer.current || !points?.length) return;

    // No token means no map and no reason to pull down GL JS at all.
    if (!MAPBOX_TOKEN) {
      setStatus("blocked");
      setBlockedReason("no-token");
      return;
    }

    let cancelled = false;

    const initializeMap = async () => {
      try {
        const mapboxgl = await loadMapboxGl();
        if (cancelled || !mapContainer.current) return;

        // Spend the budget here rather than at the top of the effect, so the
        // slot is taken if and only if a map is actually constructed. A mount
        // that is torn down first — React StrictMode's double-invoke in dev,
        // or a fast unmount — costs nothing.
        const decision = consumeMapboxBudget("gl-session");
        if (!decision.allowed) {
          setStatus("blocked");
          setBlockedReason(decision.reason);
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const lats = points.map((p) => p.lat);
        const lngs = points.map((p) => p.lng);
        const bounds = new mapboxgl.LngLatBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        );

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: mapStyle,
          bounds,
          fitBoundsOptions: { padding },
          interactive,
          minZoom,
          maxZoom,
          scrollZoom,
          doubleClickZoom,
          boxZoom,
          touchZoomRotate,
        });

        map.current.on("error", () => setStatus("error"));

        map.current.on("load", () => {
          if (cancelled || !map.current) return;

          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: points.map((p) => [p.lng, p.lat]),
              },
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": lineColor,
              "line-width": lineWidth,
            },
          });

          if (showStartEnd && points.length > 1) {
            const start = points[0];
            const end = points[points.length - 1];

            new mapboxgl.Marker({ color: "#27ae60" })
              .setLngLat([start.lng, start.lat])
              .addTo(map.current);

            new mapboxgl.Marker({ color: "#e74c3c" })
              .setLngLat([end.lng, end.lat])
              .addTo(map.current);
          }

          setStatus("ready");
        });
      } catch (error) {
        console.error("Failed to load Mapbox:", error);
        if (!cancelled) setStatus("error");
      }
    };

    initializeMap();

    return () => {
      cancelled = true;
      if (highlightMarker.current) {
        highlightMarker.current.remove();
        highlightMarker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [
    routeSignature,
    showStartEnd,
    lineColor,
    lineWidth,
    mapStyle,
    padding,
    interactive,
    minZoom,
    maxZoom,
    scrollZoom,
    doubleClickZoom,
    boxZoom,
    touchZoomRotate,
  ]);

  // Move/show/hide the highlight marker without reinitializing the map.
  useEffect(() => {
    const mapboxgl = typeof window === "undefined" ? null : window.mapboxgl;
    if (!map.current || !mapboxgl) return;

    if (!highlightPoint) {
      if (highlightMarker.current) {
        highlightMarker.current.remove();
        highlightMarker.current = null;
      }
      return;
    }

    const lngLat = [highlightPoint.lng, highlightPoint.lat];
    if (highlightMarker.current) {
      highlightMarker.current.setLngLat(lngLat);
    } else {
      highlightMarker.current = new mapboxgl.Marker({ color: "#059669" })
        .setLngLat(lngLat)
        .addTo(map.current);
    }
  }, [highlightPoint, status]);

  if (!routePoints?.length) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-md bg-gray-100", className)}
        style={{ height, width }}
      >
        <div className="text-sm text-gray-400">No route data</div>
      </div>
    );
  }

  if (status === "blocked" || status === "error") {
    return (
      <div
        className={cn("overflow-hidden rounded-md", className)}
        style={{ height, width }}
      >
        <RouteSketch
          routePoints={routePoints}
          routeName={routeName}
          lineColor={lineColor}
          lineWidth={lineWidth}
          showStartEnd={showStartEnd}
          note={
            status === "error"
              ? "Map tiles unavailable right now — showing the course outline."
              : blockedMessage(blockedReason)
          }
        />
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={cn("relative overflow-hidden rounded-md bg-stone-50", className)}
      style={{ height, width }}
    />
  );
}

export default MapboxRoutePreview;
