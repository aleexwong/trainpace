/**
 * Route Loading Hook
 * Handles loading shared routes from Firebase with smart caching
 */

import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { extractShortId } from "@/lib/routeSlug";
import type {
  OptimizedRouteMetadata,
  GPXAnalysisResponse,
  AnalysisSettings,
  StaticRouteData,
} from "../types";

/**
 * Resolve a URL param to its Firestore document. Pretty URLs of the form
 * `{slug}-{shortId}` resolve on the trailing shortId (slug is cosmetic); legacy
 * raw doc-id URLs (no hyphen) fall back to a direct document lookup so old
 * shared links keep working.
 */
async function resolveRouteDoc(param: string): Promise<{
  id: string;
  data: OptimizedRouteMetadata;
} | null> {
  const shortId = extractShortId(param);

  if (shortId) {
    const q = query(
      collection(db, "gpx_uploads"),
      where("shortId", "==", shortId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, data: docSnap.data() as OptimizedRouteMetadata };
    }
  }

  // Legacy raw doc id (or a pretty URL whose shortId no longer exists) —
  // try a direct document lookup on the full param.
  const docRef = doc(db, "gpx_uploads", param);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, data: docSnap.data() as OptimizedRouteMetadata };
  }

  return null;
}

interface UseRouteLoaderParams {
  routeId: string | undefined;
  analysisSettings: AnalysisSettings;
  getCachedAnalysis: (
    routeId: string,
    settings: AnalysisSettings,
    staticData: StaticRouteData
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
  // The real Firestore document id the URL param resolved to (may differ from
  // the param when a pretty `{slug}-{shortId}` URL was used).
  resolvedDocId: string | null;
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
  const [resolvedDocId, setResolvedDocId] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedRoute = async () => {
      if (!routeId) {
        setResolvedDocId(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Resolve the URL param (pretty slug or legacy doc id) to its doc
        const resolved = await resolveRouteDoc(routeId);

        if (!resolved) {
          throw new Error("Shared route not found");
        }

        // Always work against the real document id from here on, so caching,
        // analysis, and ownership stay correct regardless of the URL slug.
        const realDocId = resolved.id;
        const sharedData = resolved.data;
        setResolvedDocId(realDocId);
        setRouteMetadata(sharedData);

        // 2. Check if we have static data cached
        if (sharedData.staticRouteData) {
          console.log(`Static route data found in cache`);

          // Check for cached analysis with current settings
          const cachedAnalysis = await getCachedAnalysis(
            realDocId,
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
          realDocId
        );

        setAnalysisData(analysis);
      } catch (err) {
        console.error("Load shared route error:", err);
        setError((err as Error)?.message ?? "Failed to load shared route");
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
    resolvedDocId,
    setRouteMetadata,
    setAnalysisData,
    setOriginalGpxText,
  };
}
