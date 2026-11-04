import { useMemo } from "react";

import { getRouteBounds, simplifyRoute, type RoutePoint } from "@/lib/mapbox";
import { cn } from "@/lib/utils";

interface RouteSketchProps {
  routePoints: RoutePoint[];
  routeName?: string | null;
  lineColor?: string;
  lineWidth?: number;
  showStartEnd?: boolean;
  className?: string;
  /** Short line explaining why tiles are missing, rendered under the shape. */
  note?: string;
  children?: React.ReactNode;
}

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 260;
const PADDING = 16;

/**
 * Web Mercator, so the sketch matches the aspect a real map would show.
 *
 * Both axes must be in radians: x is longitude in radians, y is the Mercator
 * latitude in the same units. Feeding x degrees against y radians squashes
 * every course into a horizontal line — off by a factor of 57.
 */
const mercatorX = (lng: number): number => (lng * Math.PI) / 180;

const mercatorY = (lat: number): number => {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
};

/**
 * The route drawn from its own coordinates, with no map tiles behind it.
 *
 * This is what renders before the static map arrives, when the Mapbox budget
 * is spent, and during prerendering — so a crawler and a rate-limited visitor
 * both still see the course shape instead of a grey box.
 */
export function RouteSketch({
  routePoints,
  routeName,
  lineColor = "#c2410c",
  lineWidth = 3,
  showStartEnd = true,
  className,
  note,
  children,
}: RouteSketchProps) {
  const geometry = useMemo(() => {
    const points = simplifyRoute(routePoints ?? [], 400);
    const bounds = getRouteBounds(points);
    if (!bounds || points.length < 2) return null;

    const minX = mercatorX(bounds.minLng);
    const minY = mercatorY(bounds.minLat);
    const maxY = mercatorY(bounds.maxLat);
    const spanX = Math.max(mercatorX(bounds.maxLng) - minX, 1e-12);
    const spanY = Math.max(maxY - minY, 1e-12);

    // One scale for both axes keeps the shape undistorted.
    const scale = Math.min(
      (VIEW_WIDTH - PADDING * 2) / spanX,
      (VIEW_HEIGHT - PADDING * 2) / spanY
    );
    const offsetX = (VIEW_WIDTH - spanX * scale) / 2;
    const offsetY = (VIEW_HEIGHT - spanY * scale) / 2;

    const projected = points.map((p) => ({
      x: offsetX + (mercatorX(p.lng) - minX) * scale,
      // SVG y grows downward; Mercator y grows north.
      y: offsetY + (maxY - mercatorY(p.lat)) * scale,
    }));

    return {
      path: projected
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" "),
      start: projected[0],
      end: projected[projected.length - 1],
    };
  }, [routePoints]);

  return (
    <div
      className={cn(
        // Column layout rather than an overlaid note: the note takes its own
        // row so it can never sit on top of the start/finish markers.
        "relative flex h-full w-full flex-col bg-stone-50 text-center",
        className
      )}
    >
      {geometry ? (
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="min-h-0 w-full flex-1"
          role="img"
          aria-label={
            routeName ? `${routeName} course outline` : "Course outline"
          }
        >
          <path
            d={geometry.path}
            fill="none"
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showStartEnd && (
            <>
              <circle cx={geometry.start.x} cy={geometry.start.y} r={5} fill="#27ae60" />
              <circle cx={geometry.end.x} cy={geometry.end.y} r={5} fill="#e74c3c" />
            </>
          )}
        </svg>
      ) : (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center text-sm text-gray-400">
          No route data
        </div>
      )}

      {note && (
        <div className="shrink-0 border-t border-stone-200 bg-white px-3 py-2 text-xs text-gray-600">
          {note}
        </div>
      )}
      {children}
    </div>
  );
}

export default RouteSketch;
