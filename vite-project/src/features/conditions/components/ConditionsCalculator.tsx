/**
 * ConditionsCalculator — orchestrator for the race day conditions tool.
 *
 * Dashboard layout: inputs and answer side by side, so adjusting the forecast
 * and watching the finish time move is a single glance rather than a scroll.
 */

import { Link } from "react-router-dom";
import { CloudSun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useConditionsCalculator } from "../hooks/useConditionsCalculator";
import type { ConditionsFormState } from "../types";
import { ConditionsSeoHead } from "./ConditionsSeoHead";
import { ConditionsInputPanel } from "./ConditionsInputPanel";
import { formatDewPoint } from "../utils";
import { ConditionsVerdict } from "./ConditionsVerdict";
import { TemperatureCurveChart } from "./TemperatureCurveChart";
import { AdjustedZonesTable } from "./AdjustedZonesTable";
import { ConditionsFaq } from "./ConditionsFaq";

export interface ConditionsCalculatorProps {
  initialForm?: Partial<ConditionsFormState>;
}

export function ConditionsCalculator({
  initialForm,
}: ConditionsCalculatorProps = {}) {
  const {
    form,
    paceUnit,
    input,
    isValid,
    result,
    adjustedZones,
    sensitivity,
    setField,
    selectDistance,
    setTimePart,
    toggleTempUnit,
    toggleAltitudeUnit,
    applyPreset,
    togglePaceUnit,
  } = useConditionsCalculator(initialForm);

  return (
    <>
      <ConditionsSeoHead />

      {/* text-left resets the global `#root { text-align: center }` inherited
          from the Vite template; individually centred elements opt back in. */}
      <div className="min-h-screen text-left bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <header className="mb-5 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-3">
              <CloudSun className="w-3.5 h-3.5" />
              Race Day Conditions
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              What will the weather cost you?
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1.5 max-w-2xl">
              Heat, humidity, and altitude all take time off a goal that was set
              in perfect conditions. Set the forecast and get a finish time you
              can actually race to &mdash; plus the paces to train at until then.
            </p>
          </header>

          {/*
            Dashboard. Explicit `order` on mobile keeps the answer directly
            under the inputs that produced it — stacking two nested columns
            would otherwise bury the verdict below the training-pace table.
            At lg the four cards resolve to a 2x2 grid.
          */}
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start">
            <div className="order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1">
              <ConditionsInputPanel
                form={form}
                dewPointDisplay={formatDewPoint(
                  input.tempC,
                  input.humidity,
                  form.tempUnit
                )}
                onSelectDistance={selectDistance}
                onTimePartChange={setTimePart}
                onFieldChange={setField}
                onToggleTempUnit={toggleTempUnit}
                onToggleAltitudeUnit={toggleAltitudeUnit}
                onApplyPreset={applyPreset}
              />
            </div>

            <div className="order-2 lg:col-span-7 lg:col-start-6 lg:row-start-1">
              {result ? (
                <ConditionsVerdict
                  result={result}
                  distanceName={form.distanceName}
                  paceUnit={paceUnit}
                  onTogglePaceUnit={togglePaceUnit}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <p className="text-sm text-gray-500">
                    {isValid
                      ? "Working…"
                      : "Enter a realistic goal time for the selected distance to see your adjusted race."}
                  </p>
                </div>
              )}
            </div>

            {result && (
              <div className="order-3 lg:col-span-7 lg:col-start-6 lg:row-start-2">
                <TemperatureCurveChart
                  points={sensitivity}
                  currentTempC={input.tempC}
                  currentTimeSeconds={result.adjustedTimeSeconds}
                  goalTimeSeconds={result.goalTimeSeconds}
                  tempUnit={form.tempUnit}
                />
              </div>
            )}

            {result && (
              <div className="order-4 lg:col-span-5 lg:col-start-1 lg:row-start-2">
                <AdjustedZonesTable
                  zones={adjustedZones}
                  paceUnit={paceUnit}
                  onTogglePaceUnit={togglePaceUnit}
                />
              </div>
            )}
          </div>

          {/* Explainer + related tools */}
          <div className="mt-10 space-y-6">
            <ConditionsFaq />

            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Related Tools
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <RelatedTool
                    to="/vdot"
                    emoji="📈"
                    title="VDOT Calculator"
                    blurb="Find your goal time from a recent race"
                    tone="emerald"
                  />
                  <RelatedTool
                    to="/fuel"
                    emoji="⚡"
                    title="Fuel Planner"
                    blurb="Hydration and carbs for hot races"
                    tone="emerald"
                  />
                  <RelatedTool
                    to="/elevation-finder"
                    emoji="⛰️"
                    title="Elevation Finder"
                    blurb="What the course itself will cost you"
                    tone="orange"
                  />
                  <RelatedTool
                    to="/plan"
                    emoji="🗓️"
                    title="Training Plan"
                    blurb="Build a week-by-week plan to your goal"
                    tone="purple"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

const TONES: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
  orange: "bg-orange-50 border-orange-100 hover:border-orange-300",
  purple: "bg-purple-50 border-purple-100 hover:border-purple-300",
};

function RelatedTool({
  to,
  emoji,
  title,
  blurb,
  tone,
}: {
  to: string;
  emoji: string;
  title: string;
  blurb: string;
  tone: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all ${TONES[tone]}`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{blurb}</p>
      </div>
    </Link>
  );
}
