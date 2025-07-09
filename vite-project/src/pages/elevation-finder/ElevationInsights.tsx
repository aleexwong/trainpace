import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Battery,
  MapPin,
  Clock,
  Activity,
} from "lucide-react";

// Types matching your backend response
type SegmentType = "uphill" | "downhill" | "flat";
type ChallengeRating = "easy" | "moderate" | "hard" | "brutal";
type RacePosition = "early" | "mid" | "late";
type EnergyRating = "low" | "medium" | "high";

interface Segment {
  type: SegmentType;
  startDistance: number;
  endDistance: number;
  startElevation: number;
  endElevation: number;
  grade: number;
  length: number;
  energyRating: EnergyRating;
  pacingAdvice: string;
  estimatedTimeMultiplier: number;
  challengeRating: ChallengeRating;
  racePosition: RacePosition;
}

interface RouteInsights {
  totalDistance: number;
  uphillDistance: number;
  downhillDistance: number;
  flatDistance: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  steepestUphill: Partial<Segment>;
  steepestDownhill: Partial<Segment>;
  estimatedTotalTime: number;
  difficultyRating: "Easy" | "Medium" | "Hard";
}

interface ElevationAnalysis {
  segments: Segment[];
  insights: RouteInsights;
}

interface ElevationInsightsProps {
  elevationInsights: ElevationAnalysis | null;
  loading?: boolean;
  error?: string;
  basePaceMinPerKm?: number;
  onSettingsChange?: (settings: {
    basePaceMinPerKm: number;
    gradeThreshold: number;
  }) => void;
}

const getChallengeIcon = (rating: ChallengeRating) => {
  switch (rating) {
    case "easy":
      return <span className="text-green-500">😊</span>;
    case "moderate":
      return <span className="text-yellow-500">😐</span>;
    case "hard":
      return <span className="text-orange-500">😰</span>;
    case "brutal":
      return <span className="text-red-500">💀</span>;
    default:
      return <span className="text-gray-500">-</span>;
  }
};

const getRacePositionColor = (position: RacePosition) => {
  switch (position) {
    case "early":
      return "text-green-600 bg-green-50";
    case "mid":
      return "text-yellow-600 bg-yellow-50";
    case "late":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getSegmentIcon = (type: SegmentType) => {
  switch (type) {
    case "uphill":
      return <TrendingUp className="w-4 h-4" />;
    case "downhill":
      return <TrendingDown className="w-4 h-4" />;
    case "flat":
      return <Minus className="w-4 h-4" />;
  }
};

const getEnergyIcon = (rating: EnergyRating) => {
  switch (rating) {
    case "high":
      return <Battery className="w-4 h-4 text-red-500" />;
    case "medium":
      return <Battery className="w-4 h-4 text-yellow-500" />;
    case "low":
      return <Zap className="w-4 h-4 text-green-500" />;
  }
};

const formatTime = (minutes: number) => {
  const totalMinutes = Math.round(minutes); // round first!
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

export function ElevationInsights({
  elevationInsights,
  loading = false,
  error,
  basePaceMinPerKm = 5,
  onSettingsChange,
}: ElevationInsightsProps) {
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [localBasePace, setLocalBasePace] = useState(basePaceMinPerKm);
  const [localGradeThreshold, setLocalGradeThreshold] = useState(2);

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced settings change
  const debouncedSettingsChange = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (onSettingsChange) {
        console.log("🔄 Calling onSettingsChange with:", {
          basePaceMinPerKm: localBasePace,
          gradeThreshold: localGradeThreshold,
        });
        onSettingsChange({
          basePaceMinPerKm: localBasePace,
          gradeThreshold: localGradeThreshold,
        });
      }
    }, 500); // Wait 500ms after user stops moving slider
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Handle immediate settings change (for onMouseUp/onTouchEnd)
  const handleImmediateSettingsChange = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (onSettingsChange) {
      console.log("⚡ Immediate settings change:", {
        basePaceMinPerKm: localBasePace,
        gradeThreshold: localGradeThreshold,
      });
      onSettingsChange({
        basePaceMinPerKm: localBasePace,
        gradeThreshold: localGradeThreshold,
      });
    }
  };

  const handleSettingsChange = () => {
    if (onSettingsChange) {
      onSettingsChange({
        basePaceMinPerKm: localBasePace,
        gradeThreshold: localGradeThreshold,
      });
    }
  };

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
      {onSettingsChange && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => {
                  setLocalGradeThreshold(Number(e.target.value));
                  debouncedSettingsChange(); // Debounced call on every change
                }}
                onMouseUp={handleImmediateSettingsChange} // Immediate call when released
                onTouchEnd={handleImmediateSettingsChange} // For mobile
                className="w-full"
              />
            </div>
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
                onChange={(e) => {
                  setLocalBasePace(Number(e.target.value));
                  debouncedSettingsChange(); // Debounced call on every change
                }}
                onMouseUp={handleImmediateSettingsChange} // Immediate call when released
                onTouchEnd={handleImmediateSettingsChange} // For mobile
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Overall Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            Race-adjusted difficulty
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
            Based on {basePaceMinPerKm} min/km base
          </p>
          <p className="text-sm text-gray-600">
            Avg pace:{" "}
            {formatPace(
              insights.estimatedTotalTime /
                insights.totalDistance /
                basePaceMinPerKm,
              basePaceMinPerKm
            )}
          </p>
        </div>
      </div>

      {/* Detailed Pacing Strategy */}
      <div className="bg-white rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-800 p-4 border-b flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-500" />
          Kilometer-by-Kilometer Pacing Strategy
        </h3>
        <div className="max-h-96 overflow-y-auto">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                selectedSegment === segment ? "bg-blue-50 border-blue-200" : ""
              }`}
              onClick={() =>
                setSelectedSegment(selectedSegment === segment ? null : segment)
              }
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getSegmentIcon(segment.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-800 capitalize">
                        KM {segment.startDistance.toFixed(0)} -{" "}
                        {segment.endDistance.toFixed(0)} ({segment.type})
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRacePositionColor(
                          segment.racePosition
                        )}`}
                      >
                        {segment.racePosition}
                      </span>
                      {getChallengeIcon(segment.challengeRating)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Elevation: {segment.startElevation.toFixed(0)}m →{" "}
                      {segment.endElevation.toFixed(0)}m
                      <span className="text-gray-400 ml-2">
                        (
                        {segment.endElevation > segment.startElevation
                          ? "+"
                          : ""}
                        {(
                          segment.endElevation - segment.startElevation
                        ).toFixed(0)}
                        m)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {segment.grade.toFixed(1)}% grade
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatPace(
                        segment.estimatedTimeMultiplier,
                        basePaceMinPerKm
                      )}
                    </p>
                    <p className="text-xs font-medium text-gray-700 capitalize">
                      {segment.challengeRating}
                    </p>
                  </div>
                  {getEnergyIcon(segment.energyRating)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    💡 Pacing Strategy
                  </p>
                  <p className="text-sm text-gray-600">
                    {segment.pacingAdvice}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    ⏱️ Time Estimate
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(
                      segment.length *
                        basePaceMinPerKm *
                        segment.estimatedTimeMultiplier
                    )}{" "}
                    for this km
                    <span className="text-gray-400 ml-2">
                      (
                      {formatPace(
                        segment.estimatedTimeMultiplier,
                        basePaceMinPerKm
                      )}
                      )
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ElevationInsights;
