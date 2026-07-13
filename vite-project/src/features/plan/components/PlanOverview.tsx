import type { TrainingPlan, TrainingWeek } from "../types";
import { weeksUntilRace } from "../plan-math";
import { PHASE_META, PACE_ZONE_ORDER, phaseSegments, parsePlanGoalTime } from "../utils/planDisplay";
import type { ProgressSummary } from "../hooks/usePlanProgress";
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
  /** Omit to hide the progress tile — shown once a plan has been generated/saved. */
  progress?: ProgressSummary;
}

export function PlanOverview({ plan, progress }: Props) {
  const totalKm = plan.weeks.reduce((s, w) => s + w.totalKm, 0);
  const peakKm = Math.max(...plan.weeks.map((w) => w.totalKm));
  const segments = phaseSegments(plan.weeks);
  const goalTime = parsePlanGoalTime(plan.name);
  const weeksLeft = weeksUntilRace(plan.raceDate);

  const raceDateLabel = new Date(plan.raceDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 sm:p-8 shadow-xl">
        {/* decorative glow */}
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {plan.totalWeeks}-Week Plan
          </div>

          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {plan.goalRace}
          </h2>

          {goalTime ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl sm:text-5xl font-bold text-emerald-300 tabular-nums tracking-tight">
                {goalTime}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Goal Time
              </span>
            </div>
          ) : (
            <div className="mt-1 text-sm font-medium text-slate-300 capitalize">
              {plan.fitnessLevel} fitness plan
            </div>
          )}

          <p className="mt-3 text-sm text-slate-300">
            Race day{" "}
            <span className="font-semibold text-white">{raceDateLabel}</span>
            {" · "}
            <span className="font-semibold text-emerald-300">
              {weeksLeft > 0 ? `${weeksLeft} weeks to go` : "Race week!"}
            </span>
          </p>

          {/* Progress */}
          {progress && progress.totalCount > 0 && (
            <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Plan Progress
                </span>
                <span className="font-display text-sm font-bold text-emerald-300 tabular-nums">
                  {progress.completedCount}/{progress.totalCount} runs · {progress.pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Stat tiles */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Total Weeks", value: `${plan.totalWeeks}` },
              { label: "Total Volume", value: `${totalKm}`, unit: "km" },
              { label: "Peak Week", value: `${peakKm}`, unit: "km" },
            ].map(({ label, value, unit }) => (
              <div
                key={label}
                className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-2 py-3 sm:px-4 sm:py-4 text-center"
              >
                <div className="font-display text-xl sm:text-3xl font-bold text-white tabular-nums">
                  {value}
                  {unit && <span className="ml-0.5 text-xs sm:text-sm font-semibold text-slate-400">{unit}</span>}
                </div>
                <div className="mt-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Phase timeline */}
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
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
                    i > 0 && "border-l border-slate-900/40"
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
                      <div className="truncate text-xs font-bold text-white">
                        {seg.phase}
                      </div>
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
                  className="flex items-center gap-1.5 text-xs text-slate-300"
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PHASE_META[seg.phase].bg }}
                  />
                  {seg.phase}
                  <span className="text-slate-500">({seg.count}w)</span>
                </div>
              ))}
            </div>
          </div>
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
