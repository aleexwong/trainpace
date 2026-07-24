/**
 * Elevation Page - Refactored
 * Thin orchestrator that composes the elevation feature
 */

import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { getCurrentDocumentId, needsMigration } from "../config/routes";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/ShareButton";
import { PosterButton } from "@/features/poster";

// Feature imports
import {
  DEFAULT_ANALYSIS_SETTINGS,
  type AnalysisSettings,
  type ProfilePoint,
  useRouteLoader,
  useGpxAnalysis,
  useFileUpload,
  GpxUploader,
  RouteDashboard,
} from "@/features/elevation";

export default function ElevationPage() {
  const { docId: urlDocId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  // Settings state
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>(
    DEFAULT_ANALYSIS_SETTINGS
  );

  // Fresh-upload identity. uploadDocId is the real Firestore id (used for
  // mutations/poster); uploadSlugPath is the pretty "{slug}-{shortId}" segment
  // (used for the share URL).
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [uploadSlugPath, setUploadSlugPath] = useState<string | null>(null);

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
    resolvedDocId,
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
      // Capture both the real doc id and the pretty share path after upload.
      if (fileData.docId) setUploadDocId(fileData.docId);
      if (fileData.displayUrl) {
        setUploadSlugPath(
          fileData.displayUrl.replace(/^\/elevation(finder|-finder)\//, "")
        );
      }
    },
  });

  // Determine which data source to use (shared route vs fresh upload)
  const isSharedRoute = !!urlDocId;

  // Real Firestore doc id for mutations (filename edit, poster, ownership).
  // For shared routes this is the resolved id (the URL may be a pretty slug);
  // for fresh uploads it's the id returned by the uploader.
  const realDocId = isSharedRoute ? resolvedDocId : uploadDocId;

  // Pretty path segment for the share URL: the URL param itself when viewing a
  // shared route, or the slug path captured from a fresh upload.
  const sharePath = isSharedRoute ? urlDocId ?? null : uploadSlugPath;

  // Whether a route is currently loaded (controls uploader vs action buttons).
  const hasRoute = isSharedRoute || !!uploadDocId;
  const analysisData = isSharedRoute
    ? sharedAnalysisData
    : uploadState.analysisData;
  const points: ProfilePoint[] = useMemo(
    () =>
      isSharedRoute ? sharedAnalysisData?.profile || [] : uploadState.points,
    [isSharedRoute, sharedAnalysisData?.profile, uploadState.points]
  );
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

  // Handle settings change
  const onSettingsChange = async (newSettings: AnalysisSettings) => {
    console.log(`🔧 Settings change requested`);
    setAnalysisSettings(newSettings);

    const { analysisData: newAnalysisData, error: settingsError } =
      await handleSettingsChange(
        newSettings,
        analysisSettings,
        realDocId,
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
    setUploadDocId(null);
    setUploadSlugPath(null);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          GPX Elevation Profile Viewer – Free Route Analysis | TrainPace
        </title>
        <meta
          name="description"
          content="Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty. Analyze marathon courses and training routes."
        />
        <link rel="canonical" href="https://trainpace.com/elevationfinder" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Analyze GPX Elevation Profiles",
            description:
              "Upload your GPX file from Strava, Garmin, or any GPS device to visualize elevation gain, grade percentages, and route difficulty.",
            totalTime: "PT1M",
            tool: {
              "@type": "HowToTool",
              name: "TrainPace ElevationFinder",
            },
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Export your GPX file",
                text: "Download your GPX file from Strava, Garmin Connect, COROS, Suunto, or any running app.",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "Upload your GPX file",
                text: "Drag and drop your GPX file onto the upload area, or click to browse from your device.",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "View your elevation profile",
                text: "See your route on an interactive map with total distance, elevation gain/loss, and grade percentages.",
              },
              {
                "@type": "HowToStep",
                position: 4,
                name: "Get terrain insights",
                text: "View segment-by-segment analysis showing flat, rolling, hilly, and steep sections with difficulty ratings.",
              },
              {
                "@type": "HowToStep",
                position: 5,
                name: "Share your route (optional)",
                text: "Sign in to save your route and get a shareable link to send to your running friends.",
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-700 text-center">
          <a
            href="/elevationfinder"
            aria-label="ElevationFinder - Analyze Your GPX Files"
            title="ElevationFinder - Analyze Your GPX Files"
            className="no-underline text-emerald-700 font-bold hover:text-emerald-800 transition-colors"
          >
            ElevationFinder
          </a>
        </h1>

        {/* Upload Section (only show if no current route) */}
        {!hasRoute && <GpxUploader onFileParsed={handleFileParsed} />}

        {/* Action Buttons (show when we have a route) */}
        {hasRoute && (
          <div className="text-center space-y-3">
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
              <Button variant="outline" onClick={handleUploadNew}>
                📁 Upload New Route
              </Button>

              <ShareButton path={sharePath ?? undefined} />

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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Loading a shared route */}
        {loading && !analysisData && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Analyzing elevation profile…</p>
          </div>
        )}

        {/* Route Dashboard */}
        {analysisData && points.length > 0 && (
          <RouteDashboard
            analysisData={analysisData}
            points={points}
            displayPoints={
              routeMetadata?.displayPoints || uploadState.uploadedRoutePoints
            }
            routeName={
              routeMetadata?.metadata?.routeName ||
              analysisData?.raceName ||
              filename ||
              "Your Route"
            }
            filename={filename}
            docId={realDocId}
            isOwner={
              auth.user && routeMetadata
                ? routeMetadata.userId === auth.user.uid
                : false
            }
            basePaceMinPerKm={
              analysisData?.metadata?.analysisParameters?.basePaceMinPerKm ||
              analysisSettings.basePaceMinPerKm
            }
            loading={loading}
            onFilenameUpdate={handleFilenameUpdate}
            onSettingsChange={onSettingsChange}
          />
        )}

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
