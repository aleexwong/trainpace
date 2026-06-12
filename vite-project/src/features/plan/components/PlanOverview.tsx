import type { TrainingPlan, TrainingPhase, TrainingWeek } from "../types";
import { phaseColor } from "../plan-math";

function VolumeChart({ weeks }: { weeks: TrainingWeek[] }) {
  const maxKm = Math.max(...weeks.map((w) => w.totalKm));
  const chartH = 80;
  const barW = Math.max(4, Math.floor(540 / weeks.length) - 2);

  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Weekly Volume
      </div>
      <div className="overflow-x-auto">
        <svg
          width={weeks.length * (barW + 2)}
          height={chartH + 24}
          className="block"
        >
          {weeks.map((w, i) => {
            const barH = Math.round((w.totalKm / maxKm) * chartH);
            const x = i * (barW + 2);
            const y = chartH - barH;
            const color = phaseColor(w.phase);
            return (
              <g key={w.weekNumber}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={2}
                  fill={color}
                />
                {weeks.length <= 20 && (
                  <text
                    x={x + barW / 2}
                    y={chartH + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#94a3b8"
                  >
                    {w.weekNumber}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="text-xs text-slate-400 mt-1">Week number · height = km</div>
    </div>
  );
}

interface Props {
  plan: TrainingPlan;
}

export function PlanOverview({ plan }: Props) {
  const phaseSummary = plan.weeks.reduce<Record<TrainingPhase, number>>(
    (acc, w) => {
      acc[w.phase] = (acc[w.phase] || 0) + 1;
      return acc;
    },
    {} as Record<TrainingPhase, number>
  );

  const totalKm = plan.weeks.reduce((s, w) => s + w.totalKm, 0);
  const peakKm = Math.max(...plan.weeks.map((w) => w.totalKm));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {plan.totalWeeks} weeks · Race:{" "}
          {new Date(plan.raceDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Weeks", value: plan.totalWeeks },
          { label: "Total Volume", value: `${totalKm} km` },
          { label: "Peak Week", value: `${peakKm} km` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{value}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Phase timeline */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Plan Structure
        </div>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 h-10">
          {(Object.entries(phaseSummary) as [TrainingPhase, number][]).map(
            ([phase, count]) => (
              <div
                key={phase}
                style={{
                  width: `${(count / plan.totalWeeks) * 100}%`,
                  backgroundColor: phaseColor(phase),
                }}
                title={`${phase}: ${count} weeks`}
                className="flex items-center justify-center text-xs font-bold text-slate-700 overflow-hidden"
              >
                {count >= 2 ? phase.split(" ")[0] : ""}
              </div>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {(Object.entries(phaseSummary) as [TrainingPhase, number][]).map(
            ([phase, count]) => (
              <div key={phase} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: phaseColor(phase) }}
                />
                <span className="text-xs text-slate-600">
                  {phase} ({count}w)
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Volume ramp chart */}
      <VolumeChart weeks={plan.weeks} />

      {/* Paces */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Training Paces (min/km)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              ["Easy", plan.paces.easy],
              ["Long", plan.paces.long],
              ["Tempo", plan.paces.tempo],
              ["Interval", plan.paces.interval],
              ["Recovery", plan.paces.recovery],
            ] as [string, string][]
          ).map(([label, pace]) => (
            <div key={label} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <div className="text-base font-bold text-emerald-700 font-mono">{pace}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
