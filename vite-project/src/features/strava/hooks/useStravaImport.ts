/**
 * Hook for importing GPX data from Strava activities
 */

import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.trainpace.com";

interface StravaGPXData {
  displayPoints: Array<{ lat: number; lng: number; ele: number; dist?: number }>;
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
  activity: {
    date: string;
    movingTime: number;
    formattedTime: string;
    city: string;
    type: string;
    stravaId: number;
  };
  source: "strava";
}

export function useStravaImport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importActivity = async (activityId: number, activityName: string) => {
    if (!user?.uid) {
      setError("You must be signed in to import activities");
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[Strava Import] Fetching GPX for activity ${activityId}`);

      const response = await fetch(
        `${API_BASE_URL}/api/strava/activity-gpx?activityId=${activityId}`,
        {
          headers: {
            "x-user-id": user.uid,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to import activity");
      }

      const data: StravaGPXData = await response.json();

      console.log(`[Strava Import] Successfully imported "${activityName}"`);

      // Navigate to dedicated poster page (no elevation analysis needed)
      navigate("/poster", {
        replace: true,
        state: {
          posterData: data,
        },
      });

      return data;
    } catch (err: any) {
      console.error("Error importing Strava activity:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    importActivity,
    loading,
    error,
  };
}
