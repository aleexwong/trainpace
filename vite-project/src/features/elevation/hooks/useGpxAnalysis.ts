/**
 * GPX Analysis Hook with Smart Caching
 * Handles API calls, caching, and settings changes
 */

import { useCallback, useRef } from "react";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import type {
  GPXAnalysisResponse,
  AnalysisSettings,
  OptimizedRouteMetadata,
} from "../types";
import { API_ENDPOINTS, CACHE_SETTINGS } from "../types";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface UseGpxAnalysisReturn {
  performAnalysis: (
    gpxText: string,
    settings: AnalysisSettings,
    filename: string,
    routeId?: string
  ) => Promise<GPXAnalysisResponse>;
  getCachedAnalysis: (
    routeId: string,
    settings: AnalysisSettings,
    staticData: any
  ) => Promise<GPXAnalysisResponse | null>;
  handleSettingsChange: (
    newSettings: AnalysisSettings,
    currentSettings: AnalysisSettings,
    routeId: string | null,
    routeMetadata: OptimizedRouteMetadata | null,
    originalGpxText: string | null,
    filename: string | null
  ) => Promise<{
    analysisData: GPXAnalysisResponse | null;
    error: string | null;
  }>;
}

export function useGpxAnalysis(): UseGpxAnalysisReturn {
  const auth = useAuth();
  const lastApiCall = useRef<number>(0);

  // Generate cache key
  const getCacheKey = (settings: AnalysisSettings) => {
    return `v1_pace_${settings.basePaceMinPerKm}_grade_${settings.gradeThreshold}`;
  };

  // Get cached analysis
  const getCachedAnalysis = useCallback(
    async (
      routeId: string,
      settings: AnalysisSettings,
      staticData: any
    ): Promise<GPXAnalysisResponse | null> => {
      try {
        const cacheKey = getCacheKey(settings);
        const cacheRef = doc(
          db,
          "elevation_analysis_cache",
          `${routeId}_${cacheKey}`
        );
        const cacheSnap = await getDoc(cacheRef);

        if (!cacheSnap.exists()) {
          console.log(`Cache miss for ${cacheKey}`);
          return null;
        }

        const cached = cacheSnap.data();

        // Check expiration
        if (new Date(cached.expiresAt) < new Date()) {
          console.log(`Cache expired for ${cacheKey}, cleaning up...`);
          await deleteDoc(cacheRef);
          return null;
        }

        console.log(`Cache hit for ${cacheKey} - saved API call!`);

        // Reconstruct full API response from cache + static data
        const reconstructed: GPXAnalysisResponse = {
          message: "Loaded from optimized cache",
          raceName: staticData.routeName || "Cached Route",
          goalPace: settings.basePaceMinPerKm,
          totalDistanceKm: staticData.totalDistance,
          elevationGain: staticData.totalElevationGain,
          profile: staticData.elevationProfile,
          elevationInsights: {
            segments: cached.analysisResults.segmentClassifications.map(
              (seg: any, index: number) => ({
                ...staticData.rawSegments[index],
                ...seg,
                startDistance: seg.startKm,
                endDistance: seg.endKm,
              })
            ),
            insights: {
              totalDistance: staticData.totalDistance,
              totalElevationGain: staticData.totalElevationGain,
              totalElevationLoss: staticData.totalElevationLoss,
              difficultyRating: staticData.difficultyRating,
              ...cached.analysisResults.distanceBreakdown,
              ...cached.analysisResults.timeEstimate,
              ...cached.analysisResults.keySegments,
            },
          },
          metadata: {
            pointCount: staticData.elevationProfile.length,
            hasElevationData: true,
            analysisParameters: settings,
          },
          cacheOptimization: {
            staticRouteData: staticData,
            analysisResults: cached.analysisResults,
            settings,
          },
        };

        return reconstructed;
      } catch (error) {
        console.error("Cache lookup failed:", error);
        return null;
      }
    },
    []
  );

  // Cache analysis results
  const cacheAnalysisResults = async (
    routeId: string,
    apiResponse: GPXAnalysisResponse
  ) => {
    try {
      if (!apiResponse.cacheOptimization) {
        console.warn("API response missing cache optimization data");
        return;
      }

      const { analysisResults, settings } = apiResponse.cacheOptimization;
      const cacheKey = getCacheKey(settings);

      await setDoc(
        doc(db, "elevation_analysis_cache", `${routeId}_${cacheKey}`),
        {
          routeId,
          cacheKey,
          analysisResults,
          settings,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + CACHE_SETTINGS.EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }
      );
    } catch (error) {
      console.error("Failed to cache analysis:", error);
    }
  };

  // Cache static route data
  const cacheStaticData = async (
    routeId: string,
    apiResponse: GPXAnalysisResponse
  ) => {
    try {
      if (!apiResponse.cacheOptimization) {
        console.warn("API response missing cache optimization data");
        return;
      }

      const { staticRouteData } = apiResponse.cacheOptimization;

      await updateDoc(doc(db, "gpx_uploads", routeId), {
        staticRouteData,
        staticDataCached: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to cache static data:", error);
    }
  };

  // Perform analysis with caching
  const performAnalysis = useCallback(
    async (
      gpxText: string,
      settings: AnalysisSettings,
      filename: string,
      routeId?: string
    ): Promise<GPXAnalysisResponse> => {
      // Rate limiting
      const now = Date.now();
      if (now - lastApiCall.current < CACHE_SETTINGS.MIN_API_INTERVAL) {
        throw new Error("Please wait before making another request");
      }
      lastApiCall.current = now;

      const idToken = auth.user ? await auth.user.getIdToken() : null;
      const response = await fetch(API_ENDPOINTS.ANALYZE_GPX, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          gpx: gpxText,
          goalPace: settings.basePaceMinPerKm,
          raceName: filename,
          basePaceMinPerKm: settings.basePaceMinPerKm,
          gradeThreshold: settings.gradeThreshold,
          includeElevationInsights: true,
          routeId: routeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.statusText} try again in ${errorData.retryAfter} seconds`
        );
      }

      const analysis: GPXAnalysisResponse = await response.json();

      // Cache both static data and analysis results
      if (routeId && analysis.cacheOptimization) {
        await Promise.all([
          cacheStaticData(routeId, analysis),
          cacheAnalysisResults(routeId, analysis),
        ]);
      }

      console.log(
        `🔥 API response received, elevation: ${analysis.elevationGain}`
      );

      return analysis;
    },
    [auth.user]
  );

  // Handle settings change
  const handleSettingsChange = useCallback(
    async (
      newSettings: AnalysisSettings,
      currentSettings: AnalysisSettings,
      routeId: string | null,
      routeMetadata: OptimizedRouteMetadata | null,
      originalGpxText: string | null,
      filename: string | null
    ): Promise<{
      analysisData: GPXAnalysisResponse | null;
      error: string | null;
    }> => {
      console.log(`🔧 Settings change requested`);

      const oldCacheKey = getCacheKey(currentSettings);
      const newCacheKey = getCacheKey(newSettings);

      if (oldCacheKey === newCacheKey) {
        console.log("Settings unchanged, no API call needed");
        return { analysisData: null, error: null };
      }

      // For shared routes, check cache with new settings
      if (routeId && routeMetadata) {
        try {
          // 1. Check cache for new settings first
          if (routeMetadata.staticRouteData) {
            const cachedForNewSettings = await getCachedAnalysis(
              routeId,
              newSettings,
              routeMetadata.staticRouteData
            );

            if (cachedForNewSettings) {
              console.log(`Using cached analysis for new settings`);
              return { analysisData: cachedForNewSettings, error: null };
            }
          }

          // 2. Cache miss - need fresh analysis, get GPX content
          let gpxText = originalGpxText;

          // Fallback methods to get GPX content
          if (!gpxText) {
            console.log(
              "🔄 originalGpxText not available, trying fallbacks..."
            );

            if (routeMetadata.content) {
              gpxText = routeMetadata.content;
            } else if (routeMetadata.storageRef) {
              const storageUrl = await getDownloadURL(
                ref(storage, routeMetadata.storageRef)
              );
              const response = await fetch(storageUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch GPX: HTTP ${response.status}`);
              }
              gpxText = await response.text();
            } else if (routeMetadata.fileUrl) {
              const response = await fetch(routeMetadata.fileUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch GPX: HTTP ${response.status}`);
              }
              gpxText = await response.text();
            }
          }

          // 3. Final check - do we have GPX content?
          if (!gpxText || gpxText.length < 10) {
            throw new Error("Could not retrieve GPX content for re-analysis");
          }

          console.log(`Cache miss for new settings, calling API...`);
          const analysis = await performAnalysis(
            gpxText,
            newSettings,
            filename || "Route",
            routeId
          );

          return { analysisData: analysis, error: null };
        } catch (err: any) {
          return { analysisData: null, error: err.message };
        }
      } else if (originalGpxText) {
        // For non-shared routes, just re-analyze
        try {
          const analysis = await performAnalysis(
            originalGpxText,
            newSettings,
            filename || "Route"
          );
          return { analysisData: analysis, error: null };
        } catch (err: any) {
          return { analysisData: null, error: err.message };
        }
      } else {
        return {
          analysisData: null,
          error:
            "Cannot change settings: route data not available. Please refresh the page.",
        };
      }
    },
    [getCachedAnalysis, performAnalysis]
  );

  return {
    performAnalysis,
    getCachedAnalysis,
    handleSettingsChange,
  };
}
