/**
 * Fetches and parses a course GPX file, caching the parsed points for the
 * session so re-selecting a race on the globe is instant.
 */

import { useEffect, useState } from "react";

import type { RoutePoint, RouteState } from "../types";
import { parseGpxTrackPoints } from "../utils";

const cache = new Map<string, RoutePoint[]>();

const IDLE_STATE: RouteState = { points: [], status: "idle", error: null };

export function useGpxRoute(gpxUrl: string | null): RouteState {
  const [state, setState] = useState<RouteState>(() =>
    gpxUrl && cache.has(gpxUrl)
      ? { points: cache.get(gpxUrl)!, status: "ready", error: null }
      : IDLE_STATE
  );

  useEffect(() => {
    if (!gpxUrl) {
      setState(IDLE_STATE);
      return;
    }

    const cached = cache.get(gpxUrl);
    if (cached) {
      setState({ points: cached, status: "ready", error: null });
      return;
    }

    const controller = new AbortController();
    setState({ points: [], status: "loading", error: null });

    const load = async () => {
      try {
        const response = await fetch(gpxUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Course file unavailable (HTTP ${response.status})`);
        }

        const points = parseGpxTrackPoints(await response.text());
        cache.set(gpxUrl, points);

        if (!controller.signal.aborted) {
          setState({ points, status: "ready", error: null });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          points: [],
          status: "error",
          error: error instanceof Error ? error.message : "Failed to load course",
        });
      }
    };

    load();

    return () => controller.abort();
  }, [gpxUrl]);

  return state;
}
