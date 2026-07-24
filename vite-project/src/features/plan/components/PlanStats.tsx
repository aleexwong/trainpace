import type { TrainingPlan, TrainingWeek } from "../types";
import { PHASE_META, PACE_ZONE_ORDER, phaseSegments } from "../utils/planDisplay";
import { cn } from "@/lib/utils";

function VolumeChart({ weeks }: { weeks: TrainingWeek[] }) {
  const maxKm = Math.max(...weeks.map((w) => w.totalKm), 1);
  const peakIdx = weeks.reduce((best, w, i) => (w.totalKm > weeks[best].totalKm ? i : best), 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Weekly Volume
        </div>
        <div className="text-xs text-slate-400">{weeks.length} weeks</div>
      </div>
      <div className="relative h-28 sm:h-32 pt-5">
        <div
          className="absolute top-0 text-[9px] font-bold uppercase tracking-wide text-emerald-600 whitespace-nowrap"
          style={{ left: `${((peakIdx + 0.5) / weeks.length) * 100}%`, transform: "translateX(-50%)" }}
        >
          Peak
        </div>
        <div className="absolute inset-x-0 bottom-0 top-5 flex items-end gap-[3px]">
          {weeks.map((w, i) => {
            const pct = Math.max((w.totalKm / maxKm) * 100, 4);
            const meta = PHASE_META[w.phase];
            const isPeak = i === peakIdx;
            return (
              <div key={w.weekNumber} className="relative flex-1 min-w-0 h-full">
                <div
                  className={cn(
                    "absolute bottom-0 inset-x-0 rounded-t-sm transition-all",
                    isPeak && "ring-2 ring-emerald-400"
                  )}
                  style={{ height: `${pct}%`, backgroundColor: meta.bg }}
                  title={`Week ${w.weekNumber} · ${w.totalKm} km · ${w.phase}`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-400">
        <span>Wk 1</span>
        <span>Wk {weeks.length}</span>
      </div>
    </div>
  );
}

interface Props {
  plan: TrainingPlan;
}

/**
 * Stats segment — everything that was pulled out of the lean hero (see
 * PlanOverview.tsx): weekly volume chart, training pace zone cards, and the
 * full phase timeline (inline labels on sm+, compact legend on mobile).
 */
export function PlanStats({ plan }: Props) {
  const segments = phaseSegments(plan.weeks);

  return (
    <div className="space-y-4">
      {/* ── Phase timeline (full) ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Plan Structure
        </div>
        <div className="flex h-3 rounded-full overflow-hidden">
          {segments.map((seg, i) => (
            <div
              key={`${seg.phase}-${seg.startWeek}`}
              style={{
                flexGrow: seg.count,
                backgroundColor: PHASE_META[seg.phase].bg,
              }}
              title={`${seg.phase}: weeks ${seg.startWeek}–${seg.endWeek}`}
              className={cn(
                "h-full transition-all hover:brightness-110",
                i > 0 && "border-l border-slate-900/20"
              )}
            />
          ))}
        </div>

        {/* inline labels — sm and up */}
        <div className="hidden sm:flex mt-2 gap-1">
          {segments.map((seg) => (
            <div
              key={`lbl-${seg.phase}-${seg.startWeek}`}
              style={{ flexGrow: seg.count }}
              className="min-w-0"
            >
              {seg.count >= 2 && (
                <>
                  <div className="truncate text-xs font-bold text-slate-800">{seg.phase}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Wk {seg.startWeek}–{seg.endWeek}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* compact legend — mobile only, never clips */}
        <div className="flex sm:hidden flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {segments.map((seg) => (
            <div
              key={`legend-${seg.phase}-${seg.startWeek}`}
              className="flex items-center gap-1.5 text-xs text-slate-600"
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: PHASE_META[seg.phase].bg }}
              />
              {seg.phase}
              <span className="text-slate-400">({seg.count}w)</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly volume ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <VolumeChart weeks={plan.weeks} />
      </div>

      {/* ── Pace zones ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Training Paces
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PACE_ZONE_ORDER.map(({ key, label, bg, text }) => (
            <div
              key={key}
              className="rounded-xl overflow-hidden border border-slate-100 flex"
            >
              <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: bg }} />
              <div
                className="flex-1 px-2.5 py-2.5 sm:px-3 sm:py-3 text-center"
                style={{ backgroundColor: `${bg}1a` }}
              >
                <div
                  className="text-sm sm:text-base font-bold font-mono tabular-nums"
                  style={{ color: text }}
                >
                  {plan.paces[key]}
                  <span className="ml-0.5 text-[10px] font-semibold text-slate-400">
                    /km
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
