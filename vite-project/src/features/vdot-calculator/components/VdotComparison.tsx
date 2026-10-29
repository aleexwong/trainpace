/**
 * VdotComparison — "What If" explorer: adjust time to see how VDOT changes
 * Supports compact mode for dashboard grid layout — always open when compact.
 */

import { useState, useMemo } from "react";
import { Sliders, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateVdot, formatTime } from "../vdot-math";
import { getVdotLevel } from "../hooks/useVdotCalculator";

interface VdotComparisonProps {
  currentVdot: number;
  distanceMeters: number;
  distanceName: string;
  totalSeconds: number;
  compact?: boolean;
}

export function VdotComparison({
  currentVdot,
  distanceMeters,
  distanceName,
  totalSeconds,
  compact,
}: VdotComparisonProps) {
  const [isOpen, setIsOpen] = useState(!!compact);
  const [offsetSeconds, setOffsetSeconds] = useState(0);

  const maxOffset = useMemo(() => {
    return Math.min(Math.floor(totalSeconds * 0.2), 600);
  }, [totalSeconds]);

  const targetSeconds = totalSeconds + offsetSeconds;
  const targetVdot = useMemo(() => {
    if (targetSeconds <= 0) return currentVdot;
    const v = calculateVdot(distanceMeters, targetSeconds);
    return Math.round(v * 10) / 10;
  }, [distanceMeters, targetSeconds, currentVdot]);

  const vdotDelta = Math.round((targetVdot - currentVdot) * 10) / 10;
  const targetLevel = getVdotLevel(targetVdot);

  const formatOffset = (seconds: number): string => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    const sign = seconds < 0 ? "-" : "+";
    if (m === 0) return `${sign}${s}s`;
    if (s === 0) return `${sign}${m}:00`;
    return `${sign}${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border-2 border-dashed border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400 hover:border-emerald-300 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
      >
        <Sliders className="w-4 h-4" />
        <span className="font-medium text-sm">Explore &quot;What If&quot; Scenarios</span>
      </button>
    );
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-lg h-full ${compact ? "p-4" : "p-5 sm:p-8"}`}>
      <div className={`flex items-center justify-between ${compact ? "mb-3" : "mb-4"}`}>
        <div className={compact ? "w-full text-center" : ""}>
          <h2 className={`font-bold text-gray-900 dark:text-neutral-100 ${compact ? "text-lg mb-0.5" : "text-xl sm:text-2xl"}`}>What If?</h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Adjust your {distanceName} time
          </p>
        </div>
        {!compact && (
          <button
            onClick={() => { setIsOpen(false); setOffsetSeconds(0); }}
            className="text-sm text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Slider */}
      <div className={compact ? "mb-4" : "mb-8"}>
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-neutral-500 mb-1.5">
          <span>Faster</span>
          <span className="font-semibold text-gray-700 dark:text-neutral-300 text-xs">
            {offsetSeconds === 0 ? "Your time" : formatOffset(offsetSeconds)}
          </span>
          <span>Slower</span>
        </div>
        <input
          type="range"
          min={-maxOffset}
          max={maxOffset}
          step={totalSeconds > 600 ? 10 : 5}
          value={offsetSeconds}
          onChange={(e) => setOffsetSeconds(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-emerald-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-center ${compact ? "p-3" : "p-4"}`}>
          <p className="text-[10px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Current</p>
          <p className={`font-bold text-gray-900 dark:text-neutral-100 ${compact ? "text-2xl" : "text-3xl"}`}>{currentVdot}</p>
          <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5 font-mono">{formatTime(totalSeconds)}</p>
          <p className="text-[10px] text-gray-400 dark:text-neutral-500">{getVdotLevel(currentVdot).label}</p>
        </div>

        <div
          className={`rounded-xl border text-center ${compact ? "p-3" : "p-4"} ${
            vdotDelta > 0
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
              : vdotDelta < 0
              ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
          }`}
        >
          <p className="text-[10px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">Target</p>
          <p
            className={`font-bold ${compact ? "text-2xl" : "text-3xl"} ${
              vdotDelta > 0 ? "text-emerald-700 dark:text-emerald-300" : vdotDelta < 0 ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {targetVdot}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5 font-mono">{formatTime(targetSeconds)}</p>
          <p className="text-[10px] text-gray-400 dark:text-neutral-500">{targetLevel.label}</p>
        </div>
      </div>

      {/* Delta summary */}
      {offsetSeconds !== 0 && (
        <div
          className={`mt-3 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium ${
            vdotDelta > 0
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
              : vdotDelta < 0
              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
              : "bg-gray-50 dark:bg-neutral-950 text-gray-700 dark:text-neutral-300"
          }`}
        >
          {vdotDelta > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : vdotDelta < 0 ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          <span>
            {vdotDelta > 0 ? "+" : ""}{vdotDelta} VDOT
          </span>
        </div>
      )}
    </div>
  );
}
