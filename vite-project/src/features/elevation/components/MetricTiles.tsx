/**
 * MetricTiles
 * At-a-glance dashboard tiles summarizing a route's key metrics. Surfaces the
 * steepest descent (previously loaded but never rendered) alongside the climb.
 */
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Gauge,
} from "lucide-react";
import type { RouteInsights } from "@/types/elevation";
import {
  formatTime,
  formatPace,
  formatElevation,
  formatDistance,
} from "@/utils/difficulty";

interface MetricTilesProps {
  insights: RouteInsights;
  basePaceMinPerKm: number;
  // Total time derived from the current segments + live base pace (passed in so
  // it tracks the base-pace slider rather than the stale server estimate).
  estimatedTotalTime: number;
}

function Tile({
  icon,
  label,
  value,
  sub,
  accent = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
      <div className="flex items-center gap-2 mb-1 text-gray-600">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className={`text-xl sm:text-2xl font-bold ${accent}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500 mt-0.5">{sub}</span>}
    </div>
  );
}

export function MetricTiles({
  insights,
  basePaceMinPerKm,
  estimatedTotalTime,
}: MetricTilesProps) {
  const { steepestUphill, steepestDownhill } = insights;

  // Average pace as a multiplier of base pace (avg min/km = totalTime/distance).
  const avgPaceMultiplier =
    insights.totalDistance > 0
      ? estimatedTotalTime / insights.totalDistance / basePaceMinPerKm
      : 1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <Tile
        icon={<MapPin className="w-4 h-4 text-blue-500" />}
        label="Distance"
        value={formatDistance(insights.totalDistance)}
      />
      <Tile
        icon={<Clock className="w-4 h-4 text-purple-500" />}
        label="Est. Time"
        value={formatTime(estimatedTotalTime)}
        sub={`at ${formatPace(1, basePaceMinPerKm)} base`}
        accent="text-purple-600"
      />
      <Tile
        icon={<Gauge className="w-4 h-4 text-indigo-500" />}
        label="Avg Pace"
        value={formatPace(avgPaceMultiplier, basePaceMinPerKm)}
      />
      <Tile
        icon={<Activity className="w-4 h-4 text-amber-500" />}
        label="Difficulty"
        value={insights.difficultyRating}
        accent="text-amber-600"
      />
      <Tile
        icon={<TrendingUp className="w-4 h-4 text-green-600" />}
        label="Elevation Gain"
        value={`+${formatElevation(insights.totalElevationGain)}`}
        accent="text-green-700"
      />
      <Tile
        icon={<TrendingDown className="w-4 h-4 text-sky-600" />}
        label="Elevation Loss"
        value={`−${formatElevation(insights.totalElevationLoss)}`}
        accent="text-sky-700"
      />
      <Tile
        icon={<TrendingUp className="w-4 h-4 text-red-500" />}
        label="Steepest Climb"
        value={
          steepestUphill?.grade != null
            ? `${steepestUphill.grade.toFixed(1)}%`
            : "—"
        }
        sub={
          steepestUphill?.startDistance != null
            ? `KM ${steepestUphill.startDistance.toFixed(1)} · ${
                steepestUphill.length?.toFixed(1) ?? "?"
              } km`
            : undefined
        }
        accent="text-red-600"
      />
      <Tile
        icon={<TrendingDown className="w-4 h-4 text-orange-500" />}
        label="Steepest Descent"
        value={
          steepestDownhill?.grade != null
            ? `${steepestDownhill.grade.toFixed(1)}%`
            : "—"
        }
        sub={
          steepestDownhill?.startDistance != null
            ? `KM ${steepestDownhill.startDistance.toFixed(1)} · ${
                steepestDownhill.length?.toFixed(1) ?? "?"
              } km`
            : undefined
        }
        accent="text-orange-600"
      />
    </div>
  );
}

export default MetricTiles;
