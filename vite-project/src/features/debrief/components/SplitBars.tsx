/**
 * SplitBars
 * One row per split, with a bar that grows left (faster) or right (slower)
 * from the race-average line. A fade shows as a run of right-hand bars at the
 * bottom of the table, which reads faster than a column of paces.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Split, SplitUnit } from "../types";
import { formatPaceIn } from "../utils";

interface SplitBarsProps {
  splits: Split[];
  unit: SplitUnit;
  hasElevation: boolean;
}

// ±12% from average fills half the track. Race splits rarely go further.
const FULL_SCALE = 0.12;

type Mode = "gap" | "actual";

export function SplitBars({ splits, unit, hasElevation }: SplitBarsProps) {
  const [mode, setMode] = useState<Mode>(hasElevation ? "gap" : "actual");
  const paceOf = (s: Split) => (mode === "gap" ? s.gapSecPerKm : s.paceSecPerKm);

  const full = splits.filter((s) => !s.partial);
  const avg =
    full.length > 0 ? full.reduce((sum, s) => sum + paceOf(s), 0) / full.length : 0;

  return (
    <div>
      {hasElevation && (
        <div
          role="group"
          aria-label="Pace shown"
          className="inline-flex rounded-lg border bg-gray-50 p-0.5 text-sm mb-3"
        >
          {(
            [
              ["gap", "Adjusted for hills"],
              ["actual", "Actual pace"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                mode === value ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <table className="w-full text-sm">
        <caption className="sr-only">
          Split paces compared with your average {mode === "gap" ? "grade-adjusted " : ""}pace
        </caption>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-500">
            <th scope="col" className="text-left font-medium py-1 w-12">
              {unit === "km" ? "Km" : "Mile"}
            </th>
            <th scope="col" className="font-medium py-1">
              <span className="sr-only">Faster or slower than average</span>
              <span aria-hidden="true" className="flex justify-between px-1">
                <span>Faster</span>
                <span>Slower</span>
              </span>
            </th>
            <th scope="col" className="text-right font-medium py-1 w-24">
              Pace
            </th>
            {hasElevation && (
              <th scope="col" className="text-right font-medium py-1 w-16 hidden sm:table-cell">
                Elev.
              </th>
            )}
          </tr>
        </thead>
        <tbody className="font-display tabular-nums">
          {splits.map((s) => {
            const pace = paceOf(s);
            const delta = avg > 0 ? pace / avg - 1 : 0;
            const width = Math.min(Math.abs(delta) / FULL_SCALE, 1) * 50;
            const slower = delta > 0;
            const tone = !slower
              ? "bg-emerald-500"
              : delta > 0.05
                ? "bg-red-500"
                : "bg-amber-400";
            return (
              <tr key={s.index} className={cn("border-t", s.partial && "text-gray-400")}>
                <td className="py-1.5 text-left">
                  {s.partial ? `${s.index}*` : s.index}
                </td>
                <td className="py-1.5 px-1">
                  <div className="relative h-4 rounded bg-gray-100" aria-hidden="true">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-gray-400" />
                    <div
                      className={cn("absolute inset-y-0.5 rounded-sm", tone, s.partial && "opacity-40")}
                      style={
                        slower
                          ? { left: "50%", width: `${width}%` }
                          : { right: "50%", width: `${width}%` }
                      }
                    />
                  </div>
                </td>
                <td className="py-1.5 text-right whitespace-nowrap">{formatPaceIn(pace, unit)}</td>
                {hasElevation && (
                  <td className="py-1.5 text-right text-gray-500 hidden sm:table-cell">
                    {s.netElevationM > 0 ? "+" : s.netElevationM < 0 ? "−" : ""}
                    {Math.abs(Math.round(s.netElevationM))} m
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {splits.some((s) => s.partial) && (
        <p className="text-xs text-gray-500 mt-2">
          * Final split shorter than a full {unit === "km" ? "km" : "mile"}; not counted in the average.
        </p>
      )}
    </div>
  );
}
