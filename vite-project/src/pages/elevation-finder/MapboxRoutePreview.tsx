import React, { useEffect, useRef } from "react";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface InteractiveMapboxPreviewProps {
  thumbnailPoints: RoutePoint[];
  routeName?: string;
  height?: string;
  width?: string;
  showStartEnd?: boolean;
  className?: string;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN";

const InteractiveMapboxPreview: React.FC<InteractiveMapboxPreviewProps> = ({
  thumbnailPoints,
  height = "250px",
  width = "100%",
  showStartEnd = true,
  className = "",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !thumbnailPoints?.length) return;

    // Load Mapbox GL JS
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.onload = initializeMap;
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    function initializeMap() {
      if (map.current) return; // Map already initialized

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Calculate bounds
      const lats = thumbnailPoints.map((p) => p.lat);
      const lngs = thumbnailPoints.map((p) => p.lng);
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        bounds: bounds,
        fitBoundsOptions: { padding: 20 },
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
              coordinates: thumbnailPoints.map((p) => [p.lng, p.lat]),
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
            "line-color": "#ff0000",
            "line-width": 4,
          },
        });

        if (showStartEnd && thumbnailPoints.length > 1) {
          const start = thumbnailPoints[0];
          const end = thumbnailPoints[thumbnailPoints.length - 1];

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
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [thumbnailPoints, showStartEnd]);

  if (!thumbnailPoints?.length) {
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
