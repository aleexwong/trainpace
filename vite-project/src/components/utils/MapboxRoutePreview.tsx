import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapboxgl: any;
  }
}

interface RoutePoint {
  lat: number;
  lng: number;
}

interface InteractiveMapboxPreviewProps {
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

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN";

// Global flag to track if Mapbox is loaded
let mapboxLoaded = false;
let mapboxLoadPromise: Promise<void> | null = null;

const loadMapbox = (): Promise<void> => {
  if (mapboxLoaded) return Promise.resolve();
  if (mapboxLoadPromise) return mapboxLoadPromise;

  mapboxLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.mapboxgl) {
      mapboxLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.integrity =
      "sha384-8KK5cWPPo2oOBnNju6hBjkoEm4NfYNKN8IoLYBPvwhPZMi9d/nS8HbUA1JyRbxIw";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      mapboxLoaded = true;
      resolve();
    };
    script.onerror = reject;

    const link = document.createElement("link");
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    link.rel = "stylesheet";
    link.integrity =
      "sha384-SDYx9Nwa5fE1fRuBplOPejrcbPOK/ql0Uym6hsGsTvnlC784P5LZhBJIbo8O/O+0";
    link.crossOrigin = "anonymous";

    document.head.appendChild(link);
    document.head.appendChild(script);
  });

  return mapboxLoadPromise;
};

const InteractiveMapboxPreview: React.FC<InteractiveMapboxPreviewProps> = ({
  routePoints,
  height = "300px",
  width = "100%",
  showStartEnd = true,
  className = "",
  lineColor = "#ff0000",
  lineWidth = 4,
  mapStyle = "mapbox://styles/mapbox/light-v11",
  padding = 20,
  interactive = true,
  minZoom = 10,
  maxZoom = 16,
  scrollZoom = true,
  doubleClickZoom = true,
  boxZoom = true,
  touchZoomRotate = true,
  highlightPoint = null,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightMarker = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !routePoints?.length) return;

    const initializeMap = async () => {
      try {
        await loadMapbox();

        if (map.current) return; // Map already initialized

        const mapboxgl = window.mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Calculate bounds
        const lats = routePoints.map((p) => p.lat);
        const lngs = routePoints.map((p) => p.lng);
        const bounds = new mapboxgl.LngLatBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        );

        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: mapStyle,
          bounds: bounds,
          fitBoundsOptions: { padding },
          interactive,
          minZoom,
          maxZoom,
          scrollZoom,
          doubleClickZoom,
          boxZoom,
          touchZoomRotate,
        });

        map.current.on("load", () => {
          // Add route line
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routePoints.map((p) => [p.lng, p.lat]),
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

          if (showStartEnd && routePoints.length > 1) {
            const start = routePoints[0];
            const end = routePoints[routePoints.length - 1];

            // Add start marker
            new mapboxgl.Marker({ color: "#27ae60" })
              .setLngLat([start.lng, start.lat])
              .addTo(map.current);

            // Add end marker
            new mapboxgl.Marker({ color: "#e74c3c" })
              .setLngLat([end.lng, end.lat])
              .addTo(map.current);
          }
        });
        
      } catch (error) {
        console.error("Failed to load Mapbox:", error);
      }
    };

    initializeMap();

    return () => {
      if (highlightMarker.current) {
        highlightMarker.current.remove();
        highlightMarker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePoints, showStartEnd, lineColor, lineWidth, mapStyle, padding, interactive]);

  // Move/show/hide the highlight marker without reinitializing the map.
  useEffect(() => {
    const mapboxgl = window.mapboxgl;
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
  }, [highlightPoint]);

  if (!routePoints?.length) {
    return (
      <div
        className={`bg-gray-100 rounded-md flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <div className="text-gray-400 text-sm">No route data</div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={`relative rounded-md overflow-hidden ${className}`}
      style={{ height, width }}
    />
  );
};

export default InteractiveMapboxPreview;
