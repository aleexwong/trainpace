/**
 * Poster Generator Hook
 * Handles poster generation and download
 */

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { type PosterData } from "../types";
import { generatePosterImage } from "../utils/canvas";
import { debug } from "@/lib/debug";
import { reportError } from "@/lib/reportError";

interface UsePosterGeneratorProps {
  getMapCanvas: () => HTMLCanvasElement | null;
  waitForMapReady: () => Promise<void>;
  posterData: PosterData;
  mapReady: boolean;
}

interface UsePosterGeneratorReturn {
  isGenerating: boolean;
  generateFullPoster: () => Promise<void>;
}

export function usePosterGenerator({
  getMapCanvas,
  waitForMapReady,
  posterData,
  mapReady,
}: UsePosterGeneratorProps): UsePosterGeneratorReturn {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFullPoster = useCallback(async () => {
    if (!mapReady) {
      toast({
        title: "Map Not Ready",
        description: "Please wait for the map to finish loading.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    debug("🚀 Starting poster generation");

    try {
      // Wait for preview map to be fully loaded
      await waitForMapReady();

      debug("📸 Capturing preview map");

      // Get the preview map canvas directly
      const previewCanvas = getMapCanvas();
      if (!previewCanvas) {
        throw new Error("Could not get map canvas");
      }

      debug("💾 Generating poster image");

      const blob = await generatePosterImage(previewCanvas, posterData);

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeRaceName = posterData.raceName.replace(/[^a-zA-Z0-9]/g, "_");
        link.download = `${safeRaceName}_poster_8x10_300dpi.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        debug("✅ Poster downloaded!");
        toast({
          title: "Poster Generated!",
          description: "Your high-quality poster has been downloaded.",
        });
      }

      setIsGenerating(false);
    } catch (error) {
      debug("❌ Generation failed");
      reportError(error, { scope: "poster.generate" });
      toast({
        title: "Generation Failed",
        description:
          "There was an error creating your poster. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  }, [getMapCanvas, waitForMapReady, posterData, mapReady, toast]);

  return {
    isGenerating,
    generateFullPoster,
  };
}
