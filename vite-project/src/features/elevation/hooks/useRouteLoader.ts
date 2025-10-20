/**
 * Route Loading Hook
 * Handles loading shared routes from Firebase with smart caching
 */

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type {
  OptimizedRouteMetadata,
  GPXAnalysisResponse,
  AnalysisSettings,
} from "../types";

interface UseRouteLoaderParams {
  routeId: string | undefined;
  analysisSettings: AnalysisSettings;
  getCachedAnalysis: (
    routeId: string,
    settings: AnalysisSettings,
    staticData: any
  ) => Promise<GPXAnalysisResponse | null>;
  performAnalysis: (
    gpxText: string,
    settings: AnalysisSettings,
    filename: string,
    routeId?: string
  ) => Promise<GPXAnalysisResponse>;
}

interface UseRouteLoaderReturn {
  routeMetadata: OptimizedRouteMetadata | null;
  analysisData: GPXAnalysisResponse | null;
  originalGpxText: string | null;
  loading: boolean;
  error: string | null;
  setRouteMetadata: (metadata: OptimizedRouteMetadata | null) => void;
  setAnalysisData: (data: GPXAnalysisResponse | null) => void;
  setOriginalGpxText: (text: string | null) => void;
}

export function useRouteLoader({
  routeId,
  analysisSettings,
  getCachedAnalysis,
  performAnalysis,
}: UseRouteLoaderParams): UseRouteLoaderReturn {
  const [routeMetadata, setRouteMetadata] =
    useState<OptimizedRouteMetadata | null>(null);
  const [analysisData, setAnalysisData] = useState<GPXAnalysisResponse | null>(
    null
  );
  const [originalGpxText, setOriginalGpxText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedRoute = async () => {
      if (!routeId) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Load route metadata
        const docRef = doc(db, "gpx_uploads", routeId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Shared route not found");
        }

        const sharedData = docSnap.data() as OptimizedRouteMetadata;
        setRouteMetadata(sharedData);

        // 2. Check if we have static data cached
        if (sharedData.staticRouteData) {
          console.log(`Static route data found in cache`);

          // Check for cached analysis with current settings
          const cachedAnalysis = await getCachedAnalysis(
            routeId,
            analysisSettings,
            sharedData.staticRouteData
          );

          if (cachedAnalysis) {
            console.log(`Instant load from cache!`);
            setAnalysisData(cachedAnalysis);
            setOriginalGpxText(null); // Don't need GPX text for cached data
            setLoading(false);
            return;
          }
        }

        // 3. Cache miss or no static data - call API
        console.log(`Cache miss - calling API...`);

        // Get GPX content
        let gpxText = sharedData.content;
        if (!gpxText && sharedData.storageRef) {
          const storageUrl = await getDownloadURL(
            ref(storage, sharedData.storageRef)
          );
          const res = await fetch(storageUrl);
          if (!res.ok)
            throw new Error(`Failed to fetch GPX: HTTP ${res.status}`);
          gpxText = await res.text();
        }

        if (!gpxText || gpxText.length < 10) {
          throw new Error("GPX content is missing or corrupted");
        }

        setOriginalGpxText(gpxText);

        // Call API with caching
        const analysis = await performAnalysis(
          gpxText,
          analysisSettings,
          sharedData.filename,
          routeId
        );

        setAnalysisData(analysis);
      } catch (err: any) {
        console.error("Load shared route error:", err);
        setError(err.message || "Failed to load shared route");
      } finally {
        setLoading(false);
      }
    };

    loadSharedRoute();
  }, [routeId]); // Only depend on routeId, not analysisSettings

  return {
    routeMetadata,
    analysisData,
    originalGpxText,
    loading,
    error,
    setRouteMetadata,
    setAnalysisData,
    setOriginalGpxText,
  };
}
