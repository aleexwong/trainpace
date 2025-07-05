import { useState } from "react";
import ElevationChart from "./ElevationChart";
import GpxUploader from "./GpxUploader";
import ElevationInsights from "./ElevationInsights";
import { Helmet } from "react-helmet";

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

export default function ElevationPage() {
  const [points, setPoints] = useState<ProfilePoint[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Store the full API response including elevation insights
  const [analysisData, setAnalysisData] = useState<GPXAnalysisResponse | null>(
    null
  );

  // IMPORTANT: Store the original GPX text for re-analysis
  const [originalGpxText, setOriginalGpxText] = useState<string | null>(null);

  // NEW: Settings for elevation analysis
  const [analysisSettings, setAnalysisSettings] = useState({
    basePaceMinPerKm: 5,
    gradeThreshold: 2,
  });

  const handleFileParsed = async (gpxText: string, filename: string) => {
    setLoading(true);
    setError(null);
    setFilename(filename);

    // IMPORTANT: Store the original GPX text
    setOriginalGpxText(gpxText);

    try {
      // FIXED: Use the correct endpoint and include elevation insights parameters
      const response = await fetch("http://localhost:3000/api/analyze-gpx", {
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
      });

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
      const response = await fetch("http://localhost:3000/api/analyze-gpx", {
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to re-analyze");
      }

      const data: GPXAnalysisResponse = await response.json();
      setAnalysisData(data);
      setPoints(data.profile || []);

      // DEBUGGING: Log to see what's happening
      console.log("New settings:", newSettings);
      console.log(
        "Backend response basePace:",
        data.metadata?.analysisParameters?.basePaceMinPerKm
      );
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
        <title>ElevationFinder - Analyze Your Next Race</title>
        <meta
          name="description"
          content="Upload your GPX files to analyze elevation profiles, gain insights, and optimize your training."
        />
        <link rel="canonical" href="/elevation-finder" />
      </Helmet>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-5xl font-bold text-blue-700">ElevationFinder</h1>

        <GpxUploader onFileParsed={handleFileParsed} />

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

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === "development" && analysisData && (
          <details className="bg-gray-50 border rounded p-4">
            <summary className="cursor-pointer font-medium">
              Debug: API Response
            </summary>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(analysisData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </>
  );
}
