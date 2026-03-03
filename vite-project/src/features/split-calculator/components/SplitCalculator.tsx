/**
 * Split Calculator - Main Orchestrator
 * Generates per-km or per-mile race splits for race day
 */

import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ChevronDown, ChevronUp, Printer, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";

import {
  type SplitInputs,
  type SplitResults,
  type SplitStrategy,
  type FormErrors,
  type DistanceUnit,
  PRESET_RACES,
  STRATEGY_INFO,
} from "../types";
import {
  timeToSeconds,
  validateSplitInputs,
  calculateSplits,
} from "../utils";
import { SplitTable } from "./SplitTable";

const initialFormState: SplitInputs = {
  distance: "",
  units: "km",
  hours: "",
  minutes: "",
  seconds: "",
  strategy: "even",
};

export function SplitCalculator() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Form state
  const [inputs, setInputs] = useState<SplitInputs>(initialFormState);
  const [results, setResults] = useState<SplitResults | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // UI state
  const [showInfo, setShowInfo] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Track page view once on mount
  useEffect(() => {
    ReactGA.event({
      category: "Split Calculator",
      action: "Page View",
      label: "User opened the Split Calculator",
    });
  }, []);

  const handleInputChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;

    if (["hours", "minutes", "seconds"].includes(name)) {
      const numValue = value.replace(/\D/g, "");
      setInputs((prev) => ({ ...prev, [name]: numValue.slice(0, 2) }));
      return;
    }

    setInputs((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePreset = (distanceKm: number, distanceMi: number) => {
    const distance = inputs.units === "km" ? distanceKm : distanceMi;
    setInputs((prev) => ({ ...prev, distance: distance.toString() }));
    setErrors({});
  };

  const handleUnitToggle = (unit: DistanceUnit) => {
    setInputs((prev) => ({ ...prev, units: unit }));
    setResults(null);
  };

  const handleStrategyChange = (strategy: SplitStrategy) => {
    setInputs((prev) => ({ ...prev, strategy }));
    if (results) {
      // Recalculate with new strategy
      const totalSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
      const dist = parseFloat(inputs.distance);
      setResults(calculateSplits(totalSeconds, dist, inputs.units, strategy));
    }
  };

  const handleCalculate = () => {
    const { isValid, errors: validationErrors } = validateSplitInputs(
      inputs.distance,
      inputs.hours,
      inputs.minutes,
      inputs.seconds
    );

    if (!isValid) {
      setErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    const totalSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
    const dist = parseFloat(inputs.distance);
    const splitResults = calculateSplits(totalSeconds, dist, inputs.units, inputs.strategy);

    setResults(splitResults);

    toast({
      title: "Splits Calculated! 🏁",
      description: `${splitResults.splits.length} splits generated.`,
      duration: 3000,
    });

    ReactGA.event({
      category: "Split Calculator",
      action: "Calculated Splits",
      label: `${inputs.distance}${inputs.units} - ${inputs.strategy}`,
    });
  };

  const handleEdit = () => {
    setResults(null);
  };

  const handleCopy = async () => {
    if (!results) return;

    const header = `Race Splits: ${results.distance} ${results.units} in ${results.totalTime} (${STRATEGY_INFO[results.strategy].label})\n`;
    const divider = "-".repeat(55) + "\n";
    let text = header + divider;

    results.splits.forEach((row) => {
      text += `${row.distanceLabel.padEnd(12)} ${row.splitTime.padStart(8)}   ${row.splitPace.padStart(10)}   ${row.cumulativeTime.padStart(10)}\n`;
    });

    text += divider;
    text += `Average Pace: ${results.averagePace}\n`;

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard! 📋" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Please allow popups to print", variant: "destructive" });
      return;
    }

    const strategyLabel = STRATEGY_INFO[results!.strategy].label;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pace Band - ${results!.distance} ${results!.units}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
            .meta { text-align: center; color: #666; font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #f3f4f6; padding: 6px 8px; text-align: left; border-bottom: 2px solid #d1d5db; font-size: 11px; }
            td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
            .mono { font-family: 'Courier New', monospace; }
            .right { text-align: right; }
            .partial { background: #fef9c3; }
            .footer { text-align: center; font-size: 10px; color: #999; margin-top: 12px; }
            @media print { body { padding: 8px; } }
          </style>
        </head>
        <body>
          <h1>🏁 Pace Band</h1>
          <div class="meta">${results!.distance} ${results!.units} · Goal: ${results!.totalTime} · ${strategyLabel}</div>
          <table>
            <thead>
              <tr><th>Split</th><th class="right">Time</th><th class="right">Pace</th><th class="right">Elapsed</th></tr>
            </thead>
            <tbody>
              ${results!.splits
                .map(
                  (row) =>
                    `<tr class="${row.isPartial ? "partial" : ""}">
                      <td>${row.distanceLabel}</td>
                      <td class="mono right">${row.splitTime}</td>
                      <td class="mono right">${row.splitPace}</td>
                      <td class="mono right"><strong>${row.cumulativeTime}</strong></td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">Avg Pace: ${results!.averagePace} · trainpace.com</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Helmet>
        <title>Race Split Calculator – Pace Band Generator | TrainPace</title>
        <meta
          name="description"
          content="Free race split calculator. Enter your goal time to get per-mile or per-km splits with even, negative, or positive pacing strategies. Print a pace band for race day."
        />
        <link rel="canonical" href="https://trainpace.com/splits" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              🏁 Race Splits
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
                <h3 className="text-xl font-semibold mb-3">How It Works 🏁</h3>
                <p className="text-gray-700 mb-2">
                  Enter your goal time and race distance to get split-by-split
                  target times you can follow on race day.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Choose even, negative, or positive split strategies</li>
                  <li>See per-mile or per-km splits with elapsed time</li>
                  <li>Print a compact pace band for your wrist</li>
                  <li>Copy splits to share with your running group</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            {!results ? (
              /* Form */
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Distance Presets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Race Distance
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PRESET_RACES.map((race) => (
                        <button
                          key={race.name}
                          onClick={() =>
                            handlePreset(race.distanceKm, race.distanceMi)
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            inputs.distance ===
                            (inputs.units === "km"
                              ? race.distanceKm
                              : race.distanceMi
                            ).toString()
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {race.name}
                        </button>
                      ))}
                    </div>

                    {/* Custom Distance + Unit Toggle */}
                    <div className="flex gap-3 items-center">
                      <input
                        type="number"
                        name="distance"
                        value={inputs.distance}
                        onChange={handleInputChange}
                        placeholder="Custom distance"
                        step="0.1"
                        min="0"
                        className={`flex-1 px-4 py-3 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.distance ? "border-red-400" : "border-gray-300"
                        }`}
                      />
                      <div className="flex bg-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => handleUnitToggle("km")}
                          className={`px-4 py-3 text-sm font-medium transition-all ${
                            inputs.units === "km"
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          km
                        </button>
                        <button
                          onClick={() => handleUnitToggle("miles")}
                          className={`px-4 py-3 text-sm font-medium transition-all ${
                            inputs.units === "miles"
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          mi
                        </button>
                      </div>
                    </div>
                    {errors.distance && (
                      <p className="text-red-500 text-sm mt-1">{errors.distance}</p>
                    )}
                  </div>

                  {/* Goal Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Finish Time
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          name="hours"
                          value={inputs.hours}
                          onChange={handleInputChange}
                          placeholder="H"
                          maxLength={2}
                          inputMode="numeric"
                          className={`w-full px-4 py-3 border rounded-xl text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.time ? "border-red-400" : "border-gray-300"
                          }`}
                        />
                        <span className="block text-xs text-gray-400 text-center mt-1">
                          hrs
                        </span>
                      </div>
                      <span className="text-2xl text-gray-400 font-bold">:</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          name="minutes"
                          value={inputs.minutes}
                          onChange={handleInputChange}
                          placeholder="MM"
                          maxLength={2}
                          inputMode="numeric"
                          className={`w-full px-4 py-3 border rounded-xl text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.time ? "border-red-400" : "border-gray-300"
                          }`}
                        />
                        <span className="block text-xs text-gray-400 text-center mt-1">
                          min
                        </span>
                      </div>
                      <span className="text-2xl text-gray-400 font-bold">:</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          name="seconds"
                          value={inputs.seconds}
                          onChange={handleInputChange}
                          placeholder="SS"
                          maxLength={2}
                          inputMode="numeric"
                          className={`w-full px-4 py-3 border rounded-xl text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.time ? "border-red-400" : "border-gray-300"
                          }`}
                        />
                        <span className="block text-xs text-gray-400 text-center mt-1">
                          sec
                        </span>
                      </div>
                    </div>
                    {errors.time && (
                      <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                    )}
                  </div>

                  {/* Pacing Strategy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pacing Strategy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(
                        Object.entries(STRATEGY_INFO) as [
                          SplitStrategy,
                          (typeof STRATEGY_INFO)[SplitStrategy],
                        ][]
                      ).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() =>
                            handleStrategyChange(key)
                          }
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            inputs.strategy === key
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-semibold text-gray-900 text-sm">
                            {info.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {info.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculate Button */}
                  <button
                    onClick={handleCalculate}
                    className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Calculate Splits
                  </button>
                </CardContent>
              </Card>
            ) : (
              /* Results */
              <div ref={printRef} className="space-y-6">
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Your Race Splits
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Copy className="h-4 w-4" /> Copy
                        </button>
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Printer className="h-4 w-4" /> Pace Band
                        </button>
                      </div>
                    </div>

                    <SplitTable results={results} />

                    {/* Strategy Switcher */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Try a different strategy:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {(
                          Object.entries(STRATEGY_INFO) as [
                            SplitStrategy,
                            (typeof STRATEGY_INFO)[SplitStrategy],
                          ][]
                        ).map(([key, info]) => (
                          <button
                            key={key}
                            onClick={() => handleStrategyChange(key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              results.strategy === key
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {info.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <button
                    onClick={handleEdit}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ← Change Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Race Day Tips */}
          <div className="mt-12 max-w-4xl mx-auto">
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <span className="text-lg font-semibold text-gray-900">
                Race Day Pacing Tips
              </span>
              {showTips ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showTips && (
              <Card className="mt-2 bg-gray-50">
                <CardContent className="p-6 text-gray-700 space-y-3 text-left">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Start conservative:</strong> The first mile always
                      feels easy — trust your splits, not your adrenaline.
                    </li>
                    <li>
                      <strong>Check at every mile marker:</strong> Glance at your
                      elapsed time and compare to your pace band.
                    </li>
                    <li>
                      <strong>Don't chase lost time:</strong> If you're 15 seconds
                      behind, spread the recovery over the next 3–4 splits.
                    </li>
                    <li>
                      <strong>Hills change everything:</strong> Expect to lose 10–15
                      seconds on uphills and gain it back on downhills.
                    </li>
                    <li>
                      <strong>The last 10K is a new race:</strong> In a marathon,
                      miles 20–26 are where pacing discipline pays off.
                    </li>
                    <li>
                      <strong>Print your pace band:</strong> Tape it to your wrist
                      or safety-pin it to your bib. Don't rely on your watch alone.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
