/**
 * Strava Connect Button Component
 * Displays connection status and handles OAuth flow
 */

import React from "react";
import { useStravaConnection } from "../hooks/useStravaConnection";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, Loader2, XCircle } from "lucide-react";

interface StravaConnectButtonProps {
  onStatusChange?: (connected: boolean) => void;
}

export function StravaConnectButton({ onStatusChange }: StravaConnectButtonProps) {
  const { status, loading, error, connect, disconnect } = useStravaConnection();

  // Notify parent of status changes
  React.useEffect(() => {
    onStatusChange?.(status.connected);
  }, [status.connected, onStatusChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking Strava connection...</span>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="space-y-3">
        {/* Connected Status */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900">Connected to Strava</p>
            {status.athleteName && (
              <p className="text-sm text-green-700 truncate">
                Athlete: {status.athleteName}
                {status.athleteUsername && ` (@${status.athleteUsername})`}
              </p>
            )}
          </div>
          {status.athleteProfile && (
            <img
              src={status.athleteProfile}
              alt="Athlete profile"
              className="w-10 h-10 rounded-full border-2 border-green-300"
            />
          )}
        </div>

        {/* Disconnect Button */}
        <Button
          variant="outline"
          onClick={disconnect}
          disabled={loading}
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Disconnect Strava
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Not Connected Status */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Connect your Strava account
            </p>
            <p className="text-sm text-gray-600">
              Import GPX files from your Strava activities to generate course posters and
              analyze elevation profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Connect Button */}
      <Button
        onClick={connect}
        disabled={loading}
        className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white"
      >
        <svg
          className="w-5 h-5 mr-2"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
        </svg>
        Connect with Strava
      </Button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        By connecting, you allow TrainPace to access your Strava activities.
        <br />
        You can disconnect at any time.
      </p>
    </div>
  );
}

// Re-export hook for convenience
export { useStravaConnection };
