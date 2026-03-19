/**
 * VdotCalculator — Main orchestrator component
 * Dashboard-style grid layout: everything visible at a glance, minimal scrolling.
 */

import { useRef } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useVdotCalculator } from "../hooks/useVdotCalculator";
import { VdotSeoHead } from "./VdotSeoHead";
import { VdotHero } from "./VdotHero";
import { DistanceSelector } from "./DistanceSelector";
import { TimeInput } from "./TimeInput";
import { VdotScoreDisplay } from "./VdotScoreDisplay";
import { TrainingZonesDisplay } from "./TrainingZonesDisplay";
import { RacePredictionsTable } from "./RacePredictionsTable";
import { VdotComparison } from "./VdotComparison";
import { SampleWorkouts } from "./SampleWorkouts";
import { VdotFaq } from "./VdotFaq";

export function VdotCalculator() {
  const {
    inputs,
    result,
    errors,
    paceUnit,
    totalSeconds,
    vdotPreview,
    history,
    handleDistanceSelect,
    handleTimeChange,
    handleCalculate,
    handleReset,
    handlePaceUnitToggle,
    loadFromHistory,
    clearHistory,
  } = useVdotCalculator();

  const resultsRef = useRef<HTMLDivElement>(null);

  const onCalculate = () => {
    handleCalculate();
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <>
      <VdotSeoHead />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6">
        {/* Wider container for dashboard layout */}
        <div className={result ? "max-w-7xl mx-auto" : "max-w-4xl mx-auto"}>
          {/* Hero — compact when showing results */}
          {!result ? (
            <VdotHero />
          ) : (
            /* Compact header bar in results mode */
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Calculation
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">VDOT Dashboard</h1>
                  <p className="text-xs text-gray-500">
                    {inputs.distanceName} &middot; {(() => { const h = parseInt(inputs.hours || "0"); const m = parseInt(inputs.minutes || "0"); const s = parseInt(inputs.seconds || "0"); const parts = []; if (h > 0) parts.push(`${h}h`); if (m > 0) parts.push(`${m}m`); if (s > 0) parts.push(`${s}s`); return parts.join(" "); })()}
                  </p>
                </div>
              </div>
              <div
                className="relative w-32 h-8 bg-indigo-100 rounded-full cursor-pointer overflow-hidden select-none"
                onClick={handlePaceUnitToggle}
                title="Toggle pace display unit"
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-[calc(50%-0.25rem)] h-7 bg-indigo-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                    paceUnit === "mi" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-1/2 text-center text-xs font-semibold transition-colors ${paceUnit === "km" ? "text-white" : "text-indigo-700"}`}>
                    min/km
                  </div>
                  <div className={`w-1/2 text-center text-xs font-semibold transition-colors ${paceUnit === "mi" ? "text-white" : "text-indigo-700"}`}>
                    min/mi
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          {!result ? (
            /* ─── INPUT STATE ─── */
            <div className="space-y-6">
              <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      Enter a Recent Race Result
                    </h2>
                    <p className="text-sm text-gray-500">
                      Select your race distance and finish time below
                    </p>
                  </div>

                  <DistanceSelector
                    selectedMeters={inputs.distanceMeters}
                    onSelect={handleDistanceSelect}
                    error={errors.distance}
                  />

                  <TimeInput
                    inputs={inputs}
                    onTimeChange={handleTimeChange}
                    onCalculate={onCalculate}
                    vdotPreview={vdotPreview}
                    error={errors.time}
                  />
                </CardContent>
              </Card>

              {/* Calculation history */}
              {history.length > 0 && (
                <div className="px-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Recent Calculations
                    </p>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((entry, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadFromHistory(entry)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                      >
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-700">{entry.distanceName}</span>
                        <span className="text-gray-400">{entry.timeFormatted}</span>
                        <span className="font-bold text-blue-600">{entry.vdot}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ─── RESULTS DASHBOARD ─── */
            <div ref={resultsRef}>
              {/*
                Dashboard grid:
                ┌──────────────┬───────────────────┐
                │  VDOT Score   │  Training Zones   │
                │  (gauge)      │  (5 zones)        │
                ├──────────────┤                   │
                │  Workouts     │                   │
                │  (4 cards)    │                   │
                ├──────────────┴───────────────────┤
                │  Race Predictions  │  What If?    │
                └──────────────┴───────────────────┘
              */}

              {/* Row 1: Score/Workouts + Zones/WhatIf (side by side on lg) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4 items-start">
                {/* Left: Score + Workouts stacked */}
                <div className="lg:col-span-5 space-y-4">
                  <VdotScoreDisplay
                    result={result}
                    inputs={inputs}
                    totalSeconds={totalSeconds}
                    onReset={handleReset}
                    compact
                  />
                  <SampleWorkouts
                    zones={result.trainingZones}
                    paceUnit={paceUnit}
                    compact
                  />
                </div>

                {/* Right: Training Zones + What If stacked */}
                <div className="lg:col-span-7 space-y-4">
                  <TrainingZonesDisplay
                    zones={result.trainingZones}
                    paceUnit={paceUnit}
                    vdot={result.vdot}
                    onTogglePaceUnit={handlePaceUnitToggle}
                    compact
                  />
                  <VdotComparison
                    currentVdot={result.vdot}
                    distanceMeters={inputs.distanceMeters}
                    distanceName={inputs.distanceName}
                    totalSeconds={totalSeconds}
                    compact
                  />
                </div>
              </div>

              {/* Row 2: Race Predictions (full width) */}
              <div>
                <RacePredictionsTable
                  predictions={result.racePredictions}
                  inputDistanceName={inputs.distanceName}
                  compact
                />
              </div>
            </div>
          )}

          {/* FAQ — always visible for SEO */}
          <div className="mt-12 max-w-4xl mx-auto space-y-6">
            <VdotFaq />

            {/* Related Tools */}
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Related Tools
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Link
                    to="/calculator"
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl">&#9201;&#65039;</span>
                    <div>
                      <p className="font-medium text-gray-900">Pace Calculator</p>
                      <p className="text-sm text-gray-600">Training paces from any race time</p>
                    </div>
                  </Link>
                  <Link
                    to="/fuel"
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl">&#9889;</span>
                    <div>
                      <p className="font-medium text-gray-900">Fuel Planner</p>
                      <p className="text-sm text-gray-600">Race-day nutrition strategy</p>
                    </div>
                  </Link>
                  <Link
                    to="/elevation-finder"
                    className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100 hover:border-orange-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl">&#9968;&#65039;</span>
                    <div>
                      <p className="font-medium text-gray-900">Elevation Finder</p>
                      <p className="text-sm text-gray-600">Course elevation analysis</p>
                    </div>
                  </Link>
                  <Link
                    to="/race"
                    className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl">&#127941;</span>
                    <div>
                      <p className="font-medium text-gray-900">Race Guides</p>
                      <p className="text-sm text-gray-600">Marathon course previews &amp; tips</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
