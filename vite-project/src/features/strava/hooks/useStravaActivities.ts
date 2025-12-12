/**
 * Hook for fetching and managing Strava activities
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.trainpace.com";

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  distanceKm: string;
  distanceMiles: string;
  movingTime: number;
  elapsedTime: number;
  elevationGain: number;
  startDate: string;
  startDateLocal: string;
  averageSpeed: number;
  maxSpeed: number;
  averagePace: number | null;
  hasGps: boolean;
  mapId?: string;
  polyline?: string;
}

interface ActivitiesResponse {
  activities: StravaActivity[];
  page: number;
  perPage: number;
  hasMore: boolean;
}

export function useStravaActivities(autoFetch = true) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!user?.uid) {
        setError("You must be signed in to view activities");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[Strava] Fetching activities page ${pageNum}`);

        const response = await fetch(
          `${API_BASE_URL}/api/strava/activities?page=${pageNum}&per_page=20`,
          {
            headers: {
              "x-user-id": user.uid,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch activities");
        }

        const data: ActivitiesResponse = await response.json();

        console.log(`[Strava] Fetched ${data.activities.length} activities`);

        if (append) {
          setActivities((prev) => [...prev, ...data.activities]);
        } else {
          setActivities(data.activities);
        }

        setPage(pageNum);
        setHasMore(data.hasMore);
      } catch (err: any) {
        console.error("Error fetching Strava activities:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(page + 1, true);
    }
  }, [loading, hasMore, page, fetchActivities]);

  const refresh = useCallback(() => {
    setActivities([]);
    setPage(1);
    setHasMore(true);
    fetchActivities(1, false);
  }, [fetchActivities]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && user?.uid) {
      fetchActivities(1, false);
    }
  }, [autoFetch, user?.uid, fetchActivities]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
