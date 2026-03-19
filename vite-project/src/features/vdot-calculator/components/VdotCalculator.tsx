/**
 * VdotCalculator — Main orchestrator component
 * Composes all sub-components into the complete VDOT calculator experience.
 */

import { useRef } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
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
    // Scroll to results after a short delay for state to update
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <>
      <VdotSeoHead />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <VdotHero />

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
                        <span className="font-medium text-gray-700">
                          {entry.distanceName}
                        </span>
                        <span className="text-gray-400">{entry.timeFormatted}</span>
                        <span className="font-bold text-blue-600">
                          {entry.vdot}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ─── RESULTS STATE ─── */
            <div ref={resultsRef} className="space-y-6">
              <VdotScoreDisplay
                result={result}
                inputs={inputs}
                totalSeconds={totalSeconds}
                onReset={handleReset}
              />

              <TrainingZonesDisplay
                zones={result.trainingZones}
                paceUnit={paceUnit}
                vdot={result.vdot}
                onTogglePaceUnit={handlePaceUnitToggle}
              />

              <RacePredictionsTable
                predictions={result.racePredictions}
                inputDistanceName={inputs.distanceName}
              />

              <VdotComparison
                currentVdot={result.vdot}
                distanceMeters={inputs.distanceMeters}
                distanceName={inputs.distanceName}
                totalSeconds={totalSeconds}
              />

              <SampleWorkouts
                zones={result.trainingZones}
                paceUnit={paceUnit}
              />
            </div>
          )}

          {/* FAQ — always visible for SEO */}
          <div className="mt-12 space-y-6">
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
