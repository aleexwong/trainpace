/**
 * RouteDashboard
 * Stats-forward dashboard for a loaded/shared route. Replaces the old
 * RouteResults + ElevationInsights + standalone map composition: surfaces the
 * key metrics, both charts, the map, settings, and a full per-segment splits
 * table all at once instead of behind login gates and nested accordions.
 *
 * Owns the chart↔map hover link: hovering the elevation profile highlights the
 * matching position on the map.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import ElevationChart from "@/components/elevationfinder/ElevationChart";
import MapboxRoutePreview from "@/components/utils/MapboxRoutePreview";
import type {
  GPXAnalysisResponse,
  ProfilePoint,
} from "@/features/elevation/types";
import type { ElevationAnalysis } from "@/types/elevation";
import { computeTotalTime } from "@/utils/difficulty";
import { MetricTiles } from "./MetricTiles";
import { SplitsTable } from "./SplitsTable";
import { CumulativeGainChart } from "./CumulativeGainChart";
import { TerrainBreakdown } from "./TerrainBreakdown";
import { RaceComparison } from "./RaceComparison";
import { SettingsPanel } from "./SettingsPanel";

interface DisplayPoint {
  lat: number;
  lng: number;
  ele?: number;
  dist?: number;
}

interface RouteDashboardProps {
  analysisData: GPXAnalysisResponse;
  points: ProfilePoint[];
  displayPoints: DisplayPoint[];
  routeName: string;
  filename: string | null;
  docId: string | null;
  isOwner: boolean;
  basePaceMinPerKm: number;
  loading?: boolean;
  onFilenameUpdate?: (newFilename: string) => void;
  onSettingsChange?: (settings: {
    basePaceMinPerKm: number;
    gradeThreshold: number;
  }) => void;
}

export function RouteDashboard({
  analysisData,
  points,
  displayPoints,
  routeName,
  filename,
  docId,
  isOwner,
  basePaceMinPerKm,
  loading = false,
  onFilenameUpdate,
  onSettingsChange,
}: RouteDashboardProps) {
  const [hoverDistance, setHoverDistance] = useState<number | null>(null);

  // Live settings. Base pace is a pure linear scale on each segment's time
  // multiplier, so we drive all pace/time displays from this local value for
  // instant feedback — no server round-trip needed. Grade threshold is sent to
  // the server (onCommit) because it re-derives segment classification.
  const [basePace, setBasePace] = useState(basePaceMinPerKm);
  const [gradeThreshold, setGradeThreshold] = useState(2);

  // Resync when the route's analysed base pace changes (initial load, route
  // switch, or after a successful recompute — which echoes the same value).
  useEffect(() => {
    setBasePace(basePaceMinPerKm);
  }, [basePaceMinPerKm]);

  const elevationInsights =
    analysisData.elevationInsights as ElevationAnalysis | null;
  const insights = elevationInsights?.insights ?? null;
  const segments = useMemo(
    () => elevationInsights?.segments ?? [],
    [elevationInsights]
  );

  const totalDistance = analysisData.totalDistanceKm || 0;

  // Total time derived live from the current segments + live base pace, so the
  // estimate (and avg pace) track the base-pace slider immediately.
  const estimatedTotalTime = useMemo(
    () => computeTotalTime(segments, basePace),
    [segments, basePace]
  );

  const handleCommit = useCallback(() => {
    onSettingsChange?.({ basePaceMinPerKm: basePace, gradeThreshold });
  }, [onSettingsChange, basePace, gradeThreshold]);

  // Resolve the hovered distance to a lat/lng on the route for the map marker.
  // Prefer each point's own cumulative `dist`; fall back to index proportion
  // against total distance when `dist` isn't populated. Returns null (and the
  // marker disappears) if it can't be resolved — chart and map still work.
  const highlightPoint = useMemo(() => {
    if (hoverDistance == null || !displayPoints.length) return null;

    const hasDist = displayPoints.some((p) => typeof p.dist === "number");
    if (hasDist) {
      let best: DisplayPoint | null = null;
      let bestDelta = Infinity;
      for (const p of displayPoints) {
        if (typeof p.dist !== "number") continue;
        const delta = Math.abs(p.dist - hoverDistance);
        if (delta < bestDelta) {
          bestDelta = delta;
          best = p;
        }
      }
      return best ? { lat: best.lat, lng: best.lng } : null;
    }

    if (totalDistance <= 0) return null;
    const ratio = Math.min(1, Math.max(0, hoverDistance / totalDistance));
    const idx = Math.round(ratio * (displayPoints.length - 1));
    const p = displayPoints[idx];
    return p ? { lat: p.lat, lng: p.lng } : null;
  }, [hoverDistance, displayPoints, totalDistance]);

  return (
    <div className="w-full space-y-6">
      {insights && (
        <MetricTiles
          insights={insights}
          basePaceMinPerKm={basePace}
          estimatedTotalTime={estimatedTotalTime}
        />
      )}

      {/* Profile + map, hover-linked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {points.length > 0 && (
          <ElevationChart
            points={points}
            filename={filename ?? undefined}
            docId={docId ?? undefined}
            isOwner={isOwner}
            onFilenameUpdate={onFilenameUpdate}
            onHoverDistance={setHoverDistance}
          />
        )}
        {displayPoints.length > 0 && (
          <MapboxRoutePreview
            routePoints={displayPoints}
            routeName={routeName}
            height="100%"
            width="100%"
            showStartEnd
            className="border border-gray-200 min-h-[20rem]"
            lineColor="#059669"
            lineWidth={3}
            mapStyle="mapbox://styles/mapbox/outdoors-v11"
            maxZoom={16}
            highlightPoint={highlightPoint}
          />
        )}
      </div>

      {/* Secondary analytics */}
      {points.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <CumulativeGainChart points={points} />
          {insights && (
            <TerrainBreakdown
              insights={insights}
              segments={segments}
              basePaceMinPerKm={basePace}
            />
          )}
        </div>
      )}

      {insights && <RaceComparison insights={insights} />}

      <SettingsPanel
        basePace={basePace}
        gradeThreshold={gradeThreshold}
        onBasePaceChange={setBasePace}
        onGradeThresholdChange={setGradeThreshold}
        onCommit={handleCommit}
      />

      {loading && (
        <div className="text-center text-sm text-gray-500">Updating analysis…</div>
      )}

      {segments.length > 0 && (
        <SplitsTable segments={segments} basePaceMinPerKm={basePace} />
      )}
    </div>
  );
}

export default RouteDashboard;
