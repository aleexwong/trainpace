/**
 * Poster Data Hook
 * Manages poster form data and template selection
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { getCityFromRoute } from "@/utils/geocoding";
import {
  type PosterData,
  type GpxPoint,
  type GPXMetadata,
  TEMPLATE_COLORS,
  MAPBOX_TOKEN,
} from "../types";

interface UsePosterDataProps {
  metadata: GPXMetadata;
  filename?: string;
  displayPoints: GpxPoint[];
}

interface UsePosterDataReturn {
  posterData: PosterData;
  setPosterData: React.Dispatch<React.SetStateAction<PosterData>>;
  selectedTemplate: number;
  setSelectedTemplate: (index: number) => void;
  hasClickedTemplate: boolean;
  setHasClickedTemplate: (value: boolean) => void;
  currentMapStyle: string;
  isGeocodingCity: boolean;
}

export function usePosterData({
  metadata,
  filename,
  displayPoints,
}: UsePosterDataProps): UsePosterDataReturn {
  const { user } = useAuth();

  const [posterData, setPosterData] = useState<PosterData>({
    city: "Vancouver",
    raceName:
      metadata.routeName || filename?.replace(/\.[^/.]+$/, "") || "My Race",
    time: "1:30:00",
    distance: `${metadata.totalDistance.toFixed(1)} km`,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    athleteName: user?.displayName || user?.email?.split("@")[0] || "Athlete",
    routeColor: "#e74c3c",
    backgroundColor: "#ffffff",
  });

  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [hasClickedTemplate, setHasClickedTemplate] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState(
    TEMPLATE_COLORS[0].mapStyle
  );
  const [isGeocodingCity, setIsGeocodingCity] = useState(false);

  // Geocode city name from route coordinates
  useEffect(() => {
    if (!displayPoints.length || !MAPBOX_TOKEN) return;

    const geocodeCity = async () => {
      setIsGeocodingCity(true);
      console.log("🌍 Geocoding city from route...");

      const result = await getCityFromRoute(displayPoints, MAPBOX_TOKEN);

      if (result.city) {
        setPosterData((prev) => ({
          ...prev,
          city: result.city || "Vancouver",
        }));
        console.log(`📍 City detected: ${result.city}`);
      } else {
        console.log("⚠️ Could not detect city, using default");
      }

      setIsGeocodingCity(false);
    };

    geocodeCity();
  }, [displayPoints]);

  // Update template colors and map style when template changes
  useEffect(() => {
    const template = TEMPLATE_COLORS[selectedTemplate];
    console.log(
      "🎯 Template changed to:",
      template.name,
      "| Style:",
      template.mapStyle,
      "| Color:",
      template.route
    );

    setPosterData((prev) => ({
      ...prev,
      routeColor: template.route,
      backgroundColor: template.bg,
    }));
    setCurrentMapStyle(template.mapStyle);
  }, [selectedTemplate]);

  return {
    posterData,
    setPosterData,
    selectedTemplate,
    setSelectedTemplate,
    hasClickedTemplate,
    setHasClickedTemplate,
    currentMapStyle,
    isGeocodingCity,
  };
}
