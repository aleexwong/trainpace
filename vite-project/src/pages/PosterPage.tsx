/**
 * Poster Generation Page
 * Dedicated page for generating course posters from imported data
 * (Strava imports, direct GPX, etc.)
 */

import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PosterGeneratorV3 from "@/components/poster/PosterGeneratorV3";

interface PosterData {
  displayPoints: Array<{ lat: number; lng: number; ele?: number }>;
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    maxElevation: number | null;
    minElevation: number | null;
    pointCount: number;
    hasElevationData: boolean;
    bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
  activity?: {
    date: string;
    movingTime: number;
    formattedTime: string;
    city: string;
    type: string;
    stravaId: number;
  };
  source?: "strava" | "upload";
}

export default function PosterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [posterData, setPosterData] = useState<PosterData | null>(null);

  // Get data from location state
  useEffect(() => {
    const data = (location.state as any)?.posterData;
    
    if (!data) {
      console.log("[Poster] No data provided, redirecting to dashboard");
      navigate("/dashboard");
      return;
    }

    console.log("[Poster] Loaded poster data:", data.metadata.routeName);
    setPosterData(data);

    // Clear location state after loading to prevent re-processing
    navigate(location.pathname, { replace: true, state: {} });
  }, []);

  if (!posterData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poster generator...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Generate Poster - {posterData.metadata.routeName} | TrainPace</title>
        <meta
          name="description"
          content={`Create a custom course poster for ${posterData.metadata.routeName}`}
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {posterData.metadata.routeName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{posterData.metadata.totalDistance.toFixed(2)} km</span>
                  <span>•</span>
                  <span>{posterData.metadata.elevationGain}m elevation</span>
                  {posterData.source === "strava" && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FC4C02">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                        Imported from Strava
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Poster Generator */}
          <PosterGeneratorV3
            displayPoints={posterData.displayPoints}
            metadata={{
              routeName: posterData.metadata.routeName,
              totalDistance: posterData.metadata.totalDistance,
              elevationGain: posterData.metadata.elevationGain,
              maxElevation: posterData.metadata.maxElevation,
              minElevation: posterData.metadata.minElevation,
              pointCount: posterData.metadata.pointCount,
              bounds: posterData.metadata.bounds,
              hasElevationData: posterData.metadata.hasElevationData,
            }}
            filename={posterData.metadata.routeName}
          />

          {/* Pro tip */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Pro tip:</strong> Adjust the map view by dragging and zooming
              to frame your route perfectly. The poster will be generated exactly as you
              see it here at 300 DPI print quality.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
