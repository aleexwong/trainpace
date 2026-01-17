/**
 * Export Controls Component
 * Download button and export options
 */

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAPBOX_TOKEN } from "../types";

interface ExportControlsProps {
  isGenerating: boolean;
  mapReady: boolean;
  onGenerate: () => void;
}

export function ExportControls({
  isGenerating,
  mapReady,
  onGenerate,
}: ExportControlsProps) {
  return (
    <>
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !MAPBOX_TOKEN || !mapReady}
        className="w-full"
        size="lg"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGenerating ? "Generating..." : 'Download 8×10" Poster (300 DPI)'}
      </Button>

      <div className="text-xs text-gray-500 space-y-1 mt-3">
        <div>✓ Frame your route with the map controls</div>
        <div>✓ Customize all details below</div>
        <div>✓ Download print-ready 300 DPI poster</div>
        {!MAPBOX_TOKEN && (
          <div className="text-red-500">⚠️ Mapbox token not configured</div>
        )}
      </div>
    </>
  );
}
