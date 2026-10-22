import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb } from "lucide-react";
import { calculateVdot } from "@/features/vdot-calculator/vdot-math";
import { cn } from "@/lib/utils";
import { OFFICIAL_DISTANCES } from "../debrief-math";
import type { DistanceChoice } from "../hooks/useRaceDebrief";
import type { DebriefResult, SplitUnit } from "../types";
import { formatClock, formatPaceIn } from "../utils";
import { SplitBars } from "./SplitBars";

interface DebriefResultsProps {
  result: DebriefResult;
  takeaways: string[];
  unit: SplitUnit;
  onUnitChange: (unit: SplitUnit) => void;
  distance: DistanceChoice;
  onDistanceChange: (d: DistanceChoice) => void;
  resultMeters: number;
}

const SHAPE_LABEL = {
  negative: "Negative split",
  even: "Even split",
  positive: "Positive split",
} as const;

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col min-w-0">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span
        className={cn(
          "font-display tabular-nums text-xl sm:text-2xl font-bold text-gray-900",
          accent
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-gray-500 mt-0.5">{sub}</span>}
    </div>
  );
}

export function DebriefResults({
  result,
  takeaways,
  unit,
  onUnitChange,
  distance,
  onDistanceChange,
  resultMeters,
}: DebriefResultsProps) {
  const vdot = calculateVdot(resultMeters, result.elapsedSec);
  const showVdot = isFinite(vdot) && vdot > 20 && vdot < 90;
  const halfSign = result.halfDiffPct > 0 ? "+" : result.halfDiffPct < 0 ? "−" : "";
  const shapeAccent =
    result.shape === "positive" && result.halfDiffPct > 3 ? "text-red-600" : "text-emerald-700";
  const fuelRelevant = result.gpsDistanceKm > 15 && result.slowdownFromKm !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm text-gray-700">
          <span className="block mb-1 font-medium">Race distance</span>
          <select
            className="rounded-md border bg-white px-3 py-2 text-sm"
            value={distance}
            onChange={(e) =>
              onDistanceChange(e.target.value === "gps" ? "gps" : Number(e.target.value))
            }
          >
            {OFFICIAL_DISTANCES.map((d) => (
              <option key={d.name} value={d.meters}>
                {d.name}
              </option>
            ))}
            <option value="gps">Watch distance ({result.gpsDistanceKm.toFixed(2)} km)</option>
          </select>
        </label>
        <div role="group" aria-label="Split units" className="inline-flex rounded-lg border bg-gray-50 p-0.5 text-sm">
          {(["km", "mi"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => onUnitChange(u)}
              className={cn(
                "px-3 py-1.5 rounded-md",
                unit === u ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-600"
              )}
            >
              {u === "km" ? "Kilometres" : "Miles"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile
          label="Finish time"
          value={formatClock(result.elapsedSec)}
          sub={`${result.gpsDistanceKm.toFixed(2)} km on your watch`}
        />
        <Tile
          label="Average pace"
          value={formatPaceIn((result.elapsedSec / resultMeters) * 1000, unit)}
          sub="over the race distance"
        />
        <Tile
          label={SHAPE_LABEL[result.shape]}
          value={`${halfSign}${formatClock(result.secondHalfSec - result.firstHalfSec)}`}
          sub={`${formatClock(result.firstHalfSec)} / ${formatClock(result.secondHalfSec)}`}
          accent={shapeAccent}
        />
        <Tile
          label="Pacing consistency"
          value={`${result.consistency.score}/100`}
          sub={result.consistency.label}
        />
        {showVdot && (
          <Tile label="Race VDOT" value={vdot.toFixed(1)} sub="fitness shown by this result" />
        )}
      </div>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-600" aria-hidden="true" />
          What this race tells you
        </h2>
        <ul className="space-y-2 text-gray-800 list-disc pl-5">
          {takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your splits</h2>
        <p className="text-sm text-gray-600 mb-4">
          Bars show each split against your average.
          {result.hasElevation &&
            " “Adjusted for hills” converts each split to the flat-ground pace for the same effort, so a climb doesn't look like a bad patch."}
        </p>
        <SplitBars splits={result.splits} unit={unit} hasElevation={result.hasElevation} />
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Use this race for your next one</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          <NextStep
            to={`/vdot?d=${Math.round(resultMeters)}&t=${Math.round(result.elapsedSec)}`}
            title="See your new VDOT"
            text="Equivalent times for every distance from this result."
          />
          <NextStep
            to={`/calculator?d=${(resultMeters / 1000).toFixed(3)}&t=${Math.round(result.elapsedSec)}`}
            title="Update your training paces"
            text="Easy, tempo and interval paces from this race."
          />
          <NextStep
            to="/plan"
            title="Build your next plan"
            text="A week-by-week plan to your next goal race."
          />
          {fuelRelevant && (
            <NextStep
              to="/fuel"
              title="Fix your fuelling"
              text="Carbs per hour and gel timing for your next long race."
            />
          )}
        </ul>
      </section>
    </div>
  );
}

function NextStep({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-start justify-between gap-3 rounded-lg border p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <span>
          <span className="block font-semibold text-gray-900">{title}</span>
          <span className="block text-sm text-gray-600">{text}</span>
        </span>
        <ArrowRight className="w-4 h-4 mt-1 text-gray-400 group-hover:text-blue-600 shrink-0" aria-hidden="true" />
      </Link>
    </li>
  );
}
