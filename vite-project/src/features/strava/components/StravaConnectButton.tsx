import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UseStravaAuthResult } from "../hooks/useStravaAuth";

interface StravaConnectButtonProps {
  stravaAuth: UseStravaAuthResult;
}

export function StravaConnectButton({ stravaAuth }: StravaConnectButtonProps) {
  const { isConnected, connection, loading, connect, disconnect } = stravaAuth;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Strava connection…
      </div>
    );
  }

  if (isConnected && connection) {
    return (
      <div className="flex items-center gap-3">
        {connection.athlete_avatar && (
          <img
            src={connection.athlete_avatar}
            alt="Strava avatar"
            className="h-8 w-8 rounded-full object-cover"
          />
        )}
        <div className="text-sm">
          <p className="font-medium">{connection.athlete_name}</p>
          <p className="text-muted-foreground text-xs">Connected via Strava</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="ml-2 text-red-600 hover:text-red-700 hover:border-red-300"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ backgroundColor: "#FC4C02" }}
    >
      {/* Strava logo mark */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      Connect with Strava
    </button>
  );
}
