/**
 * Mapbox Hook
 * Manages Mapbox map instance lifecycle and interactions
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { type GpxPoint, type PosterData, MAPBOX_TOKEN } from "../types";
import { loadMapbox, calculateZoom, calculateCenter } from "../utils/mapbox";

interface UseMapboxProps {
  containerRef: React.RefObject<HTMLDivElement>;
  displayPoints: GpxPoint[];
  currentMapStyle: string;
  posterData: PosterData;
  onMapUpdate?: () => void;
}

interface UseMapboxReturn {
  mapReady: boolean;
  mapRef: React.MutableRefObject<any>;
  getMapCanvas: () => HTMLCanvasElement | null;
  waitForMapReady: () => Promise<void>;
}

export function useMapbox({
  containerRef,
  displayPoints,
  currentMapStyle,
  posterData,
  onMapUpdate,
}: UseMapboxProps): UseMapboxReturn {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { toast } = useToast();

  const [mapReady, setMapReady] = useState(false);

  // Check if Mapbox token is available
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.log("❌ VITE_MAPBOX_TOKEN not found");
      toast({
        title: "Configuration Error",
        description: "Mapbox token not configured. Map tiles will not load.",
        variant: "destructive",
      });
    } else {
      console.log("✅ Mapbox token found");
    }
  }, [toast]);

  // Initialize preview map
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN || !displayPoints.length) return;

    const initializeMap = async () => {
      try {
        await loadMapbox();

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        // Calculate center and proper zoom from bounds
        const lats = displayPoints.map((p) => p.lat);
        const lngs = displayPoints.map((p) => p.lng);
        const center = calculateCenter(lats, lngs);

        // Get container dimensions
        const containerWidth = containerRef.current?.offsetWidth || 400;
        const containerHeight = containerRef.current?.offsetHeight || 500;

        const calculatedZoom = calculateZoom(
          lats,
          lngs,
          containerWidth,
          containerHeight
        );

        const latSpan = Math.max(...lats) - Math.min(...lats);
        const lngSpan = Math.max(...lngs) - Math.min(...lngs);
        const maxSpan = Math.max(latSpan, lngSpan);
        console.log(
          `🗺️ Initial zoom: ${calculatedZoom} (span: ${(maxSpan * 111).toFixed(
            1
          )}km)`
        );

        // Initialize map with manual center/zoom
        mapRef.current = new mapboxgl.Map({
          container: containerRef.current!,
          style: currentMapStyle,
          center: center,
          zoom: calculatedZoom,
          interactive: true,
          preserveDrawingBuffer: true, // CRITICAL for canvas export
        });

        mapRef.current.on("load", () => {
          // Add route line
          mapRef.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: displayPoints.map((p) => [p.lng, p.lat]),
              },
            },
          });

          mapRef.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": posterData.routeColor,
              "line-width": 3,
            },
          });

          setMapReady(true);
          console.log("✅ Preview map ready");
        });

        // Set up move end listener
        mapRef.current.on("moveend", () => {
          onMapUpdate?.();
        });
      } catch (error) {
        console.error("Failed to load Mapbox:", error);
        console.log("❌ Map initialization failed");
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [displayPoints, containerRef]);

  // Update map style when template changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const currentStyle = mapRef.current.getStyle();
    const currentStyleUrl = currentStyle?.sprite
      ?.split("/styles/")[1]
      ?.split("/")[0];
    const newStyleUrl = currentMapStyle.split("/styles/")[1]?.split("/")[0];

    console.log(
      "🎨 Style check - current:",
      currentStyleUrl,
      "| new:",
      newStyleUrl
    );

    // Only reload style if it actually changed
    if (currentStyleUrl !== newStyleUrl) {
      console.log("🔄 Style changing to:", currentMapStyle);
      mapRef.current.setStyle(currentMapStyle);

      // Re-add route after style loads
      mapRef.current.once("styledata", () => {
        console.log(
          "🎨 Style loaded, re-adding route with color:",
          posterData.routeColor
        );

        if (mapRef.current.getSource("route")) {
          mapRef.current.removeLayer("route");
          mapRef.current.removeSource("route");
        }

        mapRef.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: displayPoints.map((p) => [p.lng, p.lat]),
            },
          },
        });

        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": posterData.routeColor,
            "line-width": 3,
          },
        });

        console.log("✅ Route layer added after style change");

        // Wait for idle to ensure everything is rendered
        mapRef.current.once("idle", () => {
          console.log("✅ Map idle after style change");
          mapRef.current.fire("moveend");
        });
      });
    } else {
      console.log(
        "⏭️ Same style, skipping reload - color will update separately"
      );
    }
  }, [currentMapStyle, mapReady, displayPoints, posterData.routeColor]);

  // Update route color when it changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      console.log("⏳ Color update blocked: map not ready");
      return;
    }

    // Short delay to ensure style change effect completed if triggered
    const timer = setTimeout(() => {
      // Wait for style to be fully loaded before updating paint properties
      if (!mapRef.current.isStyleLoaded()) {
        console.log("⏳ Style not loaded, skipping color update");
        return;
      }

      // Check if layer exists before updating
      if (mapRef.current.getLayer("route")) {
        console.log("🎨 Updating route color to:", posterData.routeColor);
        mapRef.current.setPaintProperty(
          "route",
          "line-color",
          posterData.routeColor
        );

        // Force a repaint to ensure the color change is visible
        mapRef.current.triggerRepaint();
      } else {
        console.log("⚠️ Route layer not found for color update");
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [posterData.routeColor, mapReady]);

  // Manage markers when toggle changes
  useEffect(() => {
    if (!mapRef.current || !mapReady || !displayPoints.length) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, [mapReady, displayPoints, posterData.routeColor]);

  const getMapCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!mapRef.current) return null;
    return mapRef.current.getCanvas();
  }, []);

  const waitForMapReady = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (mapRef.current?.loaded()) {
        resolve();
      } else if (mapRef.current) {
        mapRef.current.once("idle", () => resolve());
      } else {
        resolve();
      }
    });
  }, []);

  return {
    mapReady,
    mapRef,
    getMapCanvas,
    waitForMapReady,
  };
}
