import React, { useEffect, useRef } from "react";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface LeafletPreviewProps {
  routePoints: RoutePoint[];
  routeName?: string | null;
  height?: string;
  width?: string;
  showStartEnd?: boolean;
  className?: string;
  lineColor?: string;
  lineWidth?: number;
  interactive?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

let leafletLoaded = false;
let leafletLoadPromise: Promise<void> | null = null;

const loadLeaflet = (): Promise<void> => {
  // Don't load Leaflet during SSR
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  
  if (leafletLoaded) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if ((window as any).L) {
      leafletLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      leafletLoaded = true;
      resolve();
    };
    script.onerror = reject;

    const link = document.createElement("link");
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.rel = "stylesheet";

    document.head.appendChild(link);
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
};

const LeafletRoutePreview: React.FC<LeafletPreviewProps> = ({
  routePoints,
  height = "300px",
  width = "100%",
  showStartEnd = true,
  className = "",
  lineColor = "#3b82f6",
  lineWidth = 4,
  interactive = true,
  minZoom = 3,
  maxZoom = 18,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    // Don't run during SSR
    if (typeof window === 'undefined' || !mapContainer.current || !routePoints?.length) return;

    let destroyed = false;

    const init = async () => {
      await loadLeaflet();
      if (destroyed || typeof window === 'undefined') return;
      const L = (window as any).L;

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainer.current!, {
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          boxZoom: interactive,
          touchZoom: interactive,
        });

        // Tile layer (OSM standard)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom,
          minZoom,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);
      }

      // Clear previous layer
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      const latlngs = routePoints.map((p) => [p.lat, p.lng]);
      layerRef.current = (window as any).L.polyline(latlngs, {
        color: lineColor,
        weight: lineWidth,
      }).addTo(mapRef.current);

      const bounds = (window as any).L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });

      if (showStartEnd && routePoints.length > 1) {
        const start = routePoints[0];
        const end = routePoints[routePoints.length - 1];
        (window as any).L.circleMarker([start.lat, start.lng], {
          radius: 6,
          color: "#27ae60",
          fillColor: "#27ae60",
          fillOpacity: 1,
        }).addTo(mapRef.current);
        (window as any).L.circleMarker([end.lat, end.lng], {
          radius: 6,
          color: "#e74c3c",
          fillColor: "#e74c3c",
          fillOpacity: 1,
        }).addTo(mapRef.current);
      }
    };

    init();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routePoints, lineColor, lineWidth, interactive, minZoom, maxZoom, showStartEnd]);

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

export default LeafletRoutePreview;

