import { useEffect, useState } from "react";
import {
  ProfilePoint,
  GPXAnalysisResponse,
  OptimizedRouteMetadata,
} from "@/types/elevation";

import ElevationChart from "@/components/elevationfinder/ElevationChart";
import GpxUploader from "@/components/elevationfinder/GpxUploader";
import ElevationInsights from "@/components/elevationfinder/ElevationInsights";
import MapboxRoutePreview from "@/components/utils/MapboxRoutePreview";
import { ShareLinkBox } from "@/components/ui/ShareLinkBox";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { useAuth } from "@/features/auth/AuthContext";

export default function ElevationPage() {
  const [points, setPoints] = useState<ProfilePoint[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { docId: urlDocId } = useParams();
  const auth = useAuth();

  const [currentDocId, setCurrentDocId] = useState<string | null>(
    urlDocId || null
  );

  const [analysisData, setAnalysisData] = useState<GPXAnalysisResponse | null>(
    null
  );
  const [routeMetadata, setRouteMetadata] =
    useState<OptimizedRouteMetadata | null>(null);

  const [uploadedRoutePoints, setUploadedRoutePoints] = useState<
    Array<{ lat: number; lng: number; ele?: number }>
  >([]);

  const [originalGpxText, setOriginalGpxText] = useState<string | null>(null);

  const [analysisSettings, setAnalysisSettings] = useState({
    basePaceMinPerKm: 5,
    gradeThreshold: 2,
  });

  // 🚀 Sync currentDocId with URL changes
  useEffect(() => {
    setCurrentDocId(urlDocId || null);
  }, [urlDocId]);

  // 🚀 Cache key generation
  const getCacheKey = (settings: {
    basePaceMinPerKm: number;
    gradeThreshold: number;
  }) => {
    return `v1_pace_${settings.basePaceMinPerKm}_grade_${settings.gradeThreshold}`;
  };

  // 🚀 Check for cached analysis results
  const getCachedAnalysis = async (
    routeId: string,
    settings: { basePaceMinPerKm: number; gradeThreshold: number },
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
        console.log(`❌ Cache miss for ${cacheKey}`);
        return null;
      }

      const cached = cacheSnap.data();

      // Check expiration
      if (new Date(cached.expiresAt) < new Date()) {
        console.log(`⏰ Cache expired for ${cacheKey}, cleaning up...`);
        await deleteDoc(cacheRef);
        return null;
      }

      console.log(`✅ Cache hit for ${cacheKey} - saved API call!`);

      // Reconstruct full API response from cache + static data
      const reconstructed: GPXAnalysisResponse = {
        message: "Loaded from optimized cache",
        raceName: routeMetadata?.filename || "Cached Route",
        goalPace: settings.basePaceMinPerKm,
        totalDistanceKm: staticData.totalDistance,
        elevationGain: staticData.totalElevationGain,
        profile: staticData.elevationProfile,
        elevationInsights: {
          segments: cached.analysisResults.segmentClassifications.map(
            (seg: any, index: number) => ({
              // Combine cached analysis with static segment data
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
          cacheStats: {
            fullResponseSize: 0,
            staticDataSize: cached.staticDataSize || 0,
            analysisDataSize: cached.analysisDataSize || 0,
            compressionRatio: 0,
          },
        },
      };

      return reconstructed;
    } catch (error) {
      console.error("Cache lookup failed:", error);
      return null;
    }
  };

  // 🚀 Cache analysis results from API response
  const cacheAnalysisResults = async (
    routeId: string,
    apiResponse: GPXAnalysisResponse
  ) => {
    try {
      if (!apiResponse.cacheOptimization) {
        console.warn("API response missing cache optimization data");
        return;
      }

      const { analysisResults, settings, cacheStats } =
        apiResponse.cacheOptimization;
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
            Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          // NOTE: This is basically "never expire" — we'll bump version keys (v2, v3) if logic changes.
          // Cleanup? Future me can worry about it... or not.
          staticDataSize: cacheStats.staticDataSize,
          analysisDataSize: cacheStats.analysisDataSize,
        }
      );
      console.log(
        `💾 Cached analysis: ${(cacheStats.analysisDataSize / 1024).toFixed(
          1
        )}KB for ${cacheKey}`
      );
      console.log(
        `📊 Cache efficiency: ${(cacheStats.compressionRatio * 100).toFixed(
          1
        )}% potential savings`
      );
    } catch (error) {
      console.error("Failed to cache analysis:", error);
    }
  };

  // 🚀 Store static route data from API response
  const cacheStaticData = async (
    routeId: string,
    apiResponse: GPXAnalysisResponse
  ) => {
    try {
      if (!apiResponse.cacheOptimization) {
        console.warn("API response missing cache optimization data");
        return;
      }

      const { staticRouteData, cacheStats } = apiResponse.cacheOptimization;

      await updateDoc(doc(db, "gpx_uploads", routeId), {
        staticRouteData,
        staticDataCached: new Date().toISOString(),
        staticDataSize: cacheStats.staticDataSize,
      });

      console.log(
        `💾 Cached static data: ${(cacheStats.staticDataSize / 1024).toFixed(
          1
        )}KB`
      );
    } catch (error) {
      console.error("Failed to cache static data:", error);
    }
  };

  // 🚀 Call API with cost tracking
  const performAnalysisWithCaching = async (
    gpxText: string,
    settings: { basePaceMinPerKm: number; gradeThreshold: number },
    filename: string,
    routeId?: string
    // displayPoints?: Array<{ lat: number; lng: number; ele?: number }>
  ): Promise<GPXAnalysisResponse> => {
    const idToken = auth.user ? await auth.user.getIdToken() : null;
    const response = await fetch(
      // "https://api.trainpace.com/api/analyze-gpx-cache",
      "http://localhost:3000/api/analyze-gpx-cache",
      {
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
          routeId: routeId, // Add routeId to API call
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json(); // 👈 parse the JSON body

      throw new Error(
        `API error: ${response.statusText} try again in ${errorData.retryAfter} in seconds`
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
  };

  // 🚀 Load shared route with smart caching
  useEffect(() => {
    const loadSharedRoute = async () => {
      if (!urlDocId) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Load route metadata
        const docRef = doc(db, "gpx_uploads", urlDocId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Shared route not found");
        }

        const sharedData = docSnap.data() as OptimizedRouteMetadata;
        setRouteMetadata(sharedData);
        setFilename(sharedData.filename);

        // 2. Check if we have static data cached
        if (sharedData.staticRouteData) {
          console.log(`📊 Static route data found in cache`);

          // Check for cached analysis with current settings
          const cachedAnalysis = await getCachedAnalysis(
            urlDocId,
            analysisSettings,
            sharedData.staticRouteData
          );

          if (cachedAnalysis) {
            console.log(`⚡ Instant load from cache!`);
            setAnalysisData(cachedAnalysis);
            setPoints(cachedAnalysis.profile || []);
            setLoading(false);
            return;
          }
        }

        // 3. Cache miss or no static data - call API
        console.log(`💸 Cache miss - calling API...`);

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
        const analysis = await performAnalysisWithCaching(
          gpxText,
          analysisSettings,
          sharedData.filename,
          urlDocId ?? undefined
        );

        setAnalysisData(analysis);
        setPoints(analysis.profile || []);
      } catch (err: any) {
        console.error("Load shared route error:", err);
        setError(err.message || "Failed to load shared route");
      } finally {
        setLoading(false);
      }
    };

    loadSharedRoute();
  }, [urlDocId]); // Don't include analysisSettings here - handle separately

  const handleSettingsChange = async (newSettings: {
    basePaceMinPerKm: number;
    gradeThreshold: number;
  }) => {
    console.log(`🔄 Settings change requested:`);
    console.log(
      `   From: pace=${analysisSettings.basePaceMinPerKm}, grade=${analysisSettings.gradeThreshold}`
    );
    console.log(
      `   To: pace=${newSettings.basePaceMinPerKm}, grade=${newSettings.gradeThreshold}`
    );

    const oldCacheKey = getCacheKey(analysisSettings);
    const newCacheKey = getCacheKey(newSettings);
    console.log(`   Cache keys: ${oldCacheKey} → ${newCacheKey}`);
    console.log(`   Same key: ${oldCacheKey === newCacheKey}`);

    setAnalysisSettings(newSettings);

    // For shared routes, check cache with new settings
    if (urlDocId && routeMetadata) {
      setLoading(true);
      setError(null);

      try {
        // 1. Check cache for new settings first
        if (routeMetadata.staticRouteData) {
          console.log(`🔍 Checking cache for new settings...`);
          console.log(`   Route ID: ${urlDocId}`);
          console.log(
            `   Static data available: ${!!routeMetadata.staticRouteData}`
          );

          const cachedForNewSettings = await getCachedAnalysis(
            urlDocId,
            newSettings,
            routeMetadata.staticRouteData
          );

          if (cachedForNewSettings) {
            console.log(`✅ Using cached analysis for new settings`);
            setAnalysisData(cachedForNewSettings);
            setPoints(cachedForNewSettings.profile || []);
            setLoading(false);
            return;
          } else {
            console.log(`❌ No cache found for new settings, will call API`);
          }
        } else {
          console.log(`⚠️ No static route data available for cache lookup`);
        }

        // 2. Cache miss - need fresh analysis, get GPX content
        let gpxText = originalGpxText;

        // 🚀 FIX: Multiple fallback methods to get GPX content
        if (!gpxText) {
          console.log(
            "🔄 originalGpxText not available, trying fallback methods..."
          );

          // Method 1: Try route metadata content (stored for small files)
          if (routeMetadata.content) {
            console.log("✅ Using GPX content from route metadata");
            gpxText = routeMetadata.content;
          }
          // Method 2: Fetch from Firebase Storage
          else if (routeMetadata.storageRef) {
            console.log("🔄 Fetching GPX content from Firebase Storage...");
            const storageUrl = await getDownloadURL(
              ref(storage, routeMetadata.storageRef)
            );
            const response = await fetch(storageUrl);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch GPX from storage: HTTP ${response.status}`
              );
            }
            gpxText = await response.text();

            // 🚀 IMPORTANT: Store it for next time
            setOriginalGpxText(gpxText);
          }
          // Method 3: Try direct file URL (last resort)
          else if (routeMetadata.fileUrl) {
            console.log("🔄 Trying direct fetch from file URL...");
            const response = await fetch(routeMetadata.fileUrl);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch GPX from file URL: HTTP ${response.status}`
              );
            }
            gpxText = await response.text();

            // 🚀 IMPORTANT: Store it for next time
            setOriginalGpxText(gpxText);
          }
        }

        // 3. Final check - do we have GPX content?
        if (!gpxText || gpxText.length < 10) {
          throw new Error("Could not retrieve GPX content for re-analysis");
        }

        console.log(`🔄 Cache miss for new settings, calling API...`);
        const analysis = await performAnalysisWithCaching(
          gpxText,
          newSettings,
          filename || "Route",
          urlDocId
        );

        setAnalysisData(analysis);
        setPoints(analysis.profile || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Re-analysis Error:", err);
      } finally {
        setLoading(false);
      }
    } else if (originalGpxText) {
      // For non-shared routes, just re-analyze
      setLoading(true);
      try {
        const analysis = await performAnalysisWithCaching(
          originalGpxText,
          newSettings,
          filename || "Route"
        );
        setAnalysisData(analysis);
        setPoints(analysis.profile || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // 🚀 Handle case where no GPX data is available at all
      console.warn(
        "⚠️ No GPX data available for re-analysis - this shouldn't happen"
      );
      setError(
        "Cannot change settings: route data not available. Please refresh the page."
      );
    }
  };
  // 🚀 Handle fresh file uploads
  const handleFileParsed = async (
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
    console.log(`📂 File parsed: ${fileUrl}`);
    console.log(`📄 GPX Text Length: ${displayUrl} characters`);
    console.log(`🆔 New docId from upload: ${docId}`);
    console.log(`🔗 Current URL docId: ${urlDocId}`);

    if (displayPoints && displayPoints.length > 0) {
      setUploadedRoutePoints(displayPoints);
    }

    setOriginalGpxText(gpxText);

    // 🚀 NEW: Update URL immediately after upload to enable sharing
    if (docId && !urlDocId) {
      console.log(
        `🔗 Updating URL to show shareable link: /elevation-finder/${docId}`
      );
      window.history.replaceState(null, "", `/elevation-finder/${docId}`);
      // Update our state to reflect the new docId
      setCurrentDocId(docId);
    }

    try {
      // For fresh uploads, always analyze
      const analysis = await performAnalysisWithCaching(
        gpxText,
        analysisSettings,
        filename,
        docId || undefined // Ensure we pass the docId when available
      );

      setPoints(analysis.profile || []);
      setAnalysisData(analysis);
    } catch (err: any) {
      setError(err.message);
      console.error("GPX Analysis Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>ElevationFinder | TrainPace - Smarter Race Insights</title>
        <meta
          name="description"
          content="Upload your GPX files to analyze elevation profiles, gain insights, and optimize your training."
        />
        <title>ElevationFinder | TrainPace - Smarter Race Insights</title>
        <meta property="og:title" content="hihi" />
        <meta property="og:description" content="testing elevationfinder" />
        {/* Add other OG tags as needed, e.g., og:type */}
        <link rel="canonical" href="/elevationfinder" />
      </Helmet>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-700 text-center">
          <a
            href="/elevationfinder"
            aria-label="ElevationFinder - Analyze Your GPX Files"
            title="ElevationFinder - Analyze Your GPX Files"
            className="no-underline text-blue-700 font-bold hover:text-blue-800 transition-colors"
          >
            ElevationFinder
          </a>
        </h1>

        {!currentDocId && <GpxUploader onFileParsed={handleFileParsed} />}

        {/* Show "Upload New Route" button when we have a current route */}
        {currentDocId && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                // Reset everything and go back to upload state
                setCurrentDocId(null);
                setPoints([]);
                setAnalysisData(null);
                setRouteMetadata(null);
                setUploadedRoutePoints([]);
                setOriginalGpxText(null);
                setFilename(null);
                setError(null);
                // Update URL to remove docId
                window.history.replaceState(null, "", "/elevationfinder");
              }}
              className="mb-4"
            >
              📁 Upload New Route
            </Button>
          </div>
        )}

        {/* Show map when we have route data */}
        {(routeMetadata?.displayPoints || uploadedRoutePoints.length > 0) && (
          <MapboxRoutePreview
            routePoints={routeMetadata?.displayPoints || uploadedRoutePoints}
            routeName={
              routeMetadata?.metadata?.routeName ||
              analysisData?.raceName ||
              filename ||
              "Your Route"
            }
            height="400px"
            width="100%"
            showStartEnd={true}
            className="border border-gray-200"
            lineColor="#3b82f6"
            lineWidth={3}
            mapStyle="mapbox://styles/mapbox/outdoors-v11"
            maxZoom={16}
          />
        )}
        {/* Show share link box if we have a docId */}
        {currentDocId && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="font-semibold text-gray-800 mb-2">
              Share Your Route
            </h2>
            {import.meta.env.MODE === "development" && (
              <div className="text-xs text-gray-500 mb-2">
                Debug: currentDocId = {currentDocId}, urlDocId = {urlDocId}
              </div>
            )}
            <ShareLinkBox docId={currentDocId} />
          </div>
        )}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700">
              {urlDocId ? "Loading analysis..." : "Analyzing GPX file..."}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Route Summary with Cache Performance */}
        {analysisData && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Route Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium ml-2">
                  {/* {analysisData.totalDistanceKm} km* */}
                  {Number.isFinite(analysisData.totalDistanceKm) &&
                  analysisData.totalDistanceKm >= 0
                    ? analysisData.totalDistanceKm.toFixed(2)
                    : "0"}{" "}
                  km*
                </span>
              </div>
              <div>
                <span className="text-gray-600">Elevation Gain:</span>
                <span className="font-medium ml-2">
                  {Number.isFinite(analysisData.elevationGain) &&
                  analysisData.elevationGain >= 0
                    ? analysisData.elevationGain.toFixed(0)
                    : "0"}{" "}
                  m*{" "}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Data Points:</span>
                <span className="font-medium ml-2">
                  {analysisData.metadata.pointCount}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Elevation Data:</span>
                <span className="font-medium ml-2">
                  {analysisData.metadata.hasElevationData ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-end items-center text-xs text-gray-500">
                * all values are approximates
              </div>
            </div>
          </div>
        )}

        {/* Elevation Chart */}
        {points.length > 0 && (
          <ElevationChart points={points} filename={filename ?? undefined} />
        )}

        <ElevationInsights
          elevationInsights={analysisData?.elevationInsights || null}
          loading={loading}
          error={error ? error : undefined}
          basePaceMinPerKm={
            analysisData?.metadata?.analysisParameters?.basePaceMinPerKm ||
            analysisSettings.basePaceMinPerKm
          }
          onSettingsChange={handleSettingsChange}
        />

        {/* 🚀 NEW: Development cache debug info */}
        {import.meta.env.MODE === "development" &&
          urlDocId &&
          analysisData?.cacheOptimization && (
            <details className="bg-gray-50 border rounded p-4">
              <summary className="cursor-pointer font-medium text-sm">
                🔧 Cache Debug Info
              </summary>
              <div className="text-xs mt-2 space-y-1">
                <div>Route ID: {urlDocId}</div>
                <div>Cache Key: {getCacheKey(analysisSettings)}</div>
                <div>
                  Static Data:{" "}
                  {routeMetadata?.staticRouteData ? "✅ Cached" : "❌ Missing"}
                </div>
                <div>
                  Response Size:{" "}
                  {(
                    analysisData.cacheOptimization.cacheStats.fullResponseSize /
                    1024
                  ).toFixed(1)}
                  KB
                </div>
                <div>
                  Static Size:{" "}
                  {(
                    analysisData.cacheOptimization.cacheStats.staticDataSize /
                    1024
                  ).toFixed(1)}
                  KB
                </div>
                <div>
                  Analysis Size:{" "}
                  {(
                    analysisData.cacheOptimization.cacheStats.analysisDataSize /
                    1024
                  ).toFixed(1)}
                  KB
                </div>
              </div>
            </details>
          )}
      </div>
    </>
  );
}
