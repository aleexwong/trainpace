/**
 * Route Results Component
 * Displays route summary and elevation chart
 */

import { Card, CardContent } from "@/components/ui/card";
import ElevationChart from "@/components/elevationfinder/ElevationChart";
import type { GPXAnalysisResponse, ProfilePoint } from "../types";

interface RouteResultsProps {
  analysisData: GPXAnalysisResponse;
  points: ProfilePoint[];
  filename: string | null;
  docId: string | null;
  isOwner: boolean;
  onFilenameUpdate?: (newFilename: string) => void;
}

export function RouteResults({
  analysisData,
  points,
  filename,
  docId,
  isOwner,
  onFilenameUpdate,
}: RouteResultsProps) {
  return (
    <>
      {/* Route Summary */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Route Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium ml-2">
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
                m*
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
        </CardContent>
      </Card>

      {/* Elevation Chart */}
      {points.length > 0 && (
        <ElevationChart
          points={points}
          filename={filename ?? undefined}
          docId={docId ?? undefined}
          isOwner={isOwner}
          onFilenameUpdate={onFilenameUpdate}
        />
      )}
    </>
  );
}
