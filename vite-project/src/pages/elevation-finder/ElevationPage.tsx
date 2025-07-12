import { useEffect, useState } from "react";
import ElevationChart from "./ElevationChart";
import GpxUploader from "./GpxUploader";
import ElevationInsights from "./ElevationInsights";
import MapboxRoutePreview from "./MapboxRoutePreview";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";

type ProfilePoint = { distanceKm: number; elevation: number };

// Type for the full API response
interface GPXAnalysisResponse {
  message: string;
  raceName: string;
  goalPace: number;
  totalDistanceKm: number;
  elevationGain: number;
  profile: ProfilePoint[];
  elevationInsights: {
    segments: Array<any>;
    insights: any;
  } | null;
  metadata: {
    pointCount: number;
    hasElevationData: boolean;
    analysisParameters: {
      basePaceMinPerKm: number;
      gradeThreshold: number;
    };
  };
}

interface RouteMetadata {
  id: string;
  filename: string;
  safeFilename: string;
  uploadedAt: any;
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    pointCount: number;
    bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
  displayPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
    dist?: number;
  }>;
  displayUrl: string;
  fileUrl: string;
}

export default function ElevationPage() {
  const [points, setPoints] = useState<ProfilePoint[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { docId } = useParams();

  // NEW: Store the full API response including elevation insights
  const [analysisData, setAnalysisData] = useState<GPXAnalysisResponse | null>(
    null
  );
  // NEW: Store the route metadata for display
  const [routeMetadata, setRouteMetadata] = useState<RouteMetadata | null>(
    null
  );

  const [uploadedRoutePoints, setUploadedRoutePoints] = useState<
    Array<{
      lat: number;
      lng: number;
      ele?: number;
    }>
  >([]);

  // IMPORTANT: Store the original GPX text for re-analysis
  const [originalGpxText, setOriginalGpxText] = useState<string | null>(null);

  // NEW: Settings for elevation analysis
  const [analysisSettings, setAnalysisSettings] = useState({
    basePaceMinPerKm: 5,
    gradeThreshold: 2,
  });

  useEffect(() => {
    const loadSharedRoute = async () => {
      if (!docId) return;

      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, "gpx_uploads", docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Shared route not found in Firestore");
        }

        const sharedData = docSnap.data();
        setRouteMetadata(sharedData as RouteMetadata);

        let gpxText = sharedData.content;

        if (!gpxText && sharedData.storageRef) {
          const storageUrl = await getDownloadURL(
            ref(storage, sharedData.storageRef)
          );
          const res = await fetch(storageUrl);
          if (!res.ok)
            throw new Error(
              `Failed to fetch GPX from storage (HTTP ${res.status})`
            );
          gpxText = await res.text();
        }

        if (!gpxText || gpxText.length < 10) {
          throw new Error("GPX file content is missing or too short.");
        }

        const apiRes = await fetch(
          "https://gpx-insight-api.vercel.app/api/analyze-gpx",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gpx: gpxText,
              goalPace: 5, // default base pace, or pull from settings
              raceName: sharedData.filename || "Shared Upload",
            }),
          }
        );

        const backendText = await apiRes.text();

        if (!apiRes.ok)
          throw new Error(`Backend analysis failed (HTTP ${apiRes.status})`);

        const analysis = JSON.parse(backendText);

        setFilename(sharedData.filename);
        setOriginalGpxText(gpxText);
        setAnalysisData(analysis);
        setPoints(analysis.profile || []);
      } catch (err: any) {
        setError(err.message || "Failed to load shared route");
      } finally {
        setLoading(false);
      }
    };

    loadSharedRoute();
  }, [docId]);

  // ✅ UPDATE: Fix the function signature to match GpxUploader
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

    // ✅ STORE UPLOADED ROUTE POINTS IMMEDIATELY
    if (displayPoints && displayPoints.length > 0) {
      setUploadedRoutePoints(displayPoints);
    }

    // Store the original GPX text
    setOriginalGpxText(gpxText);

    try {
      const response = await fetch(
        "https://gpx-insight-api.vercel.app/api/analyze-gpx",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpx: gpxText,
            goalPace: analysisSettings.basePaceMinPerKm,
            raceName: "User Upload",
            basePaceMinPerKm: analysisSettings.basePaceMinPerKm,
            gradeThreshold: analysisSettings.gradeThreshold,
            includeElevationInsights: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API error");
      }

      const data: GPXAnalysisResponse = await response.json();

      // Store both the points and the full analysis
      setPoints(data.profile || []);
      setAnalysisData(data);
    } catch (err: any) {
      setError(err.message);
      console.error("GPX Analysis Error:", err);
      console.log(fileUrl, docId, displayUrl, displayPoints);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle settings changes and re-analyze
  const handleSettingsChange = async (newSettings: {
    basePaceMinPerKm: number;
    gradeThreshold: number;
  }) => {
    // GUARD: Make sure we have the original GPX text
    if (!originalGpxText || !analysisData) {
      setError("Cannot re-analyze: original GPX data not available");
      return;
    }

    // IMPORTANT: Update settings FIRST, then re-analyze
    setAnalysisSettings(newSettings);

    // Re-analyze with new settings using ORIGINAL GPX text
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://gpx-insight-api.vercel.app/api/analyze-gpx",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpx: originalGpxText,
            goalPace: newSettings.basePaceMinPerKm,
            raceName: analysisData.raceName,
            basePaceMinPerKm: newSettings.basePaceMinPerKm,
            gradeThreshold: newSettings.gradeThreshold,
            includeElevationInsights: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to re-analyze");
      }

      const data: GPXAnalysisResponse = await response.json();
      setAnalysisData(data);
      setPoints(data.profile || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Re-analysis Error:", err);
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
        <link rel="canonical" href="/elevation-finder" />
      </Helmet>
      <div className="max-w-6xlmx-auto p-6 space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-700 text-center">
          <a
            href="/elevationfinder"
            aria-label="ElevationFinder - Analyze Your GPX Files"
            title="ElevationFinder - Analyze Your GPX Files"
            className="no-underline text-blue-700 font-bold hover:text-blue-800 transition-colors"
          >
            ElevationFinder
          </a>
        </h1>{" "}
        {!docId && <GpxUploader onFileParsed={handleFileParsed} />}
        {/* Only show map when we have route data */}
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
          />
        )}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700">Analyzing GPX file...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}
        {/* Show basic route info */}
        {analysisData && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Route Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium ml-2">
                  {analysisData.totalDistanceKm} km
                </span>
              </div>
              <div>
                <span className="text-gray-600">Elevation Gain:</span>
                <span className="font-medium ml-2">
                  {analysisData.elevationGain} m
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
          </div>
        )}
        {/* Elevation Chart */}
        {points.length > 0 && (
          <ElevationChart points={points} filename={filename ?? undefined} />
        )}
        {/* FIXED: Use the pace that backend actually used */}
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
        {/* Debug info (remove in production)
        {process.env.NODE_ENV === "development" && analysisData && (
          <details className="bg-gray-50 border rounded p-4">
            <summary className="cursor-pointer font-medium">
              Debug: API Response
            </summary>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </details>
        )} */}
      </div>
    </>
  );
}
