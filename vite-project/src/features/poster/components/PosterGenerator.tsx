/**
 * Poster Generator Component
 * Main poster generator UI combining all sub-components
 */

import { useRef, useCallback } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PosterGeneratorProps, type PosterData } from "../types";
import { usePosterData, useMapbox, usePosterGenerator } from "../hooks";
import { PosterPreview } from "./PosterPreview";
import { PosterControls } from "./PosterControls";

export function PosterGenerator({
  displayPoints,
  metadata,
  filename,
  onDataChange,
}: PosterGeneratorProps) {
  const previewMapRef = useRef<HTMLDivElement>(null);

  // Poster data state management
  const {
    posterData,
    setPosterData,
    selectedTemplate,
    setSelectedTemplate,
    hasClickedTemplate,
    setHasClickedTemplate,
    currentMapStyle,
    isGeocodingCity,
  } = usePosterData({ metadata, filename, displayPoints });

  // Mapbox map management
  const { mapReady, getMapCanvas, waitForMapReady } = useMapbox({
    containerRef: previewMapRef,
    displayPoints,
    currentMapStyle,
    posterData,
    onMapUpdate: onDataChange,
  });

  // Poster generation
  const { isGenerating, generateFullPoster } = usePosterGenerator({
    getMapCanvas,
    waitForMapReady,
    posterData,
    mapReady,
  });

  // Handle field updates
  const handleUpdateField = useCallback(
    (field: keyof PosterData, value: string) => {
      setPosterData((prev) => ({ ...prev, [field]: value }));
    },
    [setPosterData]
  );

  // Handle template selection
  const handleSelectTemplate = useCallback(
    (index: number) => {
      setSelectedTemplate(index);
      setHasClickedTemplate(true);
    },
    [setSelectedTemplate, setHasClickedTemplate]
  );

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Course Poster Generator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create your custom race poster with live preview and full
          customization
        </p>
      </CardHeader>

      <CardContent>
        {/* Two-Column Layout */}
        <div className="grid lg:grid-cols-[60%_40%] gap-6">
          {/* LEFT: POSTER PREVIEW (Dominant 60%) */}
          <PosterPreview
            previewMapRef={previewMapRef}
            posterData={posterData}
            mapReady={mapReady}
            hasClickedTemplate={hasClickedTemplate}
          />

          {/* RIGHT: CONTROLS PANEL (40%) */}
          <PosterControls
            posterData={posterData}
            onUpdateField={handleUpdateField}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
            onDataChange={onDataChange}
            isGenerating={isGenerating}
            mapReady={mapReady}
            onGenerate={generateFullPoster}
            isGeocodingCity={isGeocodingCity}
          />
        </div>
      </CardContent>
    </Card>
  );
}
