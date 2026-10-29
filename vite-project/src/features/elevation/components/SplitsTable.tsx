/**
 * SplitsTable
 * Dense, fully-visible per-segment breakdown that replaces the old nested
 * difficulty/cluster accordions. Every segment's grade, elevation change,
 * pace, time, difficulty, energy cost and race phase are shown at once;
 * clicking a row reveals that segment's pacing advice.
 *
 * Desktop renders a table; mobile collapses to stacked cards (mirrors the
 * VDOT RacePredictionsTable responsive pattern).
 */
import { Fragment, useState } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";
import type {
  Segment,
  ChallengeRating,
  EnergyRating,
  RacePosition,
} from "@/types/elevation";
import { formatTime, formatPace } from "@/utils/difficulty";

interface SplitsTableProps {
  segments: Segment[];
  basePaceMinPerKm: number;
}

const DIFFICULTY_BADGE: Record<ChallengeRating, string> = {
  brutal: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
  hard: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300",
  moderate: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
  easy: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
};

const ENERGY_BADGE: Record<EnergyRating, string> = {
  high: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900",
  medium: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900",
  low: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900",
};

const PHASE_LABEL: Record<RacePosition, string> = {
  early: "Early",
  mid: "Mid",
  late: "Late",
};

function TypeIcon({ type }: { type: Segment["type"] }) {
  if (type === "uphill") return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (type === "downhill")
    return <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />;
  return <Minus className="w-4 h-4 text-gray-400 dark:text-neutral-500" />;
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function segmentTime(seg: Segment, basePace: number) {
  return formatTime(seg.length * basePace * seg.estimatedTimeMultiplier);
}

function elevDelta(seg: Segment) {
  const delta = seg.endElevation - seg.startElevation;
  return `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(0)} m`;
}

export function SplitsTable({ segments, basePaceMinPerKm }: SplitsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!segments.length) {
    return (
      <div className="text-center text-gray-500 dark:text-neutral-400 py-8">No segments to display</div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border overflow-hidden">
      <h3 className="font-semibold text-gray-800 dark:text-neutral-200 p-4 border-b">
        Kilometer-by-Kilometer Splits
      </h3>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-950">
              <th className="px-4 py-2 font-medium">Segment</th>
              <th className="px-4 py-2 font-medium">Grade</th>
              <th className="px-4 py-2 font-medium">Elev Δ</th>
              <th className="px-4 py-2 font-medium">Pace</th>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Difficulty</th>
              <th className="px-4 py-2 font-medium">Energy</th>
              <th className="px-4 py-2 font-medium">Phase</th>
              <th className="px-4 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {segments.map((seg, i) => {
              const isOpen = expanded === i;
              return (
                <Fragment key={i}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : i)}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-neutral-200">
                        <TypeIcon type={seg.type} />
                        KM {seg.startDistance.toFixed(0)}–
                        {seg.endDistance.toFixed(0)}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-neutral-300">
                      {seg.grade.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-neutral-300">{elevDelta(seg)}</td>
                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-neutral-200">
                      {formatPace(seg.estimatedTimeMultiplier, basePaceMinPerKm)}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-neutral-300">
                      {segmentTime(seg, basePaceMinPerKm)}
                    </td>
                    <td className="px-4 py-2">
                      <Badge className={DIFFICULTY_BADGE[seg.challengeRating]}>
                        {seg.challengeRating}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge className={ENERGY_BADGE[seg.energyRating]}>
                        {seg.energyRating}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-neutral-400">
                      {PHASE_LABEL[seg.racePosition]}
                    </td>
                    <td className="px-4 py-2 text-gray-400 dark:text-neutral-500">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </td>
                  </tr>
                  {isOpen && seg.pacingAdvice && (
                    <tr className="bg-emerald-50/50 dark:bg-emerald-950/40">
                      <td colSpan={9} className="px-4 py-3 text-sm text-gray-700 dark:text-neutral-300">
                        <span className="font-medium">💡 Strategy: </span>
                        {seg.pacingAdvice}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-neutral-800">
        {segments.map((seg, i) => {
          const isOpen = expanded === i;
          return (
            <div
              key={i}
              className="p-4 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-neutral-200">
                  <TypeIcon type={seg.type} />
                  KM {seg.startDistance.toFixed(0)}–{seg.endDistance.toFixed(0)}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 dark:text-neutral-200">
                    {formatPace(seg.estimatedTimeMultiplier, basePaceMinPerKm)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    {segmentTime(seg, basePaceMinPerKm)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-neutral-400">
                <span>{seg.grade.toFixed(1)}%</span>
                <span>·</span>
                <span>{elevDelta(seg)}</span>
                <Badge className={DIFFICULTY_BADGE[seg.challengeRating]}>
                  {seg.challengeRating}
                </Badge>
                <Badge className={ENERGY_BADGE[seg.energyRating]}>
                  {seg.energyRating} energy
                </Badge>
                <span className="text-gray-500 dark:text-neutral-400">
                  {PHASE_LABEL[seg.racePosition]} race
                </span>
              </div>
              {isOpen && seg.pacingAdvice && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded text-sm text-gray-700 dark:text-neutral-300">
                  <span className="font-medium">💡 Strategy: </span>
                  {seg.pacingAdvice}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SplitsTable;
