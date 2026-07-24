import { useEffect, useRef, useState } from "react";
import type { TrainingPlan } from "../types";
import { PlanCalendarGrid } from "./PlanCalendarGrid";
import type { PlanProgress } from "../hooks/usePlanProgress";
import type { PlanEditor } from "../hooks/usePlanEditor";
import { exportPlanAsIcal } from "../utils/exportIcal";
import { currentWeekNumber } from "../utils/planSchedule";

interface Props {
  plan: TrainingPlan;
  onSave?: () => void;
  saving?: boolean;
  savedId?: string | null;
  /** Omit for exact current read-only rendering (dashboard back-compat). */
  progress?: PlanProgress;
  /** Omit for a read-only calendar; present = workouts drag-reschedule. */
  editor?: PlanEditor;
  /**
   * Whether this calendar is the currently-visible segment. When it first
   * turns true, the current week's row is scrolled into view — once per
   * mount, not on every toggle back to this segment.
   */
  isActive?: boolean;
}

export function PlanCalendar({ plan, onSave, saving, savedId, progress, editor, isActive }: Props) {
  const currentWeekNum = currentWeekNumber(plan);
  const [exported, setExported] = useState(false);
  const currentWeekRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!isActive || hasScrolledRef.current || currentWeekNum === null) return;
    hasScrolledRef.current = true;
    const node = currentWeekRef.current;
    if (!node) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Wait a tick so layout (e.g. the segment just becoming visible) settles first.
    requestAnimationFrame(() => {
      node.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    });
  }, [isActive, currentWeekNum]);

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

      {editor && (
        <p className="text-xs text-slate-400 px-1">
          Life happens — drag a workout onto another day to reschedule it. Drop
          on an occupied day to swap the two. On touch, press and hold to pick
          one up.
        </p>
      )}

      <PlanCalendarGrid
        plan={plan}
        currentWeekNum={currentWeekNum}
        progress={progress}
        editor={editor}
        currentWeekRef={currentWeekRef}
      />
    </div>
  );
}
