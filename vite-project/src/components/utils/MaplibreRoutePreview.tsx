import React, { useEffect, useRef } from "react";

interface RoutePoint {
  lat: number;
  lng: number;
  ele?: number;
}

interface MaplibreRoutePreviewProps {
  routePoints: RoutePoint[];
  routeName?: string | null;
  height?: string;
  width?: string;
  showStartEnd?: boolean;
  className?: string;
  lineColor?: string;
  lineWidth?: number;
  padding?: number;
  interactive?: boolean;
  minZoom?: number;
  maxZoom?: number;
  terrain3D?: boolean;
  styleUrl?: string;
  pmtilesUrl?: string;
}

// PMTiles archive served from Vercel as a static asset.
// Drop the file at vite-project/public/tiles/world.pmtiles — no token, no Mapbox bill.
// Vercel serves it with HTTP Range support, which PMTiles needs.
const DEFAULT_PMTILES =
  import.meta.env.VITE_PMTILES_URL || "/tiles/world.pmtiles";

// Protomaps style JSON shipped from /public so it works offline (PWA-friendly).
const DEFAULT_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL || "/map-styles/protomaps-light.json";

let maplibreLoaded = false;
let maplibreLoadPromise: Promise<void> | null = null;

const loadMaplibre = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (maplibreLoaded) return Promise.resolve();
  if (maplibreLoadPromise) return maplibreLoadPromise;

  maplibreLoadPromise = new Promise((resolve, reject) => {
    if ((window as any).maplibregl && (window as any).pmtiles) {
      maplibreLoaded = true;
      resolve();
      return;
    }

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href =
      "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
    document.head.appendChild(cssLink);

    const mlScript = document.createElement("script");
    mlScript.src =
      "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    mlScript.onload = () => {
      const pmScript = document.createElement("script");
      pmScript.src = "https://unpkg.com/pmtiles@3.2.1/dist/pmtiles.js";
      pmScript.onload = () => {
        const maplibregl = (window as any).maplibregl;
        const pmtiles = (window as any).pmtiles;
        const protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        maplibreLoaded = true;
        resolve();
      };
      pmScript.onerror = reject;
      document.head.appendChild(pmScript);
    };
    mlScript.onerror = reject;
    document.head.appendChild(mlScript);
  });

  return maplibreLoadPromise;
};

const MaplibreRoutePreview: React.FC<MaplibreRoutePreviewProps> = ({
  routePoints,
  height = "400px",
  width = "100%",
  showStartEnd = true,
  className = "",
  lineColor = "#3b82f6",
  lineWidth = 4,
  padding = 40,
  interactive = true,
  minZoom = 8,
  maxZoom = 17,
  terrain3D = false,
  styleUrl = DEFAULT_STYLE_URL,
  pmtilesUrl = DEFAULT_PMTILES,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !routePoints?.length) return;

    const init = async () => {
      await loadMaplibre();
      if (map.current) return;

      const maplibregl = (window as any).maplibregl;

      const lats = routePoints.map((p) => p.lat);
      const lngs = routePoints.map((p) => p.lng);
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );

      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: styleUrl,
        bounds,
        fitBoundsOptions: { padding },
        interactive,
        minZoom,
        maxZoom,
        attributionControl: { compact: true },
        transformRequest: (url: string) => {
          if (url.startsWith("{pmtiles}")) {
            return { url: url.replace("{pmtiles}", pmtilesUrl) };
          }
          return { url };
        },
      });

      map.current.on("load", () => {
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
          id: "route-casing",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": lineWidth + 2,
            "line-opacity": 0.9,
          },
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": lineColor,
            "line-width": lineWidth,
            "line-gradient": [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0,
              "#10b981",
              0.5,
              lineColor,
              1,
              "#ef4444",
            ],
          },
        });

        if (showStartEnd && routePoints.length > 1) {
          const start = routePoints[0];
          const end = routePoints[routePoints.length - 1];
          new maplibregl.Marker({ color: "#10b981" })
            .setLngLat([start.lng, start.lat])
            .setPopup(new maplibregl.Popup().setText("Start"))
            .addTo(map.current);
          new maplibregl.Marker({ color: "#ef4444" })
            .setLngLat([end.lng, end.lat])
            .setPopup(new maplibregl.Popup().setText("Finish"))
            .addTo(map.current);
        }

        if (terrain3D) {
          map.current.addSource("terrain", {
            type: "raster-dem",
            url: `pmtiles://${pmtilesUrl.replace(/world\.pmtiles$/, "terrarium.pmtiles")}`,
            tileSize: 256,
          });
          map.current.setTerrain({ source: "terrain", exaggeration: 1.4 });
          map.current.addControl(
            new maplibregl.TerrainControl({ source: "terrain" })
          );
        }
      });
    };

    init();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [
    routePoints,
    showStartEnd,
    lineColor,
    lineWidth,
    padding,
    interactive,
    styleUrl,
    pmtilesUrl,
    terrain3D,
  ]);

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

export default MaplibreRoutePreview;
