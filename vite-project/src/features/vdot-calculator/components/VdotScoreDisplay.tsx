/**
 * VdotScoreDisplay — Animated VDOT gauge with score reveal, percentile, and stats
 * Supports compact mode for dashboard grid layout.
 */

import { useState, useEffect, useRef } from "react";
import { TrendingUp, Heart, Target } from "lucide-react";
import type { VdotResult, VdotInputs } from "../types";
import { formatTime } from "../vdot-math";
import { getVdotLevel, getVdotPercentile } from "../hooks/useVdotCalculator";

interface VdotScoreDisplayProps {
  result: VdotResult;
  inputs: VdotInputs;
  totalSeconds: number;
  onReset?: () => void;
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

/** SVG semicircular gauge */
function VdotGauge({ vdot, size = "normal" }: { vdot: number; size?: "normal" | "small" }) {
  const minVdot = 15;
  const maxVdot = 85;
  const clamped = Math.max(minVdot, Math.min(maxVdot, vdot));
  const fraction = (clamped - minVdot) / (maxVdot - minVdot);

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

  const needleAngle = startAngle - fraction * totalAngle;
  const needleX = cx + r * Math.cos(needleAngle);
  const needleY = cy - r * Math.sin(needleAngle);

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
    <svg
      viewBox="0 0 300 160"
      className={size === "small" ? "w-full max-w-[200px] mx-auto" : "w-full max-w-[240px] mx-auto"}
    >
      <path d={arcPath(0, 1)} fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" />
      {zones.map((zone, i) => (
        <path key={i} d={arcPath(zone.start, zone.end)} fill="none" stroke={zone.color} strokeWidth="18" strokeLinecap="butt" opacity={0.85} />
      ))}
      <path
        d={arcPath(0, fraction)}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth="20"
        strokeLinecap="round"
        className="drop-shadow-md"
        style={{ strokeDasharray: `${fraction * Math.PI * r} ${Math.PI * r}`, transition: "stroke-dasharray 1s ease-out" }}
      />
      <circle cx={needleX} cy={needleY} r="10" fill="white" stroke="#1e40af" strokeWidth="3" className="drop-shadow-lg" />
      <circle cx={needleX} cy={needleY} r="4" fill="#1e40af" />
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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

export function VdotScoreDisplay({ result, inputs, totalSeconds, compact }: VdotScoreDisplayProps) {
  const animatedVdot = useCountUp(result.vdot, 1200);
  const level = getVdotLevel(result.vdot);
  const percentile = getVdotPercentile(result.vdot);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
      {/* Score header */}
      <div className={`bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 ${compact ? "p-4" : "p-6 sm:p-8"}`}>
        <div className="flex flex-col items-center text-center">
          <VdotGauge vdot={result.vdot} size={compact ? "small" : "normal"} />

          <div className={compact ? "mt-1" : "mt-2"}>
            <p className="text-blue-200 text-xs font-medium mb-0.5">Your VDOT Score</p>
            <span className={`font-bold text-white tabular-nums ${compact ? "text-4xl" : "text-5xl sm:text-6xl"}`}>
              {animatedVdot.toFixed(1)}
            </span>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
              {level.label}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-blue-200 text-xs">
              {percentile}
            </span>
          </div>

          <p className="text-blue-200 text-xs mt-2">
            {inputs.distanceName} in {formatTime(totalSeconds)}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <div className={`text-center ${compact ? "p-2.5" : "p-4"}`}>
          <div className="flex justify-center mb-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className={`font-bold text-gray-900 ${compact ? "text-base" : "text-lg sm:text-xl"}`}>{result.vo2max}</p>
          <p className="text-[10px] text-gray-500">VO&#8322;max</p>
        </div>
        <div className={`text-center ${compact ? "p-2.5" : "p-4"}`}>
          <div className="flex justify-center mb-0.5">
            <Heart className="w-3.5 h-3.5 text-red-500" />
          </div>
          <p className={`font-bold text-gray-900 ${compact ? "text-base" : "text-lg sm:text-xl"}`}>5</p>
          <p className="text-[10px] text-gray-500">Zones</p>
        </div>
        <div className={`text-center ${compact ? "p-2.5" : "p-4"}`}>
          <div className="flex justify-center mb-0.5">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className={`font-bold text-gray-900 ${compact ? "text-base" : "text-lg sm:text-xl"}`}>9</p>
          <p className="text-[10px] text-gray-500">Predictions</p>
        </div>
      </div>
    </div>
  );
}
