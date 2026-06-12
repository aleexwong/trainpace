import { useState } from "react";
import type { TrainingWeek } from "../types";
import { workoutColor, workoutTextColor, phaseColor } from "../plan-math";

interface Props {
  week: TrainingWeek;
  isCurrent?: boolean;
}

export function WeekCard({ week, isCurrent = false }: Props) {
  const [open, setOpen] = useState(isCurrent);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isCurrent ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200"}`}>
      {/* Week header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        {/* Week number */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-700">W{week.weekNumber}</span>
        </div>

        {/* Phase + focus */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: phaseColor(week.phase),
                color: week.phase === "Race Week" ? "#ffffff" : "#0f172a",
              }}
            >
              {week.phase}
            </span>
            {isCurrent && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                THIS WEEK
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 truncate">{week.weeklyFocus}</p>
        </div>

        {/* Volume */}
        <div className="flex-shrink-0 text-right">
          <div className="text-base font-bold text-emerald-600">{week.totalKm} km</div>
          <div className="text-xs text-slate-400">{week.days.length} runs</div>
        </div>

        {/* Chevron */}
        <svg
          className={`flex-shrink-0 w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded days */}
      {open && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          {/* Day strip */}
          <div className="flex gap-2 flex-wrap">
            {week.days.map(({ day, workout }) => (
              <div
                key={day}
                className="flex flex-col items-center rounded-xl px-3 py-2 text-center min-w-[4rem]"
                style={{
                  backgroundColor: workoutColor(workout.type),
                  color: workoutTextColor(workout.type),
                }}
              >
                <span className="text-xs font-bold mb-1">{day}</span>
                <span className="text-xs font-semibold leading-tight">{workout.label}</span>
                {workout.distanceKm !== undefined && workout.distanceKm > 0 && (
                  <span className="text-xs opacity-80 mt-0.5">{workout.distanceKm} km</span>
                )}
              </div>
            ))}
          </div>

          {/* Workout details */}
          <div className="space-y-2">
            {week.days.map(({ day, workout }) => (
              <div key={day} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-9 text-xs font-bold text-slate-400 pt-0.5">
                  {day}
                </span>
                <div>
                  <span
                    className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mr-2"
                    style={{
                      backgroundColor: workoutColor(workout.type),
                      color: workoutTextColor(workout.type),
                    }}
                  >
                    {workout.label}
                  </span>
                  {workout.paceZone && (
                    <span className="text-xs text-emerald-600 font-semibold mr-2">
                      @ {workout.paceZone} pace
                    </span>
                  )}
                  <span className="text-xs text-slate-600">{workout.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
