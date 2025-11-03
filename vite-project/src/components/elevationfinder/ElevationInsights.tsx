import { useState, useEffect, useRef, useCallback } from "react";
import { Segment, ElevationAnalysis } from "@/types/elevation";
import {
  TrendingUp,
  MapPin,
  Clock,
  Activity,
  List,
  PieChart as PieChartIcon,
} from "lucide-react";
import AuthGuard from "@/features/auth/AuthGuard";
import { UnifiedDifficultyView } from "./UnifiedDifficultyView";

export interface ElevationInsightsProps {
  elevationInsights: ElevationAnalysis | null;
  loading?: boolean;
  error?: string;
  basePaceMinPerKm?: number;
  onSettingsChange?: (settings: {
    basePaceMinPerKm: number;
    gradeThreshold: number;
  }) => void;
}

const formatTime = (minutes: number) => {
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

const formatPace = (multiplier: number, basePace: number) => {
  const adjustedPace = basePace * multiplier;
  let minutes = Math.floor(adjustedPace);
  let seconds = Math.round((adjustedPace - minutes) * 60);

  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
};

type ViewMode = "unified" | "chronological";

export function ElevationInsights({
  elevationInsights,
  loading = false,
  error,
  basePaceMinPerKm = 5,
  onSettingsChange,
}: ElevationInsightsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [localBasePace, setLocalBasePace] = useState(basePaceMinPerKm);
  const [localGradeThreshold, setLocalGradeThreshold] = useState(2);
  const [localClusterThreshold, setLocalClusterThreshold] = useState(1.5);

  // Rate limiting - prevent spam
  const lastApiCall = useRef<number>(0);
  const MIN_API_INTERVAL = 2000;

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Simple API call with rate limiting
  const handleSliderRelease = useCallback(() => {
    const now = Date.now();

    // Rate limiting - prevent spam
    if (now - lastApiCall.current < MIN_API_INTERVAL) {
      console.log("Rate limited - too soon since last call");
      return;
    }

    if (onSettingsChange) {
      console.log("API call on release:", {
        basePaceMinPerKm: localBasePace,
        gradeThreshold: localGradeThreshold,
      });

      lastApiCall.current = now;
      onSettingsChange({
        basePaceMinPerKm: localBasePace,
        gradeThreshold: localGradeThreshold,
      });
    }
  }, [localBasePace, localGradeThreshold, onSettingsChange]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-pulse">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing elevation profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-800">Analysis Error</h3>
          </div>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!elevationInsights) {
    return (
      <div className="text-gray-500 text-center py-8">
        Upload a GPX file to see elevation insights
      </div>
    );
  }

  const { segments, insights } = elevationInsights;

  return (
    <div className="w-full space-y-6">
      {/* Controls - Fixed slider events */}
      <AuthGuard
        fallback={
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center text-sm text-gray-500">
            Log in to customize pace and grade settings.
          </div>
        }
      >
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Pace: {formatPace(1, localBasePace)}
              </label>
              <input
                type="range"
                min="3"
                max="8"
                step="0.1"
                value={localBasePace}
                onChange={(e) => setLocalBasePace(Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Threshold: {localGradeThreshold}%
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={localGradeThreshold}
                onChange={(e) => setLocalGradeThreshold(Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                For segment difficulty classification
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cluster Tightness: {(4 - localClusterThreshold).toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={localClusterThreshold}
                onChange={(e) =>
                  setLocalClusterThreshold(Number(e.target.value))
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                {localClusterThreshold <= 1 && "Very tight (precise)"}
                {localClusterThreshold > 1 &&
                  localClusterThreshold <= 1.75 &&
                  "Moderate (balanced)"}
                {localClusterThreshold > 1.75 && "Loose (grouped)"}
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>

      {/* Overall Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <MapPin className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Route Overview</h3>
          </div>
          <p className="text-sm text-gray-600">
            Distance: {insights.totalDistance.toFixed(1)} km
          </p>
          <p className="text-sm text-gray-600">
            Elevation Gain: {insights.totalElevationGain.toFixed(0)} m
          </p>
          <p className="text-sm text-gray-600">
            Elevation Loss: {insights.totalElevationLoss.toFixed(0)} m
          </p>
          <p className="text-sm font-medium text-blue-600">
            Difficulty: {insights.difficultyRating}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Terrain Mix</h3>
          </div>
          <p className="text-sm text-gray-600">
            Uphill: {insights.uphillDistance.toFixed(1)} km (
            {((insights.uphillDistance / insights.totalDistance) * 100).toFixed(
              0
            )}
            %)
          </p>
          <p className="text-sm text-gray-600">
            Downhill: {insights.downhillDistance.toFixed(1)} km (
            {(
              (insights.downhillDistance / insights.totalDistance) *
              100
            ).toFixed(0)}
            %)
          </p>
          <p className="text-sm text-gray-600">
            Flat: {insights.flatDistance.toFixed(1)} km (
            {((insights.flatDistance / insights.totalDistance) * 100).toFixed(
              0
            )}
            %)
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Most Challenging</h3>
          </div>
          <p className="text-sm text-gray-600">
            Grade: {insights.steepestUphill.grade?.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            At: KM {insights.steepestUphill.startDistance?.toFixed(0)}
          </p>
          <p className="text-sm text-gray-600">
            Length: {insights.steepestUphill.length?.toFixed(1)} km
          </p>
          <p className="text-sm text-red-600 font-medium">
            Critical race point
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Time Estimate</h3>
          </div>
          <p className="text-lg font-bold text-purple-600">
            {formatTime(insights.estimatedTotalTime)}
          </p>
          <p className="text-sm text-gray-600">
            Based on {localBasePace} min/km base
          </p>
          <p className="text-sm text-gray-600">
            Avg pace:{" "}
            {formatPace(
              insights.estimatedTotalTime /
                insights.totalDistance /
                localBasePace,
              localBasePace
            )}
          </p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setViewMode("unified")}
          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            viewMode === "unified"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border hover:bg-gray-50"
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Difficulty View
        </button>
        <button
          onClick={() => setViewMode("chronological")}
          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            viewMode === "chronological"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border hover:bg-gray-50"
          }`}
        >
          <List className="w-4 h-4" />
          By Kilometer
        </button>
      </div>

      {/* Pacing Strategy */}
      <div className="bg-white rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-500" />
          Kilometer-by-Kilometer Pacing Strategy
        </h3>

        {viewMode === "unified" ? (
          <UnifiedDifficultyView
            segments={segments}
            basePaceMinPerKm={localBasePace}
            totalRaceTime={insights.estimatedTotalTime}
            clusterThreshold={localClusterThreshold}
          />
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedSegment === segment
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                }`}
                onClick={() =>
                  setSelectedSegment(
                    selectedSegment === segment ? null : segment
                  )
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm sm:text-base">
                      KM {segment.startDistance.toFixed(0)} −{" "}
                      {segment.endDistance.toFixed(0)} ({segment.type})
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                      Grade: {segment.grade.toFixed(1)}% • Elevation:{" "}
                      {segment.startElevation.toFixed(0)}m →{" "}
                      {segment.endElevation.toFixed(0)}m
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="font-bold text-gray-800">
                      {formatPace(
                        segment.estimatedTimeMultiplier,
                        localBasePace
                      )}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(
                        segment.length *
                          localBasePace *
                          segment.estimatedTimeMultiplier
                      )}
                    </p>
                  </div>
                </div>

                {selectedSegment === segment && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700 font-medium mb-1">
                        💡 Pacing Strategy
                      </p>
                      <p className="text-sm text-gray-600">
                        {segment.pacingAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ElevationInsights;
