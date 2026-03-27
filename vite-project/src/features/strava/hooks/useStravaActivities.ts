import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { listActivities } from "../services/strava";
import { toActivitySummary } from "../utils";
import type { StravaActivity, StravaActivitySummary } from "../types";
import type { UseStravaAuthResult } from "./useStravaAuth";

export interface UseStravaActivitiesResult {
  activities: StravaActivitySummary[];
  rawActivities: StravaActivity[];
  loading: boolean;
  error: string | null;
  importedIds: Set<number>;
  importActivity: (activity: StravaActivity) => Promise<void>;
  reload: () => void;
}

export function useStravaActivities(
  stravaAuth: UseStravaAuthResult
): UseStravaActivitiesResult {
  const { user } = useAuth();
  const [activities, setActivities] = useState<StravaActivitySummary[]>([]);
  const [rawActivities, setRawActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  // Load already-imported activity IDs from Firestore
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, "users", user.uid, "strava_activities");
    getDocs(colRef).then((snap) => {
      const ids = new Set(snap.docs.map((d) => Number(d.id)));
      setImportedIds(ids);
    });
  }, [user]);

  // Fetch activities from Strava API
  useEffect(() => {
    if (!stravaAuth.isConnected) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    stravaAuth.getFreshToken().then(async (token) => {
      if (!token || cancelled) {
        setLoading(false);
        return;
      }
      try {
        const raw = await listActivities(token, { per_page: 40 });
        if (!cancelled) {
          setRawActivities(raw);
          setActivities(raw.map(toActivitySummary));
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load activities from Strava.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [stravaAuth.isConnected, stravaAuth.getFreshToken, reloadKey]);

  const importActivity = useCallback(
    async (activity: StravaActivity) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid, "strava_activities", String(activity.id));
      await setDoc(ref, {
        ...activity,
        userId: user.uid,
        importedAt: serverTimestamp(),
      });
      setImportedIds((prev) => new Set([...prev, activity.id]));
    },
    [user]
  );

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { activities, rawActivities, loading, error, importedIds, importActivity, reload };
}
