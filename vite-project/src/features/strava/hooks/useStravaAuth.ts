import { useEffect, useState, useCallback } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { refreshAccessToken } from "../services/strava";
import type { StravaConnection } from "../types";

const STRAVA_SCOPE = "read,activity:read_all,profile:read_all";
const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";

function stravaConnectionDocRef(uid: string) {
  return doc(db, "users", uid, "integrations", "strava");
}

export interface UseStravaAuthResult {
  isConnected: boolean;
  connection: StravaConnection | null;
  loading: boolean;
  /** Redirects user to Strava OAuth page */
  connect: () => void;
  /** Removes Strava connection from Firestore */
  disconnect: () => Promise<void>;
  /** Returns a fresh access token, refreshing if needed */
  getFreshToken: () => Promise<string | null>;
}

export function useStravaAuth(): UseStravaAuthResult {
  const { user } = useAuth();
  const [connection, setConnection] = useState<StravaConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConnection(null);
      setLoading(false);
      return;
    }

    const ref = stravaConnectionDocRef(user.uid);
    let cancelled = false;
    getDoc(ref).then((snap) => {
      if (!cancelled) {
        setConnection(snap.exists() ? (snap.data() as StravaConnection) : null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const connect = useCallback(() => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined;
    if (!clientId) {
      console.error("VITE_STRAVA_CLIENT_ID is not set");
      return;
    }
    const redirectUri = `${window.location.origin}/strava/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      approval_prompt: "auto",
      scope: STRAVA_SCOPE,
    });
    window.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
  }, []);

  const disconnect = useCallback(async () => {
    if (!user) return;
    await deleteDoc(stravaConnectionDocRef(user.uid));
    setConnection(null);
  }, [user]);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    if (!user || !connection) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    // Token is still valid
    if (connection.expires_at > nowSec + 60) {
      return connection.access_token;
    }

    // Refresh
    try {
      const refreshed = await refreshAccessToken(connection.refresh_token);
      const updated: StravaConnection = {
        ...connection,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_at: refreshed.expires_at,
      };
      await setDoc(stravaConnectionDocRef(user.uid), {
        ...updated,
        connected_at: serverTimestamp(),
      });
      setConnection(updated);
      return refreshed.access_token;
    } catch (err) {
      console.error("Failed to refresh Strava token", err);
      return null;
    }
  }, [user, connection]);

  return {
    isConnected: !!connection,
    connection,
    loading,
    connect,
    disconnect,
    getFreshToken,
  };
}
