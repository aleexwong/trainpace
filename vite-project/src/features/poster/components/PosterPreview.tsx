/**
 * Poster Preview Component
 * Displays the live preview with map and stats overlay
 */

import { useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { type PosterData, PRINT_CONFIG } from "../types";
import { updatePreviewCanvas } from "../utils/canvas";

interface PosterPreviewProps {
  previewMapRef: React.RefObject<HTMLDivElement>;
  posterData: PosterData;
  mapReady: boolean;
  hasClickedTemplate: boolean;
}

export function PosterPreview({
  previewMapRef,
  posterData,
  mapReady,
  hasClickedTemplate,
}: PosterPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const updatePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update poster preview canvas whenever poster data changes
  useEffect(() => {
    if (!mapReady || !previewCanvasRef.current) return;

    const updatePreview = () => {
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }

      updatePreviewTimeoutRef.current = setTimeout(() => {
        if (!previewCanvasRef.current) {
          console.log("Preview update skipped: missing refs");
          return;
        }

        console.log(
          "Drawing stats overlay with data:",
          posterData.city,
          posterData.time
        );
        updatePreviewCanvas(previewCanvasRef.current, posterData);
      }, 50);
    };

    updatePreview();

    return () => {
      if (updatePreviewTimeoutRef.current) {
        clearTimeout(updatePreviewTimeoutRef.current);
      }
    };
  }, [posterData, mapReady]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Live Preview</Label>
        {mapReady && (
          <span className="text-xs text-green-600 font-medium">Ready ✓</span>
        )}
      </div>

      <div className="relative">
        <div
          className="border-2 border-gray-300 rounded-lg overflow-hidden relative shadow-lg"
          style={{
            aspectRatio: "4/5",
            backgroundColor: posterData.backgroundColor,
          }}
        >
          {/* Interactive map with 5% padding to match final poster */}
          <div
            ref={previewMapRef}
            style={{
              position: "absolute",
              top: "2.5%",
              left: "2.5%",
              width: "95%",
              height: `${PRINT_CONFIG.mapHeight * 100 * 0.95}%`,
              zIndex: 1,
            }}
          />
          {/* Canvas overlay with stats text */}
          <canvas
            ref={previewCanvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        </div>

        {/* Loading overlay */}
        {!hasClickedTemplate && (
          <div
            className="absolute inset-0 border-2 border-gray-300 rounded-lg bg-white/65 flex items-center justify-center backdrop-blur-sm"
            style={{
              zIndex: 50,
            }}
          >
            <div className="text-center space-y-2 px-4">
              <p className="text-base text-gray-700 font-semibold">
                👉 Select a color template to start
              </p>
              <p className="text-sm text-gray-500">Preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1 text-center">
        <p className="font-medium">
          🖱️ Drag to pan • 🔍 Scroll to zoom • Frame your route
        </p>
        <p className="text-blue-600 font-medium">
          This exact poster will be downloaded at 300 DPI
        </p>
      </div>
    </div>
  );
}
