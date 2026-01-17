/**
 * Poster Dialog Hook
 * Manages dialog open/close state for poster generator
 */

import { useState } from "react";
import type { GpxPoint, GPXMetadata } from "../types";

interface UsePosterDialogProps {
  displayPoints: GpxPoint[];
  metadata: GPXMetadata;
  filename?: string;
}

export function usePosterDialog({
  displayPoints,
  metadata,
  filename,
}: UsePosterDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPosterGenerator, setShowPosterGenerator] = useState(false);

  const openPosterGenerator = () => {
    setShowPosterGenerator(true);
  };

  const closePosterGenerator = () => {
    setShowPosterGenerator(false);
  };

  const canGeneratePoster =
    displayPoints && displayPoints.length > 0 && metadata;

  return {
    isGenerating,
    setIsGenerating,
    showPosterGenerator,
    openPosterGenerator,
    closePosterGenerator,
    canGeneratePoster,
    posterData: {
      displayPoints,
      metadata,
      filename,
    },
  };
}
