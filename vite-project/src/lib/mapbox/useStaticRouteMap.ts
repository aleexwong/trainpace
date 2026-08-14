/**
 * Fetch-once, reuse-forever static route maps.
 *
 * Order of operations on every mount:
 *   1. IndexedDB cache hit  -> render, zero Mapbox requests
 *   2. Request already in flight for this key -> join it
 *   3. Budget check -> fetch, cache, render
 *   4. Budget exhausted -> tell the caller, which draws the route without tiles
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { consumeMapboxBudget, type BudgetDenialReason } from "./budget";
import { getCachedMapImage, putCachedMapImage } from "./imageCache";
import { buildStaticMapRequest, type StaticMapOptions } from "./staticMap";
import { fingerprintRoute } from "./polyline";

export type StaticMapStatus =
  | "idle"
  | "loading"
  | "ready"
  | "blocked"
  | "error"
  | "unavailable";

export interface StaticRouteMapState {
  status: StaticMapStatus;
  /** Object URL for the cached blob, or null when there is nothing to show. */
  src: string | null;
  /** Set when status is "blocked": why, and when it is worth trying again. */
  blockedReason?: BudgetDenialReason;
  retryAfterMs: number;
  /** Whether the image came from cache — a reload that cost nothing. */
  fromCache: boolean;
  retry: () => void;
}

/** Shared across components so two previews of one route fetch once. */
const inFlight = new Map<string, Promise<Blob>>();

const fetchStaticMap = (url: string, cacheKey: string): Promise<Blob> => {
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Mapbox static map failed: ${response.status}`);
      }
      const blob = await response.blob();
      await putCachedMapImage(cacheKey, blob);
      return blob;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, request);
  return request;
};

/**
 * `options.width`/`height` should already be quantized (see quantizeDimension)
 * so that resizes reuse cached images instead of buying new ones. Pass width 0
 * while the container is still being measured; the hook stays idle.
 */
export function useStaticRouteMap(
  options: StaticMapOptions | null
): StaticRouteMapState {
  // The options object is usually a fresh literal each render, so memoize on a
  // value signature rather than on identity.
  const signature =
    options && options.width && options.height && options.routePoints?.length
      ? [
          options.width,
          options.height,
          options.style ?? "",
          options.lineColor ?? "",
          options.lineWidth ?? "",
          options.retina === false ? "1x" : "2x",
          options.padding ?? "",
          options.showStartEnd === false ? "no-pins" : "pins",
          fingerprintRoute(options.routePoints),
        ].join("~")
      : null;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const request = useMemo(
    () => (signature ? buildStaticMapRequest(optionsRef.current!) : null),
    [signature]
  );

  const [state, setState] = useState<
    Omit<StaticRouteMapState, "retry"> & { attempt: number }
  >({
    status: "idle",
    src: null,
    retryAfterMs: 0,
    fromCache: false,
    attempt: 0,
  });

  // Object URLs are revoked on unmount and whenever a new one replaces them.
  const objectUrlRef = useRef<string | null>(null);
  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const url = request?.url ?? null;
  const cacheKey = request?.cacheKey ?? null;
  const attempt = state.attempt;

  useEffect(() => {
    if (!signature) {
      setState((prev) => ({ ...prev, status: "idle", src: null }));
      return;
    }

    if (!url || !cacheKey) {
      // No token, or geometry we cannot draw.
      setState((prev) => ({ ...prev, status: "unavailable", src: null }));
      return;
    }

    let cancelled = false;

    const show = (blob: Blob, fromCache: boolean) => {
      if (cancelled) return;
      releaseObjectUrl();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setState((prev) => ({
        ...prev,
        status: "ready",
        src: objectUrl,
        fromCache,
        retryAfterMs: 0,
        blockedReason: undefined,
      }));
    };

    const run = async () => {
      setState((prev) => ({ ...prev, status: "loading" }));

      const cached = await getCachedMapImage(cacheKey);
      if (cancelled) return;
      if (cached) {
        show(cached, true);
        return;
      }

      // Joining an in-flight request costs nothing, so skip the budget check.
      if (!inFlight.has(cacheKey)) {
        const decision = consumeMapboxBudget("static-image");
        if (!decision.allowed) {
          setState((prev) => ({
            ...prev,
            status: "blocked",
            src: null,
            blockedReason: decision.reason,
            retryAfterMs: decision.retryAfterMs,
          }));
          return;
        }
      }

      try {
        const blob = await fetchStaticMap(url, cacheKey);
        show(blob, false);
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, status: "error", src: null }));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [signature, url, cacheKey, attempt, releaseObjectUrl]);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, attempt: prev.attempt + 1 }));
  }, []);

  return {
    status: state.status,
    src: state.src,
    blockedReason: state.blockedReason,
    retryAfterMs: state.retryAfterMs,
    fromCache: state.fromCache,
    retry,
  };
}
