/**
 * Pace Calculator V2 - Main Orchestrator
 * Modern UI similar to fuel planner
 */

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePendingPacePlan } from "@/hooks/usePendingPacePlan";
import ReactGA from "react-ga4";

import type { PaceInputs, PaceResults, FormErrors, PaceUnit } from "../types";
import { usePaceCalculation } from "../hooks/usePaceCalculation";
import { usePacePlanPersistence } from "../hooks/usePacePlanPersistence";
import { RaceDetailsForm } from "./RaceDetailsForm";
import { PaceResultsDisplay } from "./PaceResultsDisplay";
import { SavePlanDialog } from "./SavePlanDialog";

const initialFormState: PaceInputs = {
  distance: "",
  units: "km",
  hours: "",
  minutes: "",
  seconds: "",
  paceType: "km",
  age: "",
  elevation: "flat",
  temperature: "",
};

export function PaceCalculatorV2() {
  // Handle auto-save of pending plan after signup
  usePendingPacePlan();

  // Form state
  const [inputs, setInputs] = useState<PaceInputs>(initialFormState);
  const [results, setResults] = useState<PaceResults | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // UI state
  const [showInfo, setShowInfo] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Calculate paces using hook
  const calculation = usePaceCalculation(inputs);

  // Persistence hook for saving plans
  const { isSaving, isSaved, saveToDashboard, resetSaveState } =
    usePacePlanPersistence();

  // Auto-update results when pace type changes
  useEffect(() => {
    if (results && calculation.isValid && calculation.result) {
      setResults(calculation.result);
    }
  }, [inputs.paceType, calculation.isValid, calculation.result, results]);

  // Track page view
  ReactGA.event({
    category: "Pace Calculator",
    action: "Page View",
    label: "User opened the Pace Calculator",
  });

  // Handlers
  const handleInputChange = (e: {
    target: { name: string; value: string };
  }) => {
    const { name, value } = e.target;

    // Time input validation
    if (["hours", "minutes", "seconds"].includes(name)) {
      const numValue = value.replace(/\D/g, "");
      setInputs((prev) => ({
        ...prev,
        [name]: numValue.slice(0, 2),
      }));
      return;
    }

    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePreset = (distance: number) => {
    setInputs((prev) => ({
      ...prev,
      distance: distance.toString(),
    }));
    setErrors({});
  };

  const handleCalculate = () => {
    if (!calculation.isValid) {
      setErrors(calculation.errors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      if (calculation.result) {
        setResults(calculation.result);
        toast({
          title: "Calculation Complete! ✨",
          description: "Your training paces have been calculated.",
          duration: 3000,
        });

        ReactGA.event({
          category: "Pace Calculator",
          action: "Calculated Paces",
          label: `${inputs.distance}${inputs.units}`,
        });
      }
    } catch (_error) {
      toast({
        title: "Calculation Error",
        description: "An error occurred while calculating paces.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleEdit = () => {
    setResults(null);
    resetSaveState();
  };

  const handlePaceTypeChange = (newPaceType: PaceUnit) => {
    // Update the input state
    setInputs((prev) => ({
      ...prev,
      paceType: newPaceType,
    }));

    ReactGA.event({
      category: "Pace Calculator",
      action: "Changed Pace Type",
      label: newPaceType,
    });
  };

  const handleCopy = async () => {
    if (!results) return;

    const raceInfo = `${inputs.distance}${inputs.units} in ${inputs.hours}:${inputs.minutes}:${inputs.seconds}`;
    let text = `Training Paces for ${raceInfo}\n\n`;

    Object.entries(results).forEach(([key, value]) => {
      const displayName = key === "xlong" ? "Long Run" : key;
      text += `${
        displayName.charAt(0).toUpperCase() + displayName.slice(1)
      }: ${value}\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard! 📋" });

      ReactGA.event({
        category: "Pace Calculator",
        action: "Copied Plan",
      });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!results) return;

    const raceInfo = `${inputs.distance}${inputs.units} in ${inputs.hours}:${inputs.minutes}:${inputs.seconds}`;
    let text = `Training Paces for ${raceInfo}\n\n`;

    Object.entries(results).forEach(([key, value]) => {
      const displayName = key === "xlong" ? "Long Run" : key;
      text += `${
        displayName.charAt(0).toUpperCase() + displayName.slice(1)
      }: ${value}\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-paces-${inputs.distance}${inputs.units}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Download started! 💾" });

    ReactGA.event({
      category: "Pace Calculator",
      action: "Downloaded Plan",
    });
  };

  const handleSave = async () => {
    if (!results) return;
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async (
    planName?: string,
    notes?: string,
    raceDate?: string
  ) => {
    if (!results) return;

    await saveToDashboard({
      inputs,
      results,
      planName,
      notes,
      raceDate,
    });

    setShowSaveDialog(false);
  };

  const getRaceTime = () => {
    const parts = [];
    if (inputs.hours) parts.push(`${inputs.hours}h`);
    if (inputs.minutes) parts.push(`${inputs.minutes}m`);
    if (inputs.seconds) parts.push(`${inputs.seconds}s`);
    return parts.join(" ");
  };

  return (
    <>
      <Helmet>
        <title>Pace Calculator By TrainPace</title>
        <meta
          name="description"
          content="Optimize your running performance with our pace calculator. Get personalized training paces based on your race time and distance."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              ⏱️ Pace Calculator
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
                <h3 className="text-xl font-semibold mb-3">How It Works ⚡</h3>
                <p className="text-gray-700 mb-2">
                  Enter your recent race time and distance, and we'll calculate
                  your optimal training paces for different workout types.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Easy runs for recovery and endurance</li>
                  <li>Tempo runs for lactate threshold</li>
                  <li>Intervals for VO2 max improvement</li>
                  <li>Long runs for building stamina</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Race Details OR Results */}
            {!results ? (
              <RaceDetailsForm
                inputs={inputs}
                errors={errors}
                onInputChange={handleInputChange}
                onPresetClick={handlePreset}
                onCalculate={handleCalculate}
                isCalculating={isCalculating}
              />
            ) : (
              <PaceResultsDisplay
                results={results}
                raceDistance={`${inputs.distance} ${inputs.units}`}
                raceTime={getRaceTime()}
                paceType={inputs.paceType}
                onEdit={handleEdit}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onPaceTypeChange={handlePaceTypeChange}
                onSave={handleSave}
                isSaving={isSaving}
                isSaved={isSaved}
              />
            )}
          </div>

          {/* Training Philosophy */}
          <div className="mt-12 max-w-4xl mx-auto">
            <button
              onClick={() => setShowPhilosophy(!showPhilosophy)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <span className="text-lg font-semibold text-gray-900">
                Training Philosophy
              </span>
              {showPhilosophy ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showPhilosophy && (
              <Card className="mt-2 bg-gray-50">
                <CardContent className="p-6 text-gray-700 space-y-3 text-left">
                  <p>
                    Training paces are calculated based on your current race
                    performance and established training principles.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Easy Runs:</strong> 20-30% slower than race pace
                      for recovery and aerobic base building
                    </li>
                    <li>
                      <strong>Long Runs:</strong> Similar to easy pace but
                      sustained for longer duration
                    </li>
                    <li>
                      <strong>Tempo Runs:</strong> Comfortably hard pace, around
                      5-10% of race pace
                    </li>
                    <li>
                      <strong>Intervals:</strong> High-intensity efforts around
                      race pace or slightly faster
                    </li>
                    <li>
                      <strong>Speed Work:</strong> Near-maximal efforts for
                      developing top-end speed
                    </li>
                    <li>
                      <strong>Yasso 800s:</strong> Marathon-specific workout
                      matching your goal marathon time
                    </li>
                  </ul>
                  <p className="text-sm italic">
                    Remember: These are guidelines. Adjust based on how you
                    feel, weather conditions, and terrain.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Save Plan Dialog */}
        <SavePlanDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveConfirm}
          isSaving={isSaving}
          raceDistance={`${inputs.distance} ${inputs.units}`}
          raceTime={getRaceTime()}
        />
      </div>
    </>
  );
}
