/**
 * Fuel Planner V2 - Main Orchestrator
 * Thin component that composes the feature together
 */

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePendingFuelPlan } from "@/hooks/usePendingFuelPlan";
import ReactGA from "react-ga4";
import { type FuelPlanContext } from "@/services/gemini";

// Feature imports
import { type RaceType, type FuelPlanResult } from "../types";
import {
  useFuelCalculation,
  getFinishTimeInMinutes,
} from "../hooks/useFuelCalculation";
import { useAIRecommendations } from "../hooks/useAIRecommendations";
import { useFuelPlanPersistence } from "../hooks/useFuelPlanPersistence";
import { RaceDetailsForm } from "./RaceDetailsForm";
import { FuelPlanResults } from "./FuelPlanResults";
import { AIPersonalization } from "./AIPersonalization";

export function FuelPlannerV2() {
  const { toast } = useToast();

  // Handle auto-save of pending plan after signup
  usePendingFuelPlan();

  // Track page view
  ReactGA.event({
    category: "Fuel Planner",
    action: "Page View",
    label: "User opened the Fuel Planner V2",
  });

  // Form state
  const [raceType, setRaceType] = useState<RaceType>("10K");
  const [weight, setWeight] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [result, setResult] = useState<FuelPlanResult | null>(null);

  // UI state
  const [showInfo, setShowInfo] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Hooks
  const { result: calculationResult, error: calculationError } =
    useFuelCalculation({
      raceType,
      weight,
      timeHours,
      timeMinutes,
    });

  const planContext: FuelPlanContext | null = result
    ? {
        raceType,
        weight: weight ? parseFloat(weight) : undefined,
        time: getFinishTimeInMinutes(raceType, timeHours, timeMinutes),
        carbsPerHour: result.carbsPerHour,
        totalCarbs: result.totalCarbs,
        totalCalories: result.totalCalories,
        gelsNeeded: result.gelsNeeded,
      }
    : null;

  const {
    recommendations,
    isRefining,
    cooldownSeconds,
    refineWithAI,
    resetRecommendations,
  } = useAIRecommendations({ raceType, planContext });

  const { isSaving, isSaved, saveToDashboard, resetSaveState } =
    useFuelPlanPersistence();

  // Handlers
  const handleCalculate = () => {
    if (calculationError) {
      toast({
        title: "Invalid input",
        description: calculationError,
        variant: "destructive",
      });
      return;
    }

    if (calculationResult) {
      setResult(calculationResult);

      ReactGA.event({
        category: "Fuel Planner",
        action: "Calculated Fuel Plan",
        label: raceType,
        value: getFinishTimeInMinutes(raceType, timeHours, timeMinutes),
      });
    }
  };

  const handleEdit = () => {
    setResult(null);
    resetRecommendations();
    setTimeHours("");
    setTimeMinutes("");
    resetSaveState();
    setFeedbackGiven(false);
  };

  const handleCopy = async () => {
    if (!result) return;

    let text = `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`;

    if (recommendations.length > 0) {
      text += `\n\n--- AI Recommendations ---\n`;
      recommendations.forEach((rec, idx) => {
        text += `\n${idx + 1}. ${rec.headline}`;
        if (rec.detail) {
          text += `\n   ${rec.detail}`;
        }
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });

      ReactGA.event({
        category: "Fuel Planner",
        action: "Copied Plan",
        label: raceType,
      });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!result) return;

    let text = `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`;

    if (recommendations.length > 0) {
      text += `\n\n--- AI Recommendations ---\n`;
      recommendations.forEach((rec, idx) => {
        text += `\n${idx + 1}. ${rec.headline}`;
        if (rec.detail) {
          text += `\n   ${rec.detail}`;
        }
      });
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-plan-${raceType.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Download started!" });

    ReactGA.event({
      category: "Fuel Planner",
      action: "Downloaded Plan",
      label: raceType,
    });
  };

  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(true);

    ReactGA.event({
      category: "Fuel Planner",
      action: helpful ? "AI Feedback - Helpful" : "AI Feedback - Not Helpful",
      label: raceType,
      value: recommendations.length,
    });

    toast({
      title: helpful
        ? "Thanks for the feedback! 🙌"
        : "Thanks! We'll work on improving.",
      description: helpful
        ? "Glad the AI recommendations helped!"
        : "Your feedback helps us make better recommendations.",
    });
  };

  const handleSave = async () => {
    if (!result) return;

    await saveToDashboard({
      raceType,
      weight,
      timeHours,
      timeMinutes,
      finishTimeMin: getFinishTimeInMinutes(raceType, timeHours, timeMinutes),
      result,
      userContext: "", // Context is managed inside AIPersonalization
      selectedPresets: [],
      recommendations,
    });
  };

  const handleResetAI = () => {
    resetRecommendations();
    resetSaveState();
    setFeedbackGiven(false);
  };

  return (
    <>
      <Helmet>
        <title>Fuel Planner by TrainPace</title>
        <meta
          name="description"
          content="Optimize your running fuel strategy with AI-powered personalized recommendations."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              🏃 Fuel Planner
            </h1>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
            >
              <Info className="h-6 w-6 text-blue-600" />
            </button>
          </div>

          {showInfo && (
            <Card className="mb-8 bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">
                  Why Fueling Matters ⚡
                </h3>
                <p className="text-gray-700 mb-2">
                  Your body needs carbs to perform. This tool estimates how many
                  carbs and gels you'll need.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>30–60g carbs/hr for efforts over 1 hour</li>
                  <li>Gels usually contain ~25g carbs each</li>
                  <li>Proper fueling avoids energy crashes</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Race Details OR Results */}
            {!result ? (
              <RaceDetailsForm
                raceType={raceType}
                setRaceType={setRaceType}
                weight={weight}
                setWeight={setWeight}
                timeHours={timeHours}
                setTimeHours={setTimeHours}
                timeMinutes={timeMinutes}
                setTimeMinutes={setTimeMinutes}
                onCalculate={handleCalculate}
              />
            ) : (
              <FuelPlanResults
                result={result}
                raceType={raceType}
                aiRecommendations={recommendations}
                onEdit={handleEdit}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
            )}

            {/* AI Personalization (only after plan is calculated) */}
            {result && planContext && (
              <AIPersonalization
                raceType={raceType}
                planContext={planContext}
                recommendations={recommendations}
                isRefining={isRefining}
                cooldownSeconds={cooldownSeconds}
                onRefine={refineWithAI}
                onReset={handleResetAI}
                onFeedback={handleFeedback}
                feedbackGiven={feedbackGiven}
                onSave={handleSave}
                isSaving={isSaving}
                isSaved={isSaved}
              />
            )}
          </div>

          {/* Fueling Philosophy */}
          <div className="mt-12 max-w-4xl mx-auto">
            <button
              onClick={() => setShowPhilosophy(!showPhilosophy)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <span className="text-lg font-semibold text-gray-900">
                Fueling Philosophy
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
                    Fuel needs depend on race distance, duration, and personal
                    tolerance.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>10K races:</strong> Most runners can complete
                      without fueling. For races over ~45 min, 1 gel may help,
                      but fueling is optional.
                    </li>
                    <li>
                      <strong>Half & Full Marathons:</strong> We suggest up to
                      1.5 gels per hour, with a maximum of 7 gels total.
                    </li>
                  </ul>
                  <p>
                    This approach balances energy needs without overloading
                    digestion — based on real-world marathon fueling strategies.
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
