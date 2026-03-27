import { Loader2, RefreshCw, Trophy, TrendingUp, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { calculateVdot } from "@/features/vdot-calculator/vdot-math";
import { activityToVdotInput, formatDuration, toActivitySummary } from "../utils";
import type { StravaActivity } from "../types";
import type { UseStravaActivitiesResult } from "../hooks/useStravaActivities";

interface StravaActivitiesSectionProps {
  rawActivities: StravaActivity[];
  activitiesState: UseStravaActivitiesResult;
}

export function StravaActivitiesSection({
  rawActivities,
  activitiesState,
}: StravaActivitiesSectionProps) {
  const navigate = useNavigate();
  const { loading, error, importedIds, importActivity, reload } = activitiesState;
  const summaries = rawActivities.map(toActivitySummary);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading Strava activities…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
        <Button variant="outline" size="sm" className="ml-3" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No recent activities found on Strava.
        <Button variant="ghost" size="sm" className="ml-2" onClick={reload}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {summaries.length} most recent activities
        </p>
        <Button variant="ghost" size="sm" onClick={reload}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {summaries.map((summary, idx) => {
          const raw = rawActivities[idx];
          const isRun =
            summary.sport_type === "Run" || summary.sport_type === "VirtualRun";
          const alreadyImported = importedIds.has(summary.id);
          const vdotInput = activityToVdotInput(raw);
          const vdot = vdotInput
            ? Math.round(
                calculateVdot(vdotInput.distanceMetres, vdotInput.timeSeconds)
              )
            : null;

          return (
            <div
              key={summary.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 gap-4"
            >
              {/* Left: activity info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {summary.is_race && (
                    <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                  )}
                  <span className="font-medium text-sm truncate">{summary.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {summary.sport_type}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{summary.distance_km} km</span>
                  {summary.pace_per_km && <span>{summary.pace_per_km}</span>}
                  <span>{formatDuration(summary.moving_time_s)}</span>
                  {summary.elevation_gain_m > 0 && (
                    <span>↑ {summary.elevation_gain_m.toFixed(0)} m</span>
                  )}
                  <span>
                    {new Date(summary.start_date_local).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex shrink-0 items-center gap-2">
                {isRun && vdot && !Number.isNaN(vdot) && (
                  <Button
                    variant="outline"
                    size="sm"
                    title={`VDOT ≈ ${vdot} — click to open VDOT calculator`}
                    onClick={() =>
                      navigate(`/vdot?distance=custom&time=${raw.moving_time}&km=${(raw.distance / 1000).toFixed(3)}`)
                    }
                  >
                    <TrendingUp className="mr-1 h-3 w-3" />
                    VDOT {vdot}
                  </Button>
                )}
                <Button
                  variant={alreadyImported ? "secondary" : "outline"}
                  size="sm"
                  disabled={alreadyImported}
                  onClick={() => importActivity(raw)}
                >
                  {alreadyImported ? (
                    "Imported"
                  ) : (
                    <>
                      <Import className="mr-1 h-3 w-3" /> Import
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
