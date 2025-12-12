/**
 * Strava Activity Card Component
 * Displays a single Strava activity with thumbnail and stats
 */

import { Calendar, TrendingUp, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StravaActivity } from "../hooks/useStravaActivities";

interface StravaActivityCardProps {
  activity: StravaActivity;
  onImport?: (activity: StravaActivity) => void;
  showImportButton?: boolean;
}

// Activity type icons and colors
const activityStyles: Record<string, { emoji: string; color: string }> = {
  Run: { emoji: "🏃", color: "text-orange-600" },
  Ride: { emoji: "🚴", color: "text-blue-600" },
  Hike: { emoji: "🥾", color: "text-green-600" },
  Walk: { emoji: "🚶", color: "text-gray-600" },
  Swim: { emoji: "🏊", color: "text-cyan-600" },
  default: { emoji: "🏃", color: "text-gray-600" },
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPace(paceMinPerKm: number | null): string {
  if (!paceMinPerKm) return "—";
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export function StravaActivityCard({
  activity,
  onImport,
  showImportButton = true,
}: StravaActivityCardProps) {
  const style = activityStyles[activity.type] || activityStyles.default;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" role="img" aria-label={activity.type}>
                {style.emoji}
              </span>
              <span className={`text-xs font-medium ${style.color}`}>
                {activity.type}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">
              {activity.name}
            </h3>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Distance */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900">
                {activity.distanceKm} km
              </div>
              <div className="text-xs text-gray-500">
                {activity.distanceMiles} mi
              </div>
            </div>
          </div>

          {/* Moving Time */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900">
                {formatTime(activity.movingTime)}
              </div>
              <div className="text-xs text-gray-500">Moving time</div>
            </div>
          </div>

          {/* Elevation */}
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900">
                {activity.elevationGain}m
              </div>
              <div className="text-xs text-gray-500">Elevation</div>
            </div>
          </div>

          {/* Pace/Speed */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 text-lg flex-shrink-0">⚡</span>
            <div>
              <div className="font-semibold text-gray-900">
                {activity.type === "Run" || activity.type === "Hike"
                  ? formatPace(activity.averagePace)
                  : `${(activity.averageSpeed * 3.6).toFixed(1)} km/h`}
              </div>
              <div className="text-xs text-gray-500">
                {activity.type === "Run" || activity.type === "Hike"
                  ? "Pace"
                  : "Speed"}
              </div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 border-t pt-3">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(activity.startDateLocal)}</span>
        </div>

        {/* GPS Status & Import Button */}
        <div className="flex items-center justify-between gap-2">
          {activity.hasGps ? (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              GPS data available
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
              No GPS data
            </span>
          )}

          {showImportButton && activity.hasGps && onImport && (
            <Button
              size="sm"
              onClick={() => onImport(activity)}
              className="text-xs"
              disabled={!activity.hasGps}
            >
              Import
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
