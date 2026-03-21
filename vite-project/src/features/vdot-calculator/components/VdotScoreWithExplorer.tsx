/**
 * VdotScoreWithExplorer — Combined score gauge + "What If" explorer
 * The gauge is interactive: sliding the time offset updates the needle in real-time.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { VdotResult, VdotInputs } from "../types";
import { calculateVdot, formatTime } from "../vdot-math";
import { getVdotLevel, getVdotPercentile } from "../hooks/useVdotCalculator";

interface Props {
  result: VdotResult;
  inputs: VdotInputs;
  totalSeconds: number;
  compact?: boolean;
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target * 10) / 10);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/** SVG semicircular gauge with optional target needle */
function InteractiveGauge({ vdot, targetVdot }: { vdot: number; targetVdot?: number }) {
  const minVdot = 15;
  const maxVdot = 85;
  const clamp = (v: number) => Math.max(minVdot, Math.min(maxVdot, v));
  const toFraction = (v: number) => (clamp(v) - minVdot) / (maxVdot - minVdot);

  const fraction = toFraction(vdot);
  const targetFraction = targetVdot != null ? toFraction(targetVdot) : null;

  const cx = 150;
  const cy = 130;
  const r = 110;
  const startAngle = Math.PI;
  const totalAngle = Math.PI;

  const arcPath = (startFrac: number, endFrac: number) => {
    const a1 = startAngle - startFrac * totalAngle;
    const a2 = startAngle - endFrac * totalAngle;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy - r * Math.sin(a2);
    const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needlePos = (frac: number) => {
    const angle = startAngle - frac * totalAngle;
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const current = needlePos(fraction);
  const target = targetFraction != null ? needlePos(targetFraction) : null;

  const zones = [
    { start: 0, end: 0.21, color: "#6ee7b7" },
    { start: 0.21, end: 0.36, color: "#60a5fa" },
    { start: 0.36, end: 0.5, color: "#34d399" },
    { start: 0.5, end: 0.64, color: "#fbbf24" },
    { start: 0.64, end: 0.79, color: "#fb923c" },
    { start: 0.79, end: 0.93, color: "#f87171" },
    { start: 0.93, end: 1, color: "#a855f7" },
  ];

  return (
    <svg viewBox="0 0 300 160" className="w-full max-w-[200px]">
      <path d={arcPath(0, 1)} fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" />
      {zones.map((zone, i) => (
        <path key={i} d={arcPath(zone.start, zone.end)} fill="none" stroke={zone.color} strokeWidth="18" strokeLinecap="butt" opacity={0.85} />
      ))}
      <path
        d={arcPath(0, fraction)}
        fill="none"
        stroke="url(#gaugeGrad2)"
        strokeWidth="20"
        strokeLinecap="round"
        className="drop-shadow-md"
        style={{ strokeDasharray: `${fraction * Math.PI * r} ${Math.PI * r}`, transition: "stroke-dasharray 1s ease-out" }}
      />
      {/* Current needle */}
      <circle cx={current.x} cy={current.y} r="10" fill="white" stroke="#1e40af" strokeWidth="3" className="drop-shadow-lg" />
      <circle cx={current.x} cy={current.y} r="4" fill="#1e40af" />
      {/* Target needle (shown when slider is moved) */}
      {target && targetFraction !== fraction && (
        <>
          <circle
            cx={target.x} cy={target.y} r="8" fill="white" stroke="#6366f1" strokeWidth="2"
            className="drop-shadow-md" opacity={0.9}
            style={{ transition: "cx 0.15s ease-out, cy 0.15s ease-out" }}
          />
          <circle
            cx={target.x} cy={target.y} r="3" fill="#6366f1" opacity={0.9}
            style={{ transition: "cx 0.15s ease-out, cy 0.15s ease-out" }}
          />
        </>
      )}
      <defs>
        <linearGradient id="gaugeGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <text x="28" y="155" className="fill-gray-400 text-[10px]" textAnchor="middle">20</text>
      <text x="150" y="28" className="fill-gray-400 text-[10px]" textAnchor="middle">50</text>
      <text x="272" y="155" className="fill-gray-400 text-[10px]" textAnchor="middle">80+</text>
    </svg>
  );
}

export function VdotScoreWithExplorer({ result, inputs, totalSeconds, compact }: Props) {
  const animatedVdot = useCountUp(result.vdot, 1200);
  const level = getVdotLevel(result.vdot);
  const percentile = getVdotPercentile(result.vdot);

  // What-If state
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  const maxOffset = useMemo(() => Math.min(Math.floor(totalSeconds * 0.2), 600), [totalSeconds]);

  const targetSeconds = totalSeconds + offsetSeconds;
  const targetVdot = useMemo(() => {
    if (targetSeconds <= 0) return result.vdot;
    return Math.round(calculateVdot(inputs.distanceMeters, targetSeconds) * 10) / 10;
  }, [inputs.distanceMeters, targetSeconds, result.vdot]);

  const vdotDelta = Math.round((targetVdot - result.vdot) * 10) / 10;
  const targetLevel = getVdotLevel(targetVdot);
  const isAdjusted = offsetSeconds !== 0;

  const formatOffset = (seconds: number): string => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    const sign = seconds < 0 ? "-" : "+";
    if (m === 0) return `${sign}${s}s`;
    if (s === 0) return `${sign}${m}:00`;
    return `${sign}${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
      {/* Top section: gauge left, score right */}
      <div className={`bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 ${compact ? "p-4" : "p-6 sm:p-8"}`}>
        <div className="flex items-center gap-4">
          {/* Gauge — top left */}
          <div className="shrink-0">
            <InteractiveGauge vdot={result.vdot} targetVdot={isAdjusted ? targetVdot : undefined} />
          </div>

          {/* Score + level — right of gauge */}
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-[10px] font-medium mb-0.5">Your VDOT Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`font-bold text-white tabular-nums ${compact ? "text-4xl" : "text-5xl"}`}>
                {animatedVdot.toFixed(1)}
              </span>
              {isAdjusted && (
                <span
                  className={`text-lg font-bold tabular-nums ${
                    vdotDelta > 0 ? "text-emerald-300" : vdotDelta < 0 ? "text-red-300" : "text-blue-200"
                  }`}
                >
                  &rarr; {targetVdot}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                {level.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-blue-200 text-[10px]">
                {percentile}
              </span>
            </div>
            <p className="text-blue-200 text-[10px] mt-1.5">
              {inputs.distanceName} in {formatTime(totalSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* What-If slider section */}
      <div className={`${compact ? "px-4 py-3" : "px-6 py-4"} border-b border-gray-100`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">What If?</p>
          {isAdjusted && (
            <button
              onClick={() => setOffsetSeconds(0)}
              className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
          <span>Faster</span>
          <span className="font-semibold text-gray-600 text-xs">
            {isAdjusted ? formatOffset(offsetSeconds) : "Drag to explore"}
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
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
        />

        {/* Delta display when adjusted */}
        {isAdjusted && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-50 border border-gray-200 text-center p-2">
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Current</p>
              <p className="text-lg font-bold text-gray-900">{result.vdot}</p>
              <p className="text-[10px] text-gray-500 font-mono">{formatTime(totalSeconds)}</p>
              <p className="text-[9px] text-gray-400">{level.label}</p>
            </div>
            <div
              className={`rounded-lg border text-center p-2 ${
                vdotDelta > 0
                  ? "bg-emerald-50 border-emerald-200"
                  : vdotDelta < 0
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Target</p>
              <p
                className={`text-lg font-bold ${
                  vdotDelta > 0 ? "text-emerald-700" : vdotDelta < 0 ? "text-red-700" : "text-blue-700"
                }`}
              >
                {targetVdot}
              </p>
              <p className="text-[10px] text-gray-500 font-mono">{formatTime(targetSeconds)}</p>
              <p className="text-[9px] text-gray-400">{targetLevel.label}</p>
            </div>
          </div>
        )}

        {isAdjusted && (
          <div
            className={`mt-2 flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-xs font-medium ${
              vdotDelta > 0
                ? "bg-emerald-50 text-emerald-700"
                : vdotDelta < 0
                ? "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            {vdotDelta > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : vdotDelta < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{vdotDelta > 0 ? "+" : ""}{vdotDelta} VDOT</span>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <div className="text-center p-2.5">
          <p className="font-bold text-gray-900 text-base">{result.vo2max}</p>
          <p className="text-[10px] text-gray-500">VO&#8322;max</p>
        </div>
        <div className="text-center p-2.5">
          <p className="font-bold text-gray-900 text-base">5</p>
          <p className="text-[10px] text-gray-500">Zones</p>
        </div>
        <div className="text-center p-2.5">
          <p className="font-bold text-gray-900 text-base">9</p>
          <p className="text-[10px] text-gray-500">Predictions</p>
        </div>
      </div>
    </div>
  );
}
