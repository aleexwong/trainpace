/**
 * VdotComparison — "What If" explorer: adjust time to see how VDOT changes
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
}

export function VdotComparison({
  currentVdot,
  distanceMeters,
  distanceName,
  totalSeconds,
}: VdotComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [offsetSeconds, setOffsetSeconds] = useState(0);

  // Calculate the max offset range based on race duration
  const maxOffset = useMemo(() => {
    return Math.min(Math.floor(totalSeconds * 0.2), 600); // 20% of time or 10 min max
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
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all"
      >
        <Sliders className="w-4 h-4" />
        <span className="font-medium text-sm">Explore &quot;What If&quot; Scenarios</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What If?</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Adjust your {distanceName} time to see how VDOT changes
          </p>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setOffsetSeconds(0);
          }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Faster ({formatOffset(-maxOffset)})</span>
          <span className="font-semibold text-gray-700 text-sm">
            {offsetSeconds === 0 ? "Your time" : formatOffset(offsetSeconds)}
          </span>
          <span>Slower ({formatOffset(maxOffset)})</span>
        </div>
        <input
          type="range"
          min={-maxOffset}
          max={maxOffset}
          step={totalSeconds > 600 ? 10 : 5}
          value={offsetSeconds}
          onChange={(e) => setOffsetSeconds(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Current */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Current</p>
          <p className="text-3xl font-bold text-gray-900">{currentVdot}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">{formatTime(totalSeconds)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{getVdotLevel(currentVdot).label}</p>
        </div>

        {/* Target */}
        <div
          className={`p-4 rounded-xl border text-center ${
            vdotDelta > 0
              ? "bg-emerald-50 border-emerald-200"
              : vdotDelta < 0
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Target</p>
          <p
            className={`text-3xl font-bold ${
              vdotDelta > 0 ? "text-emerald-700" : vdotDelta < 0 ? "text-red-700" : "text-blue-700"
            }`}
          >
            {targetVdot}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-mono">{formatTime(targetSeconds)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{targetLevel.label}</p>
        </div>
      </div>

      {/* Delta summary */}
      {offsetSeconds !== 0 && (
        <div
          className={`mt-4 flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium ${
            vdotDelta > 0
              ? "bg-emerald-50 text-emerald-700"
              : vdotDelta < 0
              ? "bg-red-50 text-red-700"
              : "bg-gray-50 text-gray-700"
          }`}
        >
          {vdotDelta > 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : vdotDelta < 0 ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
          <span>
            {offsetSeconds < 0 ? "Improving" : "Slowing"} by {formatOffset(offsetSeconds).replace(/[+-]/, "")}
            {" = "}
            {vdotDelta > 0 ? "+" : ""}
            {vdotDelta} VDOT points
          </span>
        </div>
      )}
    </div>
  );
}
