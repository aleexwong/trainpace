/**
 * Strava Connection Hook
 * Manages Strava OAuth connection state and operations
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.trainpace.com";

export interface StravaConnectionStatus {
  connected: boolean;
  athleteName?: string;
  athleteUsername?: string;
  athleteProfile?: string;
  scope?: string;
  connectedAt?: any;
}

export function useStravaConnection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StravaConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current connection status
   */
  const fetchStatus = useCallback(async () => {
    if (!user?.uid) {
      console.log('[Strava] No user UID, skipping status fetch');
      setStatus({ connected: false });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Strava] Fetching status for user:', user.uid);
      const response = await fetch(`${API_BASE_URL}/api/strava/status`, {
        headers: {
          "x-user-id": user.uid,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Strava status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error("Error fetching Strava status:", err);
      setError(err.message);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Initiate Strava OAuth connection
   */
  const connect = useCallback(() => {
    if (!user?.uid) {
      setError("You must be signed in to connect Strava");
      return;
    }

    // Redirect to backend OAuth initiation endpoint
    const authUrl = `${API_BASE_URL}/api/strava/auth?userId=${user.uid}`;
    window.location.href = authUrl;
  }, [user?.uid]);

  /**
   * Disconnect Strava
   */
  const disconnect = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/strava/disconnect`, {
        method: "POST",
        headers: {
          "x-user-id": user.uid,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect Strava");
      }

      setStatus({ connected: false });
    } catch (err: any) {
      console.error("Error disconnecting Strava:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Fetch status on mount and when user changes
   */
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Handle OAuth callback (check URL params)
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stravaStatus = params.get("strava");

    if (stravaStatus === "success") {
      // Refresh status after successful OAuth
      fetchStatus();

      // Clean URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    } else if (stravaStatus === "error" || stravaStatus === "denied") {
      const message = params.get("message");
      setError(message || "Failed to connect Strava");

      // Clean URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    connect,
    disconnect,
    refresh: fetchStatus,
  };
}
