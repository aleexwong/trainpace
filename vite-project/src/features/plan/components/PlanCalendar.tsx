import { useState } from "react";
import type { TrainingPlan } from "../types";
import { WeekCard } from "./WeekCard";
import type { PlanProgress } from "../hooks/usePlanProgress";
import { exportPlanAsIcal } from "../utils/exportIcal";
import { phaseSegments, PHASE_META } from "../utils/planDisplay";
import { currentWeekNumber } from "../utils/planSchedule";

interface Props {
  plan: TrainingPlan;
  onSave?: () => void;
  saving?: boolean;
  savedId?: string | null;
  /** Omit for exact current read-only rendering (dashboard back-compat). */
  progress?: PlanProgress;
}

export function PlanCalendar({ plan, onSave, saving, savedId, progress }: Props) {
  const currentWeekNum = currentWeekNumber(plan);
  const [exported, setExported] = useState(false);
  const segments = phaseSegments(plan.weeks);

  function handleExport() {
    exportPlanAsIcal(plan);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-slate-900">
          {plan.totalWeeks}-Week Schedule
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 text-sm transition-colors shadow-sm flex items-center gap-1.5"
            title="Export to Google Calendar / Apple Calendar"
          >
            {exported ? (
              <>✓ Downloaded</>
            ) : (
              <>📅 Export to Calendar</>
            )}
          </button>
          {onSave && !savedId && (
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 text-sm transition-colors shadow-sm"
            >
              {saving ? "Saving…" : "Save to Dashboard"}
            </button>
          )}
          {savedId && (
            <span className="text-sm text-emerald-600 font-semibold">
              ✓ Saved to your dashboard
            </span>
          )}
        </div>
      </div>

      {currentWeekNum !== null && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 font-medium">
          📍 You are on <strong>Week {currentWeekNum}</strong> —{" "}
          {plan.weeks.find((w) => w.weekNumber === currentWeekNum)?.phase}
        </div>
      )}

      <div className="space-y-6">
        {segments.map((seg) => (
          <div key={`${seg.phase}-${seg.startWeek}`} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PHASE_META[seg.phase].bg }}
              />
              <h4 className="text-sm font-bold text-slate-800">{seg.phase}</h4>
              <span className="text-xs font-mono text-slate-400">
                {seg.startWeek === seg.endWeek
                  ? `Week ${seg.startWeek}`
                  : `Weeks ${seg.startWeek}–${seg.endWeek}`}
              </span>
            </div>
            <div className="space-y-3">
              {plan.weeks
                .filter((w) => w.weekNumber >= seg.startWeek && w.weekNumber <= seg.endWeek)
                .map((week) => (
                  <WeekCard
                    key={week.weekNumber}
                    week={week}
                    isCurrent={week.weekNumber === currentWeekNum}
                    defaultOpen={week.weekNumber === 1 || week.weekNumber === currentWeekNum}
                    progress={
                      progress
                        ? {
                            isComplete: (day) => progress.isComplete(week.weekNumber, day),
                            onToggle: (day) => progress.toggle(week.weekNumber, day),
                            pending: (day) => progress.isPending(week.weekNumber, day),
                          }
                        : undefined
                    }
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
