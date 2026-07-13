import { useState } from "react";
import type { GoalRace, FitnessLevel, RunDay, PlanGeneratorInputs } from "../types";

const GOAL_RACES: GoalRace[] = ["5K", "10K", "Half Marathon", "Marathon"];
const FITNESS_LEVELS: { value: FitnessLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "Beginner", desc: "< 2 years running, < 30 km/week" },
  { value: "intermediate", label: "Intermediate", desc: "2–5 years running, 40–60 km/week" },
  { value: "advanced", label: "Advanced", desc: "5+ years running, > 70 km/week" },
];
const ALL_DAYS: RunDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  onGenerate: (inputs: PlanGeneratorInputs) => void;
  loading?: boolean;
  prefillPaces?: {
    easy: string;
    tempo: string;
    interval: string;
    race: string;
  };
  prefillGoalTime?: string;
  prefillGoalRace?: GoalRace;
  prefillSource?: "calculator" | "vdot";
}

export function PlanInputForm({ onGenerate, loading, prefillPaces, prefillGoalTime, prefillGoalRace, prefillSource }: Props) {
  const [goalRace, setGoalRace] = useState<GoalRace>(prefillGoalRace ?? "Half Marathon");
  const [raceDate, setRaceDate] = useState("");
  const [fitness, setFitness] = useState<FitnessLevel>("intermediate");
  const [days, setDays] = useState<RunDay[]>(["Tue", "Thu", "Sat", "Sun"]);
  const [goalTime, setGoalTime] = useState(prefillGoalTime ?? "");

  function toggleDay(day: RunDay) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  // Minimum race date = 4 weeks from today
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 28);
  const minDateStr = minDate.toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      goalRace,
      raceDate,
      currentFitness: fitness,
      availableDays: ALL_DAYS.filter((d) => days.includes(d)),
      goalTime: goalTime || undefined,
      paceResults: prefillPaces,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Pace calculator prefill callout */}
      {prefillPaces && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-3">
          <span className="text-emerald-600 mt-0.5">⚡</span>
          <div className="text-sm">
            <span className="font-semibold text-emerald-800">
              {prefillSource === "vdot"
                ? "Paces imported from your VDOT score."
                : "Paces imported from Pace Calculator."}
            </span>
            <span className="text-emerald-700 ml-1">
              Easy {prefillPaces.easy} · Tempo {prefillPaces.tempo} · Interval {prefillPaces.interval}
            </span>
          </div>
        </div>
      )}
      {/* Goal Race */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Goal Race
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GOAL_RACES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setGoalRace(r)}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                goalRace === r
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Race Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Race Date
        </label>
        <div className="relative w-full sm:w-64">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            required
            min={minDateStr}
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 pl-11 pr-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
          />
        </div>
      </div>

      {/* Fitness Level */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Current Fitness Level
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FITNESS_LEVELS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFitness(value)}
              className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                fitness === value
                  ? "border-emerald-600 bg-emerald-600 shadow-md shadow-emerald-600/20"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
              }`}
            >
              <div className={`text-sm font-bold mb-1 ${fitness === value ? "text-white" : "text-slate-800"}`}>
                {label}
              </div>
              <div className={`text-xs ${fitness === value ? "text-emerald-50" : "text-slate-500"}`}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Training Days */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Training Days
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`w-14 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                days.includes(day)
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {days.length} days selected · long run assigned to last selected day
        </p>
      </div>

      {/* Optional Goal Time */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Goal Time <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Used to label your plan. Enter via the{" "}
          <a href="/calculator" className="text-emerald-600 hover:underline font-medium">
            Pace Calculator
          </a>{" "}
          to get zone-specific paces.
        </p>
        <input
          type="text"
          placeholder="e.g. 1:45:00"
          value={goalTime}
          onChange={(e) => setGoalTime(e.target.value)}
          className="w-48 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || days.length < 2 || !raceDate}
          className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold px-8 py-4 text-base transition-all shadow-md shadow-emerald-600/20"
        >
          {loading ? "Generating…" : "Generate My Plan →"}
        </button>
        {!loading && (days.length < 2 || !raceDate) && (
          <p className="mt-2 text-xs text-slate-400">
            {!raceDate
              ? "Pick a race date to continue."
              : "Select at least 2 training days to continue."}
          </p>
        )}
      </div>
    </form>
  );
}
