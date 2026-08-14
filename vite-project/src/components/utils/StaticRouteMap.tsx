import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Map as MapIcon, X } from "lucide-react";

import {
  DEFAULT_STATIC_STYLE,
  quantizeDimension,
  useStaticRouteMap,
  type RoutePoint,
} from "@/lib/mapbox";
import { cn } from "@/lib/utils";
import MapboxRoutePreview from "./MapboxRoutePreview";
import RouteSketch from "./RouteSketch";

interface StaticRouteMapProps {
  routePoints: RoutePoint[];
  routeName?: string | null;
  height?: string;
  width?: string;
  className?: string;
  lineColor?: string;
  lineWidth?: number;
  /** Static Images style id, `owner/style` form. */
  mapStyle?: string;
  padding?: number;
  showStartEnd?: boolean;
  /**
   * Offer a control that swaps the image for a live GL map. That costs one
   * Mapbox map load, so it is opt-in per usage and never automatic.
   */
  allowInteractive?: boolean;
  /** Style used once the map goes live, `mapbox://styles/...` form. */
  interactiveMapStyle?: string;
  alt?: string;
}

const formatSeconds = (ms: number): string =>
  `${Math.max(1, Math.ceil(ms / 1000))}s`;

/**
 * A route on a Mapbox basemap, fetched as a single static image and cached in
 * IndexedDB. Reloading the page re-reads the cache instead of buying another
 * Mapbox request; only a genuinely new route, size, or style costs anything.
 *
 * Falls back to a tile-free `RouteSketch` while loading, when the request
 * budget is spent, and when there is no token at all.
 */
export function StaticRouteMap({
  routePoints,
  routeName,
  height = "320px",
  width = "100%",
  className,
  lineColor = "#c2410c",
  lineWidth = 4,
  mapStyle = DEFAULT_STATIC_STYLE,
  padding = 24,
  showStartEnd = true,
  allowInteractive = false,
  interactiveMapStyle,
  alt,
}: StaticRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [live, setLive] = useState(false);

  // Measure the container so the image is requested at the size it renders at.
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setSize((prev) => {
        const next = {
          width: quantizeDimension(rect.width),
          height: quantizeDimension(rect.height),
        };
        return prev.width === next.width && prev.height === next.height
          ? prev
          : next;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const hasPoints = Boolean(routePoints?.length);

  const map = useStaticRouteMap(
    hasPoints && size.width > 0
      ? {
          routePoints,
          width: size.width,
          height: size.height,
          style: mapStyle,
          lineColor,
          lineWidth,
          padding,
          showStartEnd,
        }
      : null
  );

  const { status, retryAfterMs, retry } = map;
  const [retryIn, setRetryIn] = useState(0);

  // Count the block down so the retry control appears exactly when it can work.
  useEffect(() => {
    if (status !== "blocked" || retryAfterMs <= 0) {
      setRetryIn(0);
      return;
    }

    const readyAt = Date.now() + retryAfterMs;
    setRetryIn(retryAfterMs);

    const timer = window.setInterval(() => {
      const remaining = readyAt - Date.now();
      setRetryIn(remaining > 0 ? remaining : 0);
      if (remaining <= 0) window.clearInterval(timer);
    }, 500);

    return () => window.clearInterval(timer);
  }, [status, retryAfterMs]);

  const goLive = useCallback(() => setLive(true), []);
  const goStatic = useCallback(() => setLive(false), []);

  if (!hasPoints) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-gray-100",
          className
        )}
        style={{ height, width }}
      >
        <div className="text-sm text-gray-400">No route data</div>
      </div>
    );
  }

  if (live) {
    return (
      <div className={cn("relative", className)} style={{ height, width }}>
        <MapboxRoutePreview
          routePoints={routePoints}
          routeName={routeName}
          height="100%"
          width="100%"
          lineColor={lineColor}
          lineWidth={lineWidth}
          mapStyle={interactiveMapStyle}
          showStartEnd={showStartEnd}
        />
        <button
          type="button"
          onClick={goStatic}
          className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <X className="h-3.5 w-3.5" />
          Close map
        </button>
      </div>
    );
  }

  const blockedNote =
    status === "blocked"
      ? retryIn > 0
        ? `Map images paused to protect our map quota — retrying in ${formatSeconds(retryIn)}.`
        : "Map images paused to protect our map quota."
      : undefined;

  const note =
    status === "error"
      ? "Map tiles unavailable right now — showing the course outline."
      : status === "unavailable"
        ? "Map tiles unavailable — showing the course outline."
        : blockedNote;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-md bg-stone-50", className)}
      style={{ height, width }}
    >
      {status === "ready" && map.src ? (
        <img
          src={map.src}
          alt={alt ?? `${routeName ?? "Race"} course map`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          width={size.width}
          height={size.height}
        />
      ) : (
        <RouteSketch
          routePoints={routePoints}
          routeName={routeName}
          lineColor={lineColor}
          lineWidth={lineWidth}
          showStartEnd={showStartEnd}
          note={note}
        />
      )}

      {status === "blocked" && retryIn <= 0 && (
        <button
          type="button"
          onClick={retry}
          className="absolute bottom-2 right-2 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          Load map
        </button>
      )}

      {allowInteractive && status === "ready" && (
        <button
          type="button"
          onClick={goLive}
          className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <MapIcon className="h-3.5 w-3.5" />
          Explore map
        </button>
      )}
    </div>
  );
}

export default StaticRouteMap;
