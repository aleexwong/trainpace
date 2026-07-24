import type { TrainingPlan } from "../types";
import { weeksUntilRace } from "../plan-math";
import { PHASE_META, phaseSegments, parsePlanGoalTime } from "../utils/planDisplay";

interface Props {
  plan: TrainingPlan;
}

/**
 * Lean plan hero — race name, goal time, countdown, the 3 stat tiles, and a
 * slim phase bar. Stays above the segmented view on every breakpoint. The
 * weekly volume chart, pace zone cards, and the full phase timeline (labels
 * + legend) live in PlanStats now — see PlanStats.tsx.
 */
export function PlanOverview({ plan }: Props) {
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-5 sm:p-8 shadow-xl">
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

        {/* Stat tiles */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
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

        {/* Slim phase bar — full breakdown with labels/legend lives in the Stats segment */}
        <div className="mt-4 sm:mt-6">
          <div className="flex h-2.5 rounded-full overflow-hidden">
            {segments.map((seg, i) => (
              <div
                key={`${seg.phase}-${seg.startWeek}`}
                style={{
                  flexGrow: seg.count,
                  backgroundColor: PHASE_META[seg.phase].bg,
                }}
                title={`${seg.phase}: weeks ${seg.startWeek}–${seg.endWeek}`}
                className={i > 0 ? "h-full border-l border-slate-900/40" : "h-full"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
