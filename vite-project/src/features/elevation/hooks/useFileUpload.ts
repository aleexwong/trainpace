/**
 * File Upload Hook
 * Handles fresh GPX file uploads
 */

import { useState, useCallback } from "react";
import type { GPXAnalysisResponse, AnalysisSettings, ProfilePoint } from "../types";

export interface UploadedFileData {
  gpxText: string;
  filename: string;
  fileUrl: string | null;
  docId: string | null;
  displayPoints?: Array<{ lat: number; lng: number; ele?: number }>;
  displayUrl?: string | null;
}

interface UseFileUploadParams {
  analysisSettings: AnalysisSettings;
  performAnalysis: (
    gpxText: string,
    settings: AnalysisSettings,
    filename: string,
    routeId?: string
  ) => Promise<GPXAnalysisResponse>;
  onSuccess?: (
    data: GPXAnalysisResponse,
    fileData: UploadedFileData
  ) => void;
}

interface UseFileUploadReturn {
  handleFileParsed: (
    gpxText: string,
    filename: string,
    fileUrl: string | null,
    docId: string | null,
    displayPoints?: Array<{ lat: number; lng: number; ele?: number }>,
    displayUrl?: string | null
  ) => Promise<void>;
  uploadState: {
    loading: boolean;
    error: string | null;
    filename: string | null;
    points: ProfilePoint[];
    analysisData: GPXAnalysisResponse | null;
    uploadedRoutePoints: Array<{ lat: number; lng: number; ele?: number }>;
    originalGpxText: string | null;
  };
  resetUploadState: () => void;
}

export function useFileUpload({
  analysisSettings,
  performAnalysis,
  onSuccess,
}: UseFileUploadParams): UseFileUploadReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [points, setPoints] = useState<ProfilePoint[]>([]);
  const [analysisData, setAnalysisData] = useState<GPXAnalysisResponse | null>(
    null
  );
  const [uploadedRoutePoints, setUploadedRoutePoints] = useState<
    Array<{ lat: number; lng: number; ele?: number }>
  >([]);
  const [originalGpxText, setOriginalGpxText] = useState<string | null>(null);

  const handleFileParsed = useCallback(
    async (
      gpxText: string,
      filename: string,
      fileUrl: string | null,
      docId: string | null,
      displayPoints?: Array<{ lat: number; lng: number; ele?: number }>,
      displayUrl?: string | null
    ) => {
      setLoading(true);
      setError(null);
      setFilename(filename);
      console.log(`File parsed: ${fileUrl}`);
      console.log(`New docId from upload: ${docId}`);

      if (displayPoints && displayPoints.length > 0) {
        setUploadedRoutePoints(displayPoints);
      }

      setOriginalGpxText(gpxText);

      // Update URL immediately after upload to enable sharing
      if (docId) {
        window.history.replaceState(null, "", `/elevationfinder/${docId}`);
      }

      try {
        // For fresh uploads, always analyze
        const analysis = await performAnalysis(
          gpxText,
          analysisSettings,
          filename,
          docId || undefined
        );

        setPoints(analysis.profile || []);
        setAnalysisData(analysis);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(analysis, {
            gpxText,
            filename,
            fileUrl,
            docId,
            displayPoints,
            displayUrl,
          });
        }
      } catch (err: any) {
        setError(err.message);
        console.error("GPX Analysis Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [analysisSettings, performAnalysis, onSuccess]
  );

  const resetUploadState = useCallback(() => {
    setLoading(false);
    setError(null);
    setFilename(null);
    setPoints([]);
    setAnalysisData(null);
    setUploadedRoutePoints([]);
    setOriginalGpxText(null);
  }, []);

  return {
    handleFileParsed,
    uploadState: {
      loading,
      error,
      filename,
      points,
      analysisData,
      uploadedRoutePoints,
      originalGpxText,
    },
    resetUploadState,
  };
}
