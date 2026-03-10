/**
 * VDOT Calculator - Main Component
 * Comprehensive VDOT calculator based on Jack Daniels' Running Formula
 */

import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactGA from "react-ga4";

import type {
  VdotInputs,
  VdotFormErrors,
  VdotResult,
  PaceDisplayUnit,
} from "../types";
import { INPUT_DISTANCES, RACE_DISTANCES } from "../types";
import {
  calculateVdot,
  predictRaceTime,
  calculateTrainingZones,
  formatTime,
  formatPace,
} from "../vdot-math";

const initialFormState: VdotInputs = {
  distanceMeters: 0,
  distanceName: "",
  hours: "",
  minutes: "",
  seconds: "",
};

function validateInputs(inputs: VdotInputs): {
  isValid: boolean;
  errors: VdotFormErrors;
} {
  const errors: VdotFormErrors = {};

  if (!inputs.distanceMeters || inputs.distanceMeters <= 0) {
    errors.distance = "Please select a race distance";
  }

  const h = parseInt(inputs.hours || "0");
  const m = parseInt(inputs.minutes || "0");
  const s = parseInt(inputs.seconds || "0");
  const totalSeconds = h * 3600 + m * 60 + s;

  if (totalSeconds <= 0) {
    errors.time = "Please enter a valid finish time";
  }

  if (m >= 60 || s >= 60) {
    errors.time = "Invalid time format";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function VdotCalculator() {
  const [inputs, setInputs] = useState<VdotInputs>(initialFormState);
  const [result, setResult] = useState<VdotResult | null>(null);
  const [errors, setErrors] = useState<VdotFormErrors>({});
  const [paceUnit, setPaceUnit] = useState<PaceDisplayUnit>("km");
  const [showInfo, setShowInfo] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Memoized input state
  const totalSeconds = useMemo(() => {
    const h = parseInt(inputs.hours || "0");
    const m = parseInt(inputs.minutes || "0");
    const s = parseInt(inputs.seconds || "0");
    return h * 3600 + m * 60 + s;
  }, [inputs.hours, inputs.minutes, inputs.seconds]);

  const handleDistanceSelect = (meters: number, name: string) => {
    setInputs((prev) => ({ ...prev, distanceMeters: meters, distanceName: name }));
    setErrors((prev) => ({ ...prev, distance: undefined }));
  };

  const handleTimeChange = (field: "hours" | "minutes" | "seconds", value: string) => {
    const numValue = value.replace(/\D/g, "").slice(0, 2);
    setInputs((prev) => ({ ...prev, [field]: numValue }));
    setErrors((prev) => ({ ...prev, time: undefined }));
  };

  const handleCalculate = () => {
    const validation = validateInputs(inputs);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const vdot = calculateVdot(inputs.distanceMeters, totalSeconds);

    // Calculate race predictions
    const racePredictions = RACE_DISTANCES.map((race) => {
      const timeSeconds = predictRaceTime(vdot, race.meters);
      const pacePerKm = (timeSeconds / race.meters) * 1000;
      const pacePerMile = (timeSeconds / race.meters) * 1609.34;
      return {
        name: race.name,
        distance: race.meters,
        time: formatTime(timeSeconds),
        timeSeconds,
        pace:
          paceUnit === "km"
            ? `${formatPace(pacePerKm)}/km`
            : `${formatPace(pacePerMile)}/mi`,
      };
    });

    // Calculate training zones
    const trainingZones = calculateTrainingZones(vdot).map((zone) => ({
      name: zone.name,
      shortName: zone.shortName,
      description: zone.description,
      pacePerKm: `${formatPace(zone.pacePerKmSeconds[0])} – ${formatPace(zone.pacePerKmSeconds[1])}`,
      pacePerMile: `${formatPace(zone.pacePerMileSeconds[0])} – ${formatPace(zone.pacePerMileSeconds[1])}`,
      intensityRange: `${Math.round(zone.intensityRange[0] * 100)}–${Math.round(zone.intensityRange[1] * 100)}%`,
      color: zone.color,
    }));

    setResult({
      vdot: Math.round(vdot * 10) / 10,
      trainingZones,
      racePredictions,
      vo2max: Math.round(vdot * 10) / 10,
    });

    ReactGA.event({
      category: "VDOT Calculator",
      action: "Calculated VDOT",
      label: `${inputs.distanceName} - VDOT ${Math.round(vdot * 10) / 10}`,
    });
  };

  const handleReset = () => {
    setInputs(initialFormState);
    setResult(null);
    setErrors({});
  };

  const handlePaceUnitToggle = () => {
    const newUnit = paceUnit === "km" ? "mi" : "km";
    setPaceUnit(newUnit);

    // Recalculate race prediction pace display
    if (result) {
      const updatedPredictions = RACE_DISTANCES.map((race) => {
        const timeSeconds = predictRaceTime(result.vdot, race.meters);
        const pacePerKm = (timeSeconds / race.meters) * 1000;
        const pacePerMile = (timeSeconds / race.meters) * 1609.34;
        return {
          name: race.name,
          distance: race.meters,
          time: formatTime(timeSeconds),
          timeSeconds,
          pace:
            newUnit === "km"
              ? `${formatPace(pacePerKm)}/km`
              : `${formatPace(pacePerMile)}/mi`,
        };
      });
      setResult((prev) => (prev ? { ...prev, racePredictions: updatedPredictions } : prev));
    }
  };

  // Get VDOT level description
  const getVdotLevel = (vdot: number): { label: string; color: string } => {
    if (vdot >= 80) return { label: "Elite World Class", color: "text-purple-700" };
    if (vdot >= 70) return { label: "Elite", color: "text-red-600" };
    if (vdot >= 60) return { label: "Advanced", color: "text-orange-600" };
    if (vdot >= 50) return { label: "Competitive", color: "text-yellow-600" };
    if (vdot >= 40) return { label: "Intermediate", color: "text-blue-600" };
    if (vdot >= 30) return { label: "Recreational", color: "text-emerald-600" };
    return { label: "Beginner", color: "text-gray-600" };
  };

  const getZoneColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      emerald: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-800",
      },
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        badge: "bg-blue-100 text-blue-800",
      },
      yellow: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        badge: "bg-yellow-100 text-yellow-800",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
        badge: "bg-orange-100 text-orange-800",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        badge: "bg-red-100 text-red-800",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <Helmet>
        <title>VDOT Calculator – Jack Daniels Running Formula | TrainPace</title>
        <meta
          name="description"
          content="Free VDOT running calculator using Jack Daniels' formula. Get your VDOT score, race equivalency predictions, and science-based training paces for Easy, Marathon, Threshold, Interval, and Repetition zones."
        />
        <link rel="canonical" href="https://trainpace.com/vdot" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "VDOT Running Calculator",
            applicationCategory: "HealthApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description:
              "Calculate your VDOT score from any race result. Get predicted race times and science-based training paces using the Daniels Running Formula.",
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              🧮 VDOT Calculator
            </h1>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
              aria-label={showInfo ? "Hide information" : "Show information"}
            >
              <Info className="h-6 w-6 text-blue-600" />
            </button>
          </div>

          {showInfo && (
            <Card className="mb-8 bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">
                  What is VDOT? ⚡
                </h3>
                <p className="text-gray-700 mb-3">
                  VDOT is a measure of your current running ability, developed
                  by legendary coach Jack Daniels. It represents your effective
                  VO₂max — the oxygen your body can use while running.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    Enter any recent race result to calculate your VDOT score
                  </li>
                  <li>
                    Get equivalent race predictions across all standard distances
                  </li>
                  <li>
                    Receive science-based training paces for 5 intensity zones
                  </li>
                  <li>
                    Easy, Marathon, Threshold, Interval, and Repetition paces
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Input Form */}
            {!result ? (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
                    Enter a Recent Race Result
                  </h2>

                  {/* Distance Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Race Distance
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INPUT_DISTANCES.map((d) => (
                        <button
                          key={d.name}
                          onClick={() =>
                            handleDistanceSelect(d.meters, d.name)
                          }
                          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            inputs.distanceMeters === d.meters
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {errors.distance && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.distance}
                      </p>
                    )}
                  </div>

                  {/* Time Input */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Finish Time
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="HH"
                          value={inputs.hours}
                          onChange={(e) =>
                            handleTimeChange("hours", e.target.value)
                          }
                          className="w-full px-3 sm:px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Hours"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Hours
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-gray-400">
                        :
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM"
                          value={inputs.minutes}
                          onChange={(e) =>
                            handleTimeChange("minutes", e.target.value)
                          }
                          className="w-full px-3 sm:px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Minutes"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Minutes
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-gray-400">
                        :
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="SS"
                          value={inputs.seconds}
                          onChange={(e) =>
                            handleTimeChange("seconds", e.target.value)
                          }
                          className="w-full px-3 sm:px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Seconds"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Seconds
                        </p>
                      </div>
                    </div>
                    {errors.time && (
                      <p className="mt-2 text-sm text-red-600">{errors.time}</p>
                    )}
                  </div>

                  {/* Calculate Button */}
                  <button
                    onClick={handleCalculate}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Calculate VDOT
                  </button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* VDOT Score Display */}
                <Card className="bg-white shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8 text-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">
                          Your VDOT Score
                        </p>
                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl sm:text-6xl font-bold">
                            {result.vdot}
                          </span>
                          <span
                            className={`text-lg font-semibold px-3 py-1 rounded-full bg-white/20`}
                          >
                            {getVdotLevel(result.vdot).label}
                          </span>
                        </div>
                        <p className="text-blue-100 text-sm mt-2">
                          Based on {inputs.distanceName} in{" "}
                          {formatTime(totalSeconds)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                          ← New Calculation
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VDOT Scale */}
                  <CardContent className="p-6">
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-blue-500 via-yellow-500 via-orange-500 to-red-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((result.vdot - 15) / 70) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Beginner (20)</span>
                      <span>Recreational (35)</span>
                      <span>Competitive (50)</span>
                      <span>Advanced (65)</span>
                      <span>Elite (80+)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pace Unit Toggle */}
                <div className="flex justify-end">
                  <div
                    className="relative w-36 sm:w-40 h-9 sm:h-10 bg-purple-100 rounded-full cursor-pointer overflow-hidden"
                    onClick={handlePaceUnitToggle}
                    title="Toggle pace display unit"
                  >
                    <div
                      className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-[calc(50%-0.25rem)] h-8 sm:h-8 bg-purple-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                        paceUnit === "mi"
                          ? "translate-x-full"
                          : "translate-x-0"
                      }`}
                    />
                    <div className="absolute inset-0 flex items-center">
                      <div
                        className={`w-1/2 text-center text-xs font-medium transition-colors ${
                          paceUnit === "km"
                            ? "text-white"
                            : "text-purple-700"
                        }`}
                      >
                        min/km
                      </div>
                      <div
                        className={`w-1/2 text-center text-xs font-medium transition-colors ${
                          paceUnit === "mi"
                            ? "text-white"
                            : "text-purple-700"
                        }`}
                      >
                        min/mi
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Paces */}
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-4 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                      🎯 Training Paces
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Daniels&apos; 5 training zones based on your VDOT of{" "}
                      {result.vdot}
                    </p>

                    <div className="space-y-3">
                      {result.trainingZones.map((zone) => {
                        const colors = getZoneColorClasses(zone.color);
                        return (
                          <div
                            key={zone.shortName}
                            className={`p-4 rounded-xl border ${colors.bg} ${colors.border} transition-all hover:shadow-md`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${colors.badge}`}
                                  >
                                    {zone.shortName}
                                  </span>
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {zone.name}
                                  </h3>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-gray-400 cursor-help text-sm">
                                          ⓘ
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{zone.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                                  {zone.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-lg sm:text-2xl font-bold ${colors.text}`}
                                >
                                  {paceUnit === "km"
                                    ? zone.pacePerKm
                                    : zone.pacePerMile}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {paceUnit === "km" ? "min/km" : "min/mi"} •{" "}
                                  {zone.intensityRange} VO₂max
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Race Equivalency Table */}
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-4 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                      🏅 Race Equivalency
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Predicted race times based on your VDOT of {result.vdot}
                    </p>

                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Distance
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900">
                              Time
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900">
                              Pace
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.racePredictions.map((prediction, idx) => {
                            const isInputRace =
                              prediction.name === inputs.distanceName;
                            return (
                              <tr
                                key={prediction.name}
                                className={`border-b border-gray-100 transition-colors ${
                                  isInputRace
                                    ? "bg-blue-50 font-semibold"
                                    : idx % 2 === 0
                                    ? "bg-gray-50/50"
                                    : ""
                                } hover:bg-blue-50/50`}
                              >
                                <td className="py-3 px-4 text-gray-900">
                                  {prediction.name}
                                  {isInputRace && (
                                    <span className="ml-2 text-xs text-blue-600 font-normal">
                                      (your race)
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-gray-900">
                                  {prediction.time}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-600">
                                  {prediction.pace}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Workout Suggestions */}
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-4 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                      📋 Sample Workouts
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Key workouts for your VDOT level
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Easy Run */}
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          🟢 Easy Run
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">
                          30–60 min at Easy pace
                        </p>
                        <p className="text-emerald-700 font-mono font-semibold">
                          {paceUnit === "km"
                            ? result.trainingZones[0].pacePerKm
                            : result.trainingZones[0].pacePerMile}{" "}
                          {paceUnit === "km" ? "/km" : "/mi"}
                        </p>
                      </div>

                      {/* Tempo Run */}
                      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          🟡 Tempo Run
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">
                          20 min continuous at Threshold pace
                        </p>
                        <p className="text-yellow-700 font-mono font-semibold">
                          {paceUnit === "km"
                            ? result.trainingZones[2].pacePerKm
                            : result.trainingZones[2].pacePerMile}{" "}
                          {paceUnit === "km" ? "/km" : "/mi"}
                        </p>
                      </div>

                      {/* Intervals */}
                      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          🟠 VO₂max Intervals
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">
                          5 × 1000m at Interval pace, 3 min jog rest
                        </p>
                        <p className="text-orange-700 font-mono font-semibold">
                          {paceUnit === "km"
                            ? result.trainingZones[3].pacePerKm
                            : result.trainingZones[3].pacePerMile}{" "}
                          {paceUnit === "km" ? "/km" : "/mi"}
                        </p>
                      </div>

                      {/* Repetitions */}
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          🔴 Speed Reps
                        </h3>
                        <p className="text-sm text-gray-700 mb-2">
                          8 × 200m at Repetition pace, full recovery
                        </p>
                        <p className="text-red-700 font-mono font-semibold">
                          {paceUnit === "km"
                            ? result.trainingZones[4].pacePerKm
                            : result.trainingZones[4].pacePerMile}{" "}
                          {paceUnit === "km" ? "/km" : "/mi"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Science Section */}
          <div className="mt-12 max-w-4xl mx-auto">
            <button
              onClick={() => setShowScience(!showScience)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <span className="text-lg font-semibold text-gray-900">
                The Science Behind VDOT
              </span>
              {showScience ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showScience && (
              <Card className="mt-2 bg-gray-50">
                <CardContent className="p-6 text-gray-700 space-y-4 text-left">
                  <p>
                    VDOT was developed by exercise physiologist and running coach{" "}
                    <strong>Jack Daniels</strong>. It stands for &ldquo;V-dot-O₂max&rdquo; —
                    the rate of oxygen consumption — and represents your current
                    running fitness level.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    How It Works
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>VO₂ cost equation:</strong> Calculates the oxygen
                      cost of running at a given velocity using the formula:
                      VO₂ = -4.6 + 0.182258v + 0.000104v²
                    </li>
                    <li>
                      <strong>%VO₂max equation:</strong> Estimates what fraction
                      of your VO₂max you can sustain for a given race duration
                    </li>
                    <li>
                      <strong>VDOT = VO₂ / %VO₂max:</strong> Dividing the
                      oxygen cost by the sustainable fraction gives your
                      effective VO₂max
                    </li>
                  </ul>
                  <h3 className="text-lg font-semibold text-gray-900">
                    The 5 Training Zones
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Easy (E):</strong> 59–74% VO₂max — Builds aerobic
                      base, promotes recovery
                    </li>
                    <li>
                      <strong>Marathon (M):</strong> 75–84% VO₂max —
                      Marathon-specific endurance
                    </li>
                    <li>
                      <strong>Threshold (T):</strong> 83–88% VO₂max — Improves
                      lactate clearance at tempo pace
                    </li>
                    <li>
                      <strong>Interval (I):</strong> 95–100% VO₂max — Maximizes
                      aerobic capacity
                    </li>
                    <li>
                      <strong>Repetition (R):</strong> 105%+ VO₂max — Develops
                      speed and running economy
                    </li>
                  </ul>
                  <p className="text-sm italic">
                    Based on the Daniels &amp; Gilbert oxygen cost and time-limit
                    equations from &ldquo;Daniels&rsquo; Running Formula&rdquo; (4th Edition).
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
