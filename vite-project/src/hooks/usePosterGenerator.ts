import { useState } from 'react';
import type { GPXMetadata } from '../lib/gpxMetaData';

type GpxPoint = { lat: number; lng: number; ele?: number };

interface UsePosterGeneratorProps {
  displayPoints: GpxPoint[];
  metadata: GPXMetadata;
  filename?: string;
}

export function usePosterGenerator({ displayPoints, metadata, filename }: UsePosterGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPosterGenerator, setShowPosterGenerator] = useState(false);

  const openPosterGenerator = () => {
    setShowPosterGenerator(true);
  };

  const closePosterGenerator = () => {
    setShowPosterGenerator(false);
  };

  const canGeneratePoster = displayPoints && displayPoints.length > 0 && metadata;

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
      filename
    }
  };
}

export type { GpxPoint };