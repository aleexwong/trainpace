/**
 * Elevation Page - Refactored
 * Thin orchestrator that composes the elevation feature
 */

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { getCurrentDocumentId, needsMigration } from "../config/routes";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/ShareButton";
import MapboxRoutePreview from "@/components/utils/MapboxRoutePreview";
import PosterButton from "@/components/poster/PosterButton";
import ElevationInsights from "@/components/elevationfinder/ElevationInsights";

// Feature imports
import {
  DEFAULT_ANALYSIS_SETTINGS,
  type AnalysisSettings,
  type ProfilePoint,
  useRouteLoader,
  useGpxAnalysis,
  useFileUpload,
  GpxUploader,
  RouteResults,
} from "@/features/elevation";

export default function ElevationPage() {
  const { docId: urlDocId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  // Check for Strava import data in location state
  const stravaData = (location.state as any)?.stravaData;
  const autoOpenPoster = (location.state as any)?.autoOpenPoster;

  // Settings state
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>(
    DEFAULT_ANALYSIS_SETTINGS
  );

  // Current document ID (synced with URL)
  const [currentDocId, setCurrentDocId] = useState<string | null>(
    urlDocId || null
  );

  // Initialize hooks
  const { performAnalysis, getCachedAnalysis, handleSettingsChange } =
    useGpxAnalysis();

  // Route loading hook (for shared routes)
  const {
    routeMetadata,
    analysisData: sharedAnalysisData,
    originalGpxText: sharedOriginalGpxText,
    loading: routeLoading,
    error: routeError,
    setRouteMetadata,
    setAnalysisData: setSharedAnalysisData,
    setOriginalGpxText: setSharedOriginalGpxText,
  } = useRouteLoader({
    routeId: urlDocId,
    analysisSettings,
    getCachedAnalysis,
    performAnalysis,
  });

  // File upload hook (for fresh uploads)
  const { handleFileParsed, uploadState, resetUploadState } = useFileUpload({
    analysisSettings,
    performAnalysis,
    onSuccess: (_analysisData, fileData) => {
      // Update current doc ID after successful upload
      if (fileData.docId) {
        setCurrentDocId(fileData.docId);
      }
    },
  });

  // Determine which data source to use (shared route vs fresh upload)
  const isSharedRoute = !!urlDocId;
  const analysisData = isSharedRoute
    ? sharedAnalysisData
    : uploadState.analysisData;
  const points: ProfilePoint[] = isSharedRoute
    ? sharedAnalysisData?.profile || []
    : uploadState.points;
  const filename = isSharedRoute
    ? routeMetadata?.filename || null
    : uploadState.filename;
  const loading = isSharedRoute ? routeLoading : uploadState.loading;
  const error = isSharedRoute ? routeError : uploadState.error;
  const originalGpxText = isSharedRoute
    ? sharedOriginalGpxText
    : uploadState.originalGpxText;

  // Document ID migration redirect logic  
  useEffect(() => {
    // Handle Strava import on mount (ephemeral - no Firestore save)
    if (stravaData && !uploadState.loading) {
      console.log("[Strava Import] Processing imported activity data (temporary import)");
      
      // Process Strava data WITHOUT saving to Firestore
      // Pass empty strings for fileUrl and docId to keep it ephemeral
      handleFileParsed(
        "", // no raw GPX text
        stravaData.metadata.routeName,
        null, // no file URL - indicates ephemeral
        null, // no docId - indicates ephemeral
        stravaData.displayPoints,
        null // no display URL
      );
      
      // Clear location state to prevent re-processing (after a short delay)
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 100);
    }
  }, [stravaData]); // Only depend on stravaData

  // URL migration redirect logic
  useEffect(() => {
    if (!urlDocId) return;

    const currentValidDocId = getCurrentDocumentId(urlDocId);

    if (currentValidDocId !== urlDocId) {
      console.log(
        `🔄 Redirecting outdated document ID: ${urlDocId} → ${currentValidDocId}`
      );
      const newPath = `/elevationfinder/${currentValidDocId}${location.search}`;
      navigate(newPath, { replace: true });
      return;
    }
  }, [urlDocId, navigate, location.search]);

  // Sync currentDocId with URL changes
  useEffect(() => {
    console.log(
      `🔄 URL changed: urlDocId="${urlDocId}", updating currentDocId`
    );
    setCurrentDocId(urlDocId || null);
  }, [urlDocId]);

  // Handle settings change
  const onSettingsChange = async (newSettings: AnalysisSettings) => {
    console.log(`🔧 Settings change requested`);
    setAnalysisSettings(newSettings);

    const { analysisData: newAnalysisData, error: settingsError } =
      await handleSettingsChange(
        newSettings,
        analysisSettings,
        currentDocId,
        routeMetadata,
        originalGpxText,
        filename
      );

    if (newAnalysisData) {
      if (isSharedRoute) {
        setSharedAnalysisData(newAnalysisData);
      }
      // For uploads, the state is managed in the hook
    }

    if (settingsError) {
      console.error("Settings change error:", settingsError);
    }
  };

  // Handle upload new route
  const handleUploadNew = () => {
    setCurrentDocId(null);
    resetUploadState();
    setRouteMetadata(null);
    setSharedAnalysisData(null);
    setSharedOriginalGpxText(null);
    window.history.replaceState(null, "", "/elevationfinder");
  };

  // Handle filename update
  const handleFilenameUpdate = (newFilename: string) => {
    if (routeMetadata) {
      setRouteMetadata({
        ...routeMetadata,
        filename: newFilename,
      });
    }
  };

  // Check if we're in the middle of a migration
  if (urlDocId && needsMigration(urlDocId)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>ElevationFinder | TrainPace - Smarter Race Insights</title>
        <meta
          name="description"
          content="Upload your GPX files to analyze elevation profiles, gain insights, and optimize your training."
        />
        <link rel="canonical" href="/elevationfinder" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
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

        {/* Upload Section (only show if no current route) */}
        {!currentDocId && <GpxUploader onFileParsed={handleFileParsed} />}

        {/* Action Buttons (show when we have a route) */}
        {currentDocId && (
          <div className="text-center space-y-3">
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
              <Button variant="outline" onClick={handleUploadNew}>
                📁 Upload New Route
              </Button>

              <ShareButton docId={currentDocId} />

              <PosterButton
                displayPoints={
                  routeMetadata?.displayPoints ||
                  uploadState.uploadedRoutePoints
                }
                metadata={
                  routeMetadata?.metadata || {
                    routeName: filename || "My Route",
                    totalDistance: analysisData?.totalDistanceKm || 0,
                    elevationGain: analysisData?.elevationGain || 0,
                    maxElevation: null,
                    minElevation: null,
                    pointCount: (
                      routeMetadata?.displayPoints ||
                      uploadState.uploadedRoutePoints
                    ).length,
                    bounds: {
                      minLat: Math.min(
                        ...(
                          routeMetadata?.displayPoints ||
                          uploadState.uploadedRoutePoints
                        ).map((p) => p.lat)
                      ),
                      maxLat: Math.max(
                        ...(
                          routeMetadata?.displayPoints ||
                          uploadState.uploadedRoutePoints
                        ).map((p) => p.lat)
                      ),
                      minLng: Math.min(
                        ...(
                          routeMetadata?.displayPoints ||
                          uploadState.uploadedRoutePoints
                        ).map((p) => p.lng)
                      ),
                      maxLng: Math.max(
                        ...(
                          routeMetadata?.displayPoints ||
                          uploadState.uploadedRoutePoints
                        ).map((p) => p.lng)
                      ),
                    },
                    hasElevationData:
                      analysisData?.metadata?.hasElevationData ?? true,
                  }
                }
                filename={filename || undefined}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Map Preview */}
        {(routeMetadata?.displayPoints ||
          uploadState.uploadedRoutePoints.length > 0) && (
          <MapboxRoutePreview
            routePoints={
              routeMetadata?.displayPoints || uploadState.uploadedRoutePoints
            }
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Route Results */}
        {analysisData && points.length > 0 && (
          <RouteResults
            analysisData={analysisData}
            points={points}
            filename={filename}
            docId={currentDocId}
            isOwner={
              auth.user && routeMetadata
                ? routeMetadata.userId === auth.user.uid
                : false
            }
            onFilenameUpdate={handleFilenameUpdate}
          />
        )}

        {/* Elevation Insights */}
        <ElevationInsights
          elevationInsights={analysisData?.elevationInsights || null}
          loading={loading}
          error={error ? error : undefined}
          basePaceMinPerKm={
            analysisData?.metadata?.analysisParameters?.basePaceMinPerKm ||
            analysisSettings.basePaceMinPerKm
          }
          onSettingsChange={onSettingsChange}
        />

        {/* Development Cache Debug Info */}
        {import.meta.env.MODE === "development" &&
          urlDocId &&
          analysisData?.cacheOptimization && (
            <details className="bg-gray-50 border rounded p-4">
              <summary className="cursor-pointer font-medium text-sm">
                🔧 Cache Debug Info
              </summary>
              <div className="text-xs mt-2 space-y-1">
                <div>Route ID: {urlDocId}</div>
                <div>
                  Cache Key: v1_pace_{analysisSettings.basePaceMinPerKm}_grade_
                  {analysisSettings.gradeThreshold}
                </div>
                <div>
                  Static Data:{" "}
                  {routeMetadata?.staticRouteData ? "✅ Cached" : "❌ Missing"}
                </div>
              </div>
            </details>
          )}
      </div>
    </>
  );
}
