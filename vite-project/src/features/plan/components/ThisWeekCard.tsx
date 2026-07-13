/**
 * Training Plan — "This Week" summary card
 *
 * A sibling of the PlanOverview hero: surfaces the current training week at
 * a glance — phase, the next run coming up (with a real calendar date), and
 * the rest of this week's runs with their done state. Presentational only —
 * takes plan + already-computed progress functions from usePlanProgress and
 * renders based on them; it doesn't manage any state of its own (beyond the
 * pure date math needed to tell "before plan starts" from "after race day").
 */

import type { RunDay, TrainingPlan, TrainingWeek } from "../types";
import { WORKOUT_META, PHASE_META } from "../utils/planDisplay";
import {
  raceDateNoon,
  todayNoon,
  weekStartMonday,
  type ScheduledWorkout,
} from "../utils/planSchedule";
import type { ProgressSummary } from "../hooks/usePlanProgress";
import { cn } from "@/lib/utils";

interface Props {
  plan: TrainingPlan;
  currentWeekNumber: number | null;
  nextWorkout: ScheduledWorkout | null;
  planProgress: ProgressSummary;
  weekProgress: (week: TrainingWeek) => ProgressSummary;
  isComplete: (weekNumber: number, day: RunDay) => boolean;
  onToggle: (weekNumber: number, day: RunDay) => void;
  isPending?: (weekNumber: number, day: RunDay) => boolean;
}

function formatRealDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function ThisWeekCard({
  plan,
  currentWeekNumber,
  nextWorkout,
  planProgress,
  weekProgress,
  isComplete,
  onToggle,
  isPending,
}: Props) {
  const today = todayNoon();
  const week1Monday = weekStartMonday(plan.raceDate, 1, plan.totalWeeks);
  const race = raceDateNoon(plan.raceDate);
  const beforeStart = currentWeekNumber === null && today < week1Monday;
  const afterRace = currentWeekNumber === null && !beforeStart && today > race;

  if (afterRace) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm p-6 sm:p-8 text-center">
        <div className="text-4xl mb-2" aria-hidden="true">
          🎉
        </div>
        <h3 className="font-display text-xl font-bold text-slate-900">Plan complete!</h3>
        <p className="mt-1 text-sm text-slate-600">
          {plan.goalRace} — you crossed the finish line on your training.
        </p>
        {planProgress.totalCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5">
            <span className="font-display text-sm font-bold text-emerald-700 tabular-nums">
              {planProgress.completedCount}/{planProgress.totalCount} runs completed
            </span>
            <span className="text-xs font-semibold text-emerald-600">({planProgress.pct}%)</span>
          </div>
        )}
      </div>
    );
  }

  const activeWeekNumber = currentWeekNumber ?? 1;
  const week = plan.weeks.find((w) => w.weekNumber === activeWeekNumber);
  if (!week) return null;

  const wp = weekProgress(week);
  const phaseMeta = PHASE_META[week.phase];

  const daysUntilStart = beforeStart
    ? Math.max(1, Math.round((week1Monday.getTime() - today.getTime()) / 86400000))
    : null;

  const highlighted = nextWorkout;
  const highlightedMeta = highlighted ? WORKOUT_META[highlighted.workout.type] : null;

  const restOfWeek = week.days.filter(
    (d) =>
      d.workout.type !== "rest" &&
      !(highlighted && highlighted.weekNumber === week.weekNumber && highlighted.day === d.day)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: phaseMeta.bg, color: phaseMeta.text }}
          >
            {phaseMeta.short}
          </span>
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
            {beforeStart ? `Week 1 Preview` : `Week ${week.weekNumber} · This Week`}
          </h3>
        </div>
        {beforeStart ? (
          <span className="text-xs font-semibold text-slate-500">
            Starts in {daysUntilStart} day{daysUntilStart === 1 ? "" : "s"}
          </span>
        ) : (
          wp.totalCount > 0 && (
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {wp.completedCount}/{wp.totalCount} runs · {wp.pct}%
            </span>
          )
        )}
      </div>

      {!beforeStart && wp.totalCount > 0 && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${wp.pct}%` }}
          />
        </div>
      )}

      {/* Next run — highlighted */}
      {highlighted && highlightedMeta && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ backgroundColor: highlightedMeta.bg, color: highlightedMeta.text }}
              >
                {highlighted.workout.label}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 font-display tabular-nums">
                  {highlighted.workout.distanceKm !== undefined && highlighted.workout.distanceKm > 0 && (
                    <span className="text-base font-bold text-slate-900">
                      {highlighted.workout.distanceKm} km
                    </span>
                  )}
                  {highlighted.workout.paceZone && (
                    <span className="text-xs font-semibold text-emerald-700">
                      @ {highlighted.workout.paceZone} pace
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Next up · {formatRealDate(highlighted.date)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggle(highlighted.weekNumber, highlighted.day)}
              disabled={isPending?.(highlighted.weekNumber, highlighted.day)}
              aria-pressed={isComplete(highlighted.weekNumber, highlighted.day)}
              aria-label={`Mark ${highlighted.day} ${highlighted.workout.label} as done`}
              className={cn(
                "flex-shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-sm transition-colors shadow-sm",
                isPending?.(highlighted.weekNumber, highlighted.day) && "opacity-50 cursor-wait"
              )}
            >
              Mark done
            </button>
          </div>
        </div>
      )}

      {/* Rest of the week */}
      {restOfWeek.length > 0 && (
        <div className="space-y-1.5">
          {restOfWeek.map(({ day, workout }) => {
            const meta = WORKOUT_META[workout.type];
            const done = isComplete(week.weekNumber, day);
            const pendingToggle = isPending?.(week.weekNumber, day) ?? false;
            return (
              <div
                key={day}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                  done ? "bg-emerald-50/60" : "hover:bg-slate-50"
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggle(week.weekNumber, day)}
                  disabled={pendingToggle}
                  aria-pressed={done}
                  aria-label={`Mark ${day} ${workout.label} as ${done ? "not done" : "done"}`}
                  className={cn(
                    "flex-shrink-0 h-5 w-5 p-0 rounded-full border flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-1",
                    done
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-300 text-transparent hover:border-emerald-400",
                    pendingToggle && "opacity-50 cursor-wait"
                  )}
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 w-8 flex-shrink-0">
                  {day}
                </span>
                <span
                  className="flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: meta.bg, color: meta.text }}
                >
                  {workout.label}
                </span>
                {workout.distanceKm !== undefined && workout.distanceKm > 0 && (
                  <span className="text-xs font-semibold text-slate-500 tabular-nums ml-auto flex-shrink-0">
                    {workout.distanceKm} km
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
