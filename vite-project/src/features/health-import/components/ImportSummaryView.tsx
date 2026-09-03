import { Link } from "react-router-dom";
import { Activity, CalendarDays, Gauge, HeartPulse, Route } from "lucide-react";
import {
  formatDistance,
  formatDuration,
  formatPace,
  type DistanceUnit,
} from "../summarize";
import type { HealthSummary } from "../types";

interface ImportSummaryViewProps {
  summary: HealthSummary;
  unit: DistanceUnit;
  onUnitChange: (unit: DistanceUnit) => void;
}

function Tile({
  icon: Icon,
  label,
  value,
  note,
  testId,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  note?: string;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left"
    >
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
        {value}
      </p>
      {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
    </div>
  );
}

export default function ImportSummaryView({
  summary,
  unit,
  onUnitChange,
}: ImportSummaryViewProps) {
  const peakWeekMeters = summary.weekly.reduce(
    (max, week) => Math.max(max, week.meters),
    0
  );

  return (
    <div className="text-left space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your last 90 days</h2>
          <p className="text-sm text-slate-500">
            {summary.windowStart
              ? `${summary.totalRuns} runs from ${summary.windowStart} to ${summary.windowEnd}`
              : "No runs found in this window."}
          </p>
        </div>

        <div
          className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
          role="group"
          aria-label="Distance unit"
        >
          {(["km", "mi"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onUnitChange(option)}
              aria-pressed={unit === option}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                unit === option
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          icon={Activity}
          testId="summary-tile-runs"
          label="Runs"
          value={String(summary.totalRuns)}
          note={
            summary.indoorRuns > 0
              ? `${summary.indoorRuns} indoor`
              : "all outdoors"
          }
        />
        <Tile
          icon={Route}
          testId="summary-tile-distance"
          label="Distance"
          value={formatDistance(summary.totalMeters, unit)}
          note={`${formatDuration(summary.totalSeconds)} on foot`}
        />
        <Tile
          icon={CalendarDays}
          testId="summary-tile-week"
          label="Average week"
          value={formatDistance(summary.weeklyMeanMeters, unit)}
          note={`${summary.runsPerWeek} runs per week`}
        />
        <Tile
          icon={Gauge}
          testId="summary-tile-vdot"
          label="VDOT"
          value={summary.vdot != null ? summary.vdot.toFixed(1) : "—"}
          note={
            summary.vdotSource
              ? `from your ${summary.vdotSource.label.toLowerCase()}`
              : "no run reached 5 km"
          }
        />
      </div>

      {summary.bests.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Fastest efforts
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            The quickest run you logged at each distance. These are training
            runs unless you happened to race — read them as a floor on your
            fitness, not a ceiling. Treadmill runs are left out because their
            distance depends on the machine's calibration.
          </p>

          <div
            data-testid="summary-best-efforts"
            className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
          >
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Distance</th>
                  <th className="text-left font-medium px-4 py-3">Time</th>
                  <th className="text-left font-medium px-4 py-3">Pace</th>
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-left font-medium px-4 py-3">Use it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.bests.map((effort) => {
                  const km = (effort.meters / 1000).toFixed(3);
                  return (
                    <tr key={effort.label}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {effort.label}
                        <span className="block text-xs font-normal text-slate-500">
                          {formatDistance(effort.meters, unit)} measured
                        </span>
                      </td>
                      <td className="px-4 py-3 font-display tabular-nums text-slate-700">
                        {formatDuration(effort.seconds)}
                      </td>
                      <td className="px-4 py-3 font-display tabular-nums text-slate-700">
                        {formatPace(effort.meters, effort.seconds, unit)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{effort.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <Link
                            className="text-emerald-600 hover:underline whitespace-nowrap"
                            to={`/calculator?d=${km}&t=${effort.seconds}`}
                          >
                            Pace zones
                          </Link>
                          <Link
                            className="text-emerald-600 hover:underline whitespace-nowrap"
                            to={`/vdot?d=${Math.round(effort.meters)}&t=${effort.seconds}`}
                          >
                            VDOT
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {summary.weekly.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Week by week</h3>
          <ul className="space-y-2">
            {summary.weekly.map((week) => (
              <li key={week.weekStart} className="flex items-center gap-3">
                <span className="w-12 sm:w-20 shrink-0 font-display text-xs text-slate-500 tabular-nums">
                  {week.weekStart.slice(5)}
                </span>
                <span className="flex-1 h-6 rounded bg-slate-100 overflow-hidden">
                  <span
                    className="block h-full rounded bg-emerald-500/80"
                    style={{
                      width: `${
                        peakWeekMeters > 0
                          ? Math.max(2, (week.meters / peakWeekMeters) * 100)
                          : 2
                      }%`,
                    }}
                  />
                </span>
                <span className="w-20 sm:w-28 shrink-0 text-right font-display text-sm text-slate-700 tabular-nums">
                  {formatDistance(week.meters, unit)}
                </span>
                <span className="hidden sm:block w-16 shrink-0 text-right font-display text-xs text-slate-500 tabular-nums">
                  {week.runs} {week.runs === 1 ? "run" : "runs"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(summary.latestVo2Max ||
        summary.latestRestingHeartRate ||
        summary.latestBodyMass ||
        summary.otherActivities.length > 0) && (
        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            Everything else Health knows
          </h3>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {summary.latestVo2Max && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">VO2 max (Apple's estimate)</dt>
                <dd className="font-display text-slate-900 tabular-nums">
                  {summary.latestVo2Max.value.toFixed(1)}
                </dd>
              </div>
            )}
            {summary.latestRestingHeartRate && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Resting heart rate</dt>
                <dd className="font-display text-slate-900 tabular-nums">
                  {Math.round(summary.latestRestingHeartRate.value)} bpm
                </dd>
              </div>
            )}
            {summary.latestBodyMass && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Body mass</dt>
                <dd className="font-display text-slate-900 tabular-nums">
                  {summary.latestBodyMass.value.toFixed(1)}{" "}
                  {summary.latestBodyMass.unit}
                </dd>
              </div>
            )}
            {summary.totalEnergyKcal > 0 && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Active energy while running</dt>
                <dd className="font-display text-slate-900 tabular-nums">
                  {summary.totalEnergyKcal.toLocaleString()} kcal
                </dd>
              </div>
            )}
            {summary.longestRunMeters > 0 && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Longest run</dt>
                <dd className="font-display text-slate-900 tabular-nums">
                  {formatDistance(summary.longestRunMeters, unit)}
                </dd>
              </div>
            )}
            {summary.otherActivities.length > 0 && (
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 sm:col-span-2">
                <dt className="text-slate-500">Cross-training</dt>
                <dd className="text-slate-900 text-right">
                  {summary.otherActivities
                    .map((activity) => `${activity.activityType} ×${activity.count}`)
                    .join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}
