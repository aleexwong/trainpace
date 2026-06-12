import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Calendar, Flag, Download } from "lucide-react";
import type { TrainingPlan } from "../../plan/types";
import { phaseColor } from "../../plan/plan-math";
import { exportPlanAsIcal } from "../../plan/utils/exportIcal";
import { WeekCard } from "../../plan/components/WeekCard";

interface Props {
  plan: TrainingPlan;
  onDelete: (id: string) => void;
}

export function TrainingPlanCard({ plan, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const raceDate = plan.raceDate
    ? new Date(plan.raceDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const weeksRemaining = (() => {
    if (!plan.raceDate) return null;
    const diff = new Date(plan.raceDate).getTime() - Date.now();
    const weeks = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    return weeks > 0 ? weeks : null;
  })();

  const phaseSummary = plan.weeks.reduce<Record<string, number>>((acc, w) => {
    acc[w.phase] = (acc[w.phase] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Flag className="w-5 h-5 text-emerald-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 truncate">{plan.name}</div>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {raceDate}
            </span>
            <span>·</span>
            <span>{plan.totalWeeks} weeks</span>
            {weeksRemaining !== null && (
              <>
                <span>·</span>
                <span className="text-emerald-600 font-medium">{weeksRemaining}w to go</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {confirming ? (
            <>
              <button
                onClick={() => { onDelete(plan.id!); setConfirming(false); }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => exportPlanAsIcal(plan)}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Export to Calendar (.ics)"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded((o) => !o)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          {/* Phase bar */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Plan Structure
            </div>
            <div className="flex rounded-lg overflow-hidden h-6">
              {(Object.entries(phaseSummary) as [string, number][]).map(([phase, count]) => (
                <div
                  key={phase}
                  style={{
                    width: `${(count / plan.totalWeeks) * 100}%`,
                    backgroundColor: phaseColor(phase as Parameters<typeof phaseColor>[0]),
                  }}
                  title={`${phase}: ${count}w`}
                  className="flex items-center justify-center text-xs font-bold text-slate-700 overflow-hidden"
                >
                  {count >= 2 ? phase.split(" ")[0] : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Paces */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Training Paces (min/km)
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(plan.paces) as [string, string][]).map(([zone, pace]) => (
                <div key={zone} className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 text-center">
                  <div className="text-sm font-bold text-emerald-700 font-mono">{pace}</div>
                  <div className="text-xs text-slate-500 capitalize">{zone}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full weekly schedule */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Weekly Schedule
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {plan.weeks.map((week) => (
                <WeekCard key={week.weekNumber} week={week} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
            <a
              href="/plan"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Build a new plan →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
