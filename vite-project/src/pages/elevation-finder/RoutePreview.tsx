import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RoutePoint {
  lat: number;
  lng: number;
  ele?: number;
}

interface RoutePreviewProps {
  thumbnailPoints: RoutePoint[];
  routeName?: string;
  height?: string;
  interactive?: boolean;
  showElevationMarkers?: boolean;
  showStartEnd?: boolean;
  className?: string;
}

const RoutePreview: React.FC<RoutePreviewProps> = ({
  thumbnailPoints,
  routeName = "Route",
  height = "200px",
  interactive = false,
  showElevationMarkers = false,
  showStartEnd = true,
  className = "",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !thumbnailPoints?.length) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Modern, minimal basemap (Carto Positron)
    const tileLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 18,
        subdomains: ["a", "b", "c", "d"],
      }
    );

    tileLayer.addTo(map);

    tileLayer.on("load", () => setIsLoaded(true));
    setTimeout(() => {
      if (!isLoaded) setIsLoaded(true);
    }, 3000);

    const latLngs = thumbnailPoints.map(
      (point) => [point.lat, point.lng] as [number, number]
    );

    const routeLine = L.polyline(latLngs, {
      color: "#34495e", // dark navy
      weight: 2,
      opacity: 0.9,
      smoothFactor: 2,
    }).addTo(map);

    // Add start/end markers if requested
    if (showStartEnd && thumbnailPoints.length > 1) {
      const startPoint = thumbnailPoints[0];
      const endPoint = thumbnailPoints[thumbnailPoints.length - 1];

      // Start marker
      L.marker([startPoint.lat, startPoint.lng], {
        icon: L.divIcon({
          html: `<div style="background: white; border: 2px solid #27ae60; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3); font-size: 16px;">🏁</div>`,
          className: "custom-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(map);

      // End marker
      L.marker([endPoint.lat, endPoint.lng], {
        icon: L.divIcon({
          html: `<div style="background: white; border: 2px solid #e74c3c; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3); font-size: 16px;">✅</div>`,
          className: "custom-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(map);
    }

    // Add elevation markers if requested
    if (showElevationMarkers && interactive) {
      const elevationPoints = thumbnailPoints.filter(
        (_, index) =>
          index % Math.max(1, Math.floor(thumbnailPoints.length / 5)) === 0
      );

      elevationPoints.forEach((point) => {
        if (point.ele !== undefined) {
          L.marker([point.lat, point.lng], {
            icon: L.divIcon({
              html: `<div style="background: #3498db; color: white; border-radius: 4px; padding: 2px 4px; font-size: 10px; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">${Math.round(
                point.ele
              )}m</div>`,
              className: "elevation-marker",
              iconSize: [30, 16],
              iconAnchor: [15, 8],
            }),
          }).addTo(map);
        }
      });
    }

    // Optional: add scale control
    if (interactive) {
      L.control.scale({ position: "bottomleft" }).addTo(map);
    }

    map.fitBounds(routeLine.getBounds(), { padding: [10, 10] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [thumbnailPoints, interactive, showElevationMarkers, showStartEnd]);

  if (!thumbnailPoints?.length) {
    return (
      <div
        className={`bg-gray-100 rounded-md flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-gray-400 text-sm">No route data</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width: "100%" }}
        className="rounded-md overflow-hidden"
      />
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-md"
          style={{ height }}
        >
          <div className="text-gray-400 text-sm">Loading map...</div>
        </div>
      )}
    </div>
  );
};

export default RoutePreview;
