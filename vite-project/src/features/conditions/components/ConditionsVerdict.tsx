/**
 * ConditionsVerdict — the headline answer.
 *
 * The number a runner came for is the adjusted finish time, so it gets the
 * largest type on the page. Everything else here exists to make that number
 * trustworthy: what the original goal was, how much of the cost came from heat
 * versus altitude, and what fitness the adjusted result is actually equivalent
 * to.
 */

import { TrendingDown, Flame, Mountain, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, formatPace } from "@/features/vdot-calculator/vdot-math";
import type { ConditionsResult, PaceUnit } from "../types";

/**
 * Tailwind can't build class names at runtime, so every risk colour needs a
 * statically-written entry here.
 */
const RISK_STYLES: Record<
  string,
  { pill: string; ring: string; bar: string; text: string }
> = {
  emerald: {
    pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ring: "from-emerald-500 to-emerald-600",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
  },
  lime: {
    pill: "bg-lime-100 text-lime-800 border-lime-200",
    ring: "from-lime-500 to-lime-600",
    bar: "bg-lime-500",
    text: "text-lime-700",
  },
  yellow: {
    pill: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ring: "from-yellow-500 to-yellow-600",
    bar: "bg-yellow-500",
    text: "text-yellow-700",
  },
  orange: {
    pill: "bg-orange-100 text-orange-800 border-orange-200",
    ring: "from-orange-500 to-orange-600",
    bar: "bg-orange-500",
    text: "text-orange-700",
  },
  red: {
    pill: "bg-red-100 text-red-800 border-red-200",
    ring: "from-red-500 to-red-600",
    bar: "bg-red-500",
    text: "text-red-700",
  },
  rose: {
    pill: "bg-rose-100 text-rose-900 border-rose-300",
    ring: "from-rose-600 to-rose-700",
    bar: "bg-rose-600",
    text: "text-rose-700",
  },
};

/** "+2:34" / "—" for a time delta in seconds. */
function formatDelta(seconds: number): string {
  if (Math.round(seconds) === 0) return "—";
  const sign = seconds > 0 ? "+" : "−";
  return `${sign}${formatTime(Math.abs(seconds))}`;
}

interface Props {
  result: ConditionsResult;
  distanceName: string;
  paceUnit: PaceUnit;
  onTogglePaceUnit: () => void;
}

export function ConditionsVerdict({
  result,
  distanceName,
  paceUnit,
  onTogglePaceUnit,
}: Props) {
  const styles = RISK_STYLES[result.riskColor] ?? RISK_STYLES.yellow;
  const perKm = paceUnit === "km";

  const goalPace = perKm ? result.goalPacePerKm : result.goalPacePerMile;
  const adjPace = perKm ? result.adjustedPacePerKm : result.adjustedPacePerMile;
  const paceCost = perKm ? result.paceCostPerKm : result.paceCostPerMile;

  const heatCost = Math.max(0, result.heatCostSeconds);
  const altCost = Math.max(0, result.altitudeCostSeconds);
  const totalCost = heatCost + altCost;
  // Guard the divide so a perfect-conditions result doesn't produce NaN widths.
  const heatShare = totalCost > 0 ? (heatCost / totalCost) * 100 : 0;
  const altShare = totalCost > 0 ? (altCost / totalCost) * 100 : 0;

  const noPenalty = Math.round(result.totalCostSeconds) <= 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
      {/* Headline */}
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Realistic {distanceName} finish
            </p>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 tabular-nums tracking-tight">
                {formatTime(result.adjustedTimeSeconds)}
              </span>
              {!noPenalty && (
                <span className={cn("text-lg font-bold tabular-nums", styles.text)}>
                  {formatDelta(result.totalCostSeconds)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {noPenalty ? (
                <>Your goal of {formatTime(result.goalTimeSeconds)} stands.</>
              ) : (
                <>
                  Goal was{" "}
                  <span className="font-semibold text-gray-700 tabular-nums">
                    {formatTime(result.goalTimeSeconds)}
                  </span>{" "}
                  in perfect conditions
                </>
              )}
            </p>
          </div>

          <span
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap",
              styles.pill
            )}
          >
            {result.riskLabel}
          </span>
        </div>

        {/* Pace */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              Goal pace
            </p>
            <p className="text-lg font-bold text-gray-400 tabular-nums line-through decoration-1">
              {formatPace(goalPace)}
            </p>
          </div>
          <button
            type="button"
            onClick={onTogglePaceUnit}
            title="Toggle min/km and min/mi"
            className="text-left rounded-xl bg-emerald-50 border border-emerald-100 p-3 hover:border-emerald-300 transition-colors"
          >
            <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide">
              Run this instead · /{paceUnit}
            </p>
            <p className="text-lg font-bold text-emerald-800 tabular-nums">
              {formatPace(adjPace)}
              {paceCost >= 1 && (
                <span className="ml-1.5 text-xs font-semibold text-emerald-600">
                  +{Math.round(paceCost)}s
                </span>
              )}
            </p>
          </button>
        </div>
      </div>

      {/* Cost attribution */}
      {!noPenalty && (
        <div className="px-5 sm:px-7 pb-5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Where the time goes
          </p>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
            {heatShare > 0 && (
              <div
                className="bg-orange-500"
                style={{ width: `${heatShare}%` }}
                title="Heat &amp; humidity"
              />
            )}
            {altShare > 0 && (
              <div
                className="bg-violet-500"
                style={{ width: `${altShare}%` }}
                title="Altitude"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
            {heatCost >= 1 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Heat &amp; humidity
                <span className="font-bold tabular-nums text-gray-900">
                  {formatDelta(heatCost)}
                </span>
              </span>
            )}
            {altCost >= 1 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                <Mountain className="w-3.5 h-3.5 text-violet-500" />
                Altitude
                <span className="font-bold tabular-nums text-gray-900">
                  {formatDelta(altCost)}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-slate-50/60">
        <Metric
          label="Heat stress"
          value={String(Math.round(result.heatStressSum))}
          sub="temp + dew pt (°F)"
        />
        <Metric
          label="Effective VDOT"
          value={result.effectiveVdot.toFixed(1)}
          sub={
            result.vdotDrop >= 0.05
              ? `−${result.vdotDrop.toFixed(1)} from ${result.baselineVdot.toFixed(1)}`
              : "no change"
          }
          icon={result.vdotDrop >= 0.05}
        />
        <Metric
          label="Aerobic capacity"
          value={`${Math.round(result.altitudeVo2Fraction * 100)}%`}
          sub="of sea level"
        />
      </div>

      {/* Advice */}
      <div className="flex gap-2.5 p-4 sm:px-7 border-t border-gray-100">
        <Info className={cn("w-4 h-4 flex-shrink-0 mt-0.5", styles.text)} />
        <p className="text-sm text-gray-600 leading-relaxed">{result.advice}</p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: boolean;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5 inline-flex items-center gap-1">
        {icon && <TrendingDown className="w-4 h-4 text-orange-500" />}
        {value}
      </p>
      <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
    </div>
  );
}
