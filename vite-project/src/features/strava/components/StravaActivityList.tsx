/**
 * Strava Activity List Component
 * Displays a grid of recent Strava activities
 */

import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StravaActivityCard } from "./StravaActivityCard";
import { useStravaActivities } from "../hooks/useStravaActivities";
import type { StravaActivity } from "../hooks/useStravaActivities";

interface StravaActivityListProps {
  onImport?: (activity: StravaActivity) => void;
  showImportButton?: boolean;
}

export function StravaActivityList({
  onImport,
  showImportButton = true,
}: StravaActivityListProps) {
  const { activities, loading, error, hasMore, loadMore, refresh } =
    useStravaActivities(true);

  // Loading state (initial fetch)
  if (loading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading your Strava activities...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Failed to load activities
          </p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="text-6xl mb-2">🏃</div>
        <p className="text-sm font-medium text-gray-900">No activities yet</p>
        <p className="text-sm text-gray-600 text-center max-w-sm">
          Go for a run, ride, or hike and sync it to Strava. Your activities will
          appear here automatically.
        </p>
      </div>
    );
  }

  // Activity grid
  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {activities.length} recent activities
        </p>
        <Button onClick={refresh} variant="ghost" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Activities grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <StravaActivityCard
            key={activity.id}
            activity={activity}
            onImport={onImport}
            showImportButton={showImportButton}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            variant="outline"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Activities"
            )}
          </Button>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && activities.length > 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          That's all your recent activities! 🎉
        </p>
      )}
    </div>
  );
}
