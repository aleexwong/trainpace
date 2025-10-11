import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Info,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileText,
  List,
  Layers,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";
import {
  refineFuelPlan,
  getFuelPlanPrompt,
  type FuelPlanContext,
} from "@/services/gemini";

const raceSettings = {
  "10K": 30,
  Half: 45,
  Full: 75,
};

const FUEL_CONTEXT_PRESETS = [
  {
    id: "bonking-late",
    icon: "😰",
    label: "Bonking late",
    value:
      "I typically bonk around the 30-32km mark with sudden energy crashes.",
  },
  {
    id: "gi-issues",
    icon: "🤢",
    label: "GI issues",
    value: "I experience nausea and stomach cramps when I take gels.",
  },
  {
    id: "hot-weather",
    icon: "🌡️",
    label: "Hot weather",
    value:
      "I'm racing in hot conditions (26°C/80°F+) and tend to sweat heavily.",
  },
  {
    id: "first-timer",
    icon: "🎯",
    label: "First timer",
    value:
      "This is my first time racing this distance and I need a beginner-friendly fueling approach.",
  },
  {
    id: "real-food",
    icon: "🍌",
    label: "Prefer real food",
    value: "I prefer real food like bananas or energy bars instead of gels.",
  },
  {
    id: "no-appetite",
    icon: "😐",
    label: "No appetite",
    value: "I lose my appetite during runs and struggle to force food down.",
  },
  {
    id: "caffeine",
    icon: "☕",
    label: "Caffeine sensitive",
    value: "Caffeine makes me jittery or causes GI issues.",
  },
  {
    id: "fasted",
    icon: "⏰",
    label: "Train fasted",
    value:
      "I usually train fasted and need help transitioning to race-day fueling.",
  },
];

const FuelPlannerV2 = () => {
  ReactGA.event({
    category: "Fuel Planner",
    action: "Page View",
    label: "User opened the Fuel Planner V2",
  });

  const [raceType, setRaceType] = useState<keyof typeof raceSettings>("10K");
  const [weight, setWeight] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [userContext, setUserContext] = useState("");
  const [result, setResult] = useState<null | {
    carbsPerHour: number;
    totalCarbs: number;
    totalCalories: number;
    gelsNeeded: number;
  }>(null);
  const [aiAdvice, setAiAdvice] = useState<
    Array<{ headline: string; detail: string }>
  >([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(
    new Set()
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showAsList, setShowAsList] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const parseExpandableRecommendations = (
    text: string
  ): Array<{ headline: string; detail: string }> => {
    const recommendations: Array<{ headline: string; detail: string }> = [];

    // Try structured format first (HEADLINE/DETAIL)
    const blocks = text.split(/HEADLINE:/i).filter((b) => b.trim());

    if (blocks.length > 0 && text.includes("DETAIL")) {
      for (const block of blocks) {
        const parts = block.split(/DETAIL:/i);
        if (parts.length === 2) {
          recommendations.push({
            headline: parts[0].trim(),
            detail: parts[1].trim(),
          });
        }
      }
      return recommendations;
    }

    // Fallback: split paragraphs into headline + detail
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    for (const para of paragraphs) {
      const sentences = para.split(/\. /);
      if (sentences.length >= 2) {
        recommendations.push({
          headline: sentences[0] + ".",
          detail: sentences.slice(1).join(". "),
        });
      } else {
        recommendations.push({
          headline: para,
          detail: "",
        });
      }
    }

    return recommendations;
  };

  const handleCalculate = () => {
    const weightKg = parseFloat(weight);

    // Calculate total minutes based on race type
    let finishTimeMin: number;
    if (raceType === "10K") {
      finishTimeMin = parseFloat(timeMinutes);
    } else {
      const hours = parseFloat(timeHours) || 0;
      const mins = parseFloat(timeMinutes) || 0;
      finishTimeMin = hours * 60 + mins;
    }

    if (isNaN(finishTimeMin) || finishTimeMin <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid finish time.",
        variant: "destructive",
      });
      return;
    }

    if (!isNaN(weightKg) && (weightKg < 1 || weightKg > 1000)) {
      toast({
        title: "Invalid weight",
        description: "Weight must be between 1kg and 1000kg.",
        variant: "destructive",
      });
      return;
    }

    let carbsPerHour = raceSettings[raceType];
    if (!isNaN(weightKg) && weightKg > 0) {
      carbsPerHour = Math.round(weightKg * 0.7);
    }

    const durationHours = finishTimeMin / 60;
    const totalCarbs = Math.round(durationHours * carbsPerHour);
    const totalCalories = totalCarbs * 4;

    let gelsNeeded = 0;
    if (raceType === "10K") {
      gelsNeeded = durationHours >= 0.75 ? 1 : 0;
    } else {
      const gelsPerHour = 1.5;
      gelsNeeded = Math.ceil(durationHours * gelsPerHour);
      gelsNeeded = Math.min(gelsNeeded, 7);
    }

    setResult({ carbsPerHour, totalCarbs, totalCalories, gelsNeeded });

    ReactGA.event({
      category: "Fuel Planner",
      action: "Calculated Fuel Plan",
      label: raceType,
      value: finishTimeMin, // Track the time in minutes
    });
  };

  const handleRefineWithAI = async () => {
    if (!result) return;

    setIsRefining(true);

    // Recalculate finish time from inputs
    let finishTimeMin: number;
    if (raceType === "10K") {
      finishTimeMin = parseFloat(timeMinutes);
    } else {
      const hours = parseFloat(timeHours) || 0;
      const mins = parseFloat(timeMinutes) || 0;
      finishTimeMin = hours * 60 + mins;
    }

    const planContext: FuelPlanContext = {
      raceType,
      weight: weight ? parseFloat(weight) : undefined,
      time: finishTimeMin,
      carbsPerHour: result.carbsPerHour,
      totalCarbs: result.totalCarbs,
      totalCalories: result.totalCalories,
      gelsNeeded: result.gelsNeeded,
    };

    try {
      const response = await refineFuelPlan(planContext, userContext);

      if (response.success && response.refinedAdvice) {
        const recommendations = parseExpandableRecommendations(
          response.refinedAdvice
        );

        if (recommendations.length > 0) {
          setAiAdvice(recommendations);
          setCurrentSlide(0);
          setCooldownSeconds(30); // Start 30 second cooldown
          toast({ title: "✨ AI recommendations generated!" });

          ReactGA.event({
            category: "Fuel Planner",
            action: "AI Refinement Success",
            label: raceType,
          });
        } else {
          setAiAdvice([{ headline: response.refinedAdvice, detail: "" }]);
          setCurrentSlide(0);
          setCooldownSeconds(30); // Start 30 second cooldown
          toast({ title: "✨ AI recommendations generated!" });
        }
      } else {
        toast({
          title: "Unable to generate recommendations",
          description: response.error || "Please try again later.",
          variant: "destructive",
        });

        ReactGA.event({
          category: "Fuel Planner",
          action: "AI Refinement Failed",
          label: response.error || "Unknown error",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });

      ReactGA.event({
        category: "Fuel Planner",
        action: "AI Refinement Error",
        label: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    let text = `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`;

    if (aiAdvice.length > 0) {
      text += `\n\n--- AI Recommendations ---\n`;
      aiAdvice.forEach((rec, idx) => {
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
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleCopyAI = async () => {
    if (aiAdvice.length === 0) return;

    let text = `AI Fuel Recommendations for ${raceType}\n\n`;
    aiAdvice.forEach((rec, idx) => {
      text += `${idx + 1}. ${rec.headline}\n`;
      if (rec.detail) {
        text += `   ${rec.detail}\n`;
      }
      text += `\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "AI recommendations copied!" });

      ReactGA.event({
        category: "Fuel Planner",
        action: "Copied AI Recommendations",
        label: raceType,
      });
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!result) return;

    let text = `Fuel Plan for ${raceType}\n\nCarbs/hr: ${result.carbsPerHour}g\nTotal Carbs: ${result.totalCarbs}g\nCalories: ${result.totalCalories} kcal\nGels: ${result.gelsNeeded}`;

    if (aiAdvice.length > 0) {
      text += `\n\n--- AI Recommendations ---\n`;
      aiAdvice.forEach((rec, idx) => {
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

  const handleDownloadAI = () => {
    if (aiAdvice.length === 0) return;

    let text = `AI Fuel Recommendations for ${raceType}\n\n`;
    aiAdvice.forEach((rec, idx) => {
      text += `${idx + 1}. ${rec.headline}\n`;
      if (rec.detail) {
        text += `   ${rec.detail}\n`;
      }
      text += `\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-fuel-recommendations-${raceType.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "AI recommendations downloaded!" });

    ReactGA.event({
      category: "Fuel Planner",
      action: "Downloaded AI Recommendations",
      label: raceType,
    });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % aiAdvice.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + aiAdvice.length) % aiAdvice.length);
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

          {/* Vertical Flow: Race Details OR Your Plan (replaces) → AI Personalization */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* 1. Race Details Input OR Your Plan (mutually exclusive) */}
            {!result ? (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Race Details
                  </h2>

                  {/* Race Type - Button Pills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Race Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-3">
                      {(
                        Object.keys(raceSettings) as Array<
                          keyof typeof raceSettings
                        >
                      ).map((type) => (
                        <button
                          key={type}
                          onClick={() => setRaceType(type)}
                          className={`py-4 px-2 text-sm sm:text-base font-semibold rounded-xl transition-all ${
                            raceType === type
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {type === "10K"
                            ? "10K"
                            : type === "Half"
                            ? "Half Marathon"
                            : "Full Marathon"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Finish Time - Conditional based on race type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Finish Time <span className="text-red-500">*</span>
                      </label>
                      {raceType === "10K" ? (
                        <input
                          type="number"
                          placeholder="Minutes (e.g. 45)"
                          value={timeMinutes}
                          onChange={(e) => setTimeMinutes(e.target.value)}
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min={1}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Hours"
                            value={timeHours}
                            onChange={(e) => setTimeHours(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min={0}
                            max={12}
                          />
                          <input
                            type="number"
                            placeholder="Minutes"
                            value={timeMinutes}
                            onChange={(e) => setTimeMinutes(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min={0}
                            max={59}
                          />
                        </div>
                      )}
                    </div>
                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg){" "}
                        <span className="text-gray-400 text-xs">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 68"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={1}
                        max={1000}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCalculate}
                    className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Calculate Fuel Plan
                  </button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Your Plan 🔋
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setResult(null);
                          setAiAdvice([]);
                          setUserContext("");
                          setCurrentSlide(0);
                          setTimeHours("");
                          setTimeMinutes("");
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        ← Edit
                      </button>
                      <button
                        onClick={handleCopy}
                        className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="Copy Plan"
                      >
                        <Copy className="h-5 w-5 text-blue-600" />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="Download Plan"
                      >
                        <Download className="h-5 w-5 text-blue-600" />
                      </button>
                    </div>
                  </div>

                  {/* Grid of metrics - 4 columns on desktop, 2 on mobile */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-6 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-700">
                        {result.carbsPerHour}g
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Carbs/hour
                      </div>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-700">
                        {result.totalCarbs}g
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total carbs
                      </div>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-700">
                        {result.totalCalories}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Calories</div>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-700">
                        {result.gelsNeeded}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.gelsNeeded === 0 ? "Gels (optional)" : "Gels"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 2. AI Personalization (only appears after plan is shown) */}
            {result && (
              <Card className="bg-gradient-to-br from-purple-100 to-blue-100 border-purple-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        AI Personalization
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowPromptModal(true)}
                      className="p-2 rounded-full bg-white hover:bg-purple-200 transition-colors"
                      title="View system prompt"
                    >
                      <FileText className="h-5 w-5 text-purple-600" />
                    </button>
                  </div>

                  {/* Beta Disclaimer */}
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Beta Notice:</strong> This feature uses Google
                      Gemini's free API with rate limits. If it stops working,
                      please wait a few minutes and try again. Data you input
                      may be used for Google's model training don't share
                      sensitive personal information.
                    </p>
                  </div>

                  {aiAdvice.length === 0 ? (
                    <>
                      {/* Preset Buttons */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Quick select common scenarios:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {FUEL_CONTEXT_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                const newSet = new Set(selectedPresets);
                                if (newSet.has(preset.id)) {
                                  newSet.delete(preset.id);
                                } else {
                                  newSet.add(preset.id);
                                }
                                setSelectedPresets(newSet);

                                // Combine all selected preset values into natural sentences
                                const combined = Array.from(newSet)
                                  .map(
                                    (id) =>
                                      FUEL_CONTEXT_PRESETS.find(
                                        (p) => p.id === id
                                      )?.value
                                  )
                                  .filter(Boolean)
                                  .join(" ");
                                setUserContext(combined);
                              }}
                              className={`relative p-3 text-left border-2 rounded-lg transition-all ${
                                selectedPresets.has(preset.id)
                                  ? "bg-purple-100 border-purple-500"
                                  : "bg-white border-purple-200 hover:bg-purple-50"
                              }`}
                            >
                              <div className="text-2xl mb-1">{preset.icon}</div>
                              <div className="text-xs font-medium text-gray-700">
                                {preset.label}
                              </div>
                              {selectedPresets.has(preset.id) && (
                                <CheckCircle className="h-4 w-4 text-purple-600 absolute top-2 right-2" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-purple-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-gradient-to-br from-purple-100 to-blue-100 text-gray-500">
                            or write your own
                          </span>
                        </div>
                      </div>

                      <textarea
                        placeholder="Describe your specific situation..."
                        value={userContext}
                        onChange={(e) => {
                          setUserContext(e.target.value);
                          // Clear presets if user manually edits
                          if (selectedPresets.size > 0) {
                            setSelectedPresets(new Set());
                          }
                        }}
                        className="w-full px-4 py-3 text-base border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[120px] bg-white"
                      />
                      <p className="text-xs text-gray-600 mt-2 mb-4">
                        {selectedPresets.size > 0 ? (
                          <span className="text-purple-600 font-medium">
                            ✓ {selectedPresets.size} scenario
                            {selectedPresets.size > 1 ? "s" : ""} selected. Feel
                            free to edit!
                          </span>
                        ) : (
                          "Select multiple scenarios or write your own."
                        )}
                      </p>

                      <button
                        onClick={handleRefineWithAI}
                        disabled={
                          isRefining ||
                          !userContext.trim() ||
                          cooldownSeconds > 0
                        }
                        className="w-full py-3 text-base font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isRefining ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating...
                          </>
                        ) : cooldownSeconds > 0 ? (
                          <>
                            <span>Wait {cooldownSeconds}s</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            Get Personalized Advice
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    // AI Recommendations Flashcard or List
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

                      <div className="relative z-10">
                        {/* Header with toggle and action buttons */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowAsList(!showAsList)}
                              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              title={
                                showAsList ? "Show as cards" : "Show as list"
                              }
                            >
                              {showAsList ? (
                                <Layers className="h-5 w-5" />
                              ) : (
                                <List className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCopyAI}
                              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              title="Copy recommendations"
                            >
                              <Copy className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleDownloadAI}
                              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                              title="Download recommendations"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {showAsList ? (
                          // List View
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {aiAdvice.map((advice, idx) => (
                              <div
                                key={idx}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold mb-2 text-base">
                                      {advice.headline}
                                    </p>
                                    {advice.detail && (
                                      <p className="text-sm text-white/90 leading-relaxed">
                                        {advice.detail}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Flashcard View
                          <>
                            {/* Flashcard Content */}
                            <div className="min-h-[200px] sm:min-h-[180px] flex flex-col justify-center px-4 sm:px-6">
                              <p className="text-base sm:text-lg font-semibold text-center mb-3">
                                {aiAdvice[currentSlide].headline}
                              </p>

                              {aiAdvice[currentSlide].detail && (
                                <p className="text-sm sm:text-base leading-relaxed text-center text-white/90 mt-2">
                                  {aiAdvice[currentSlide].detail}
                                </p>
                              )}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-6">
                              <button
                                onClick={prevSlide}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-30"
                                disabled={aiAdvice.length <= 1}
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>

                              <div className="flex gap-1.5">
                                {aiAdvice.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                                      idx === currentSlide
                                        ? "bg-white scale-150"
                                        : "bg-white/40"
                                    }`}
                                  />
                                ))}
                              </div>

                              <button
                                onClick={nextSlide}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-30"
                                disabled={aiAdvice.length <= 1}
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </div>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setAiAdvice([]);
                            setUserContext("");
                            setSelectedPresets(new Set());
                            setCurrentSlide(0);
                            setShowAsList(false);
                            // Don't reset cooldown - it continues
                          }}
                          disabled={cooldownSeconds > 0}
                          className="mt-6 w-full py-3 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cooldownSeconds > 0
                            ? `Wait ${cooldownSeconds}s to refine`
                            : "Refine Again"}
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fueling Philosophy - Full Width at Bottom */}
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

      {/* System Prompt Modal */}
      {showPromptModal && result && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPromptModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  AI System Prompt
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const promptText = getFuelPlanPrompt(
                      {
                        raceType,
                        weight: weight ? parseFloat(weight) : undefined,
                        time:
                          raceType === "10K"
                            ? parseFloat(timeMinutes) || 0
                            : (parseFloat(timeHours) || 0) * 60 +
                              (parseFloat(timeMinutes) || 0),
                        carbsPerHour: result.carbsPerHour,
                        totalCarbs: result.totalCarbs,
                        totalCalories: result.totalCalories,
                        gelsNeeded: result.gelsNeeded,
                      },
                      userContext || "[Your situation will be inserted here]"
                    );
                    try {
                      await navigator.clipboard.writeText(promptText);
                      toast({ title: "Prompt copied to clipboard!" });
                    } catch {
                      toast({
                        title: "Failed to copy",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="p-2 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
                  title="Copy prompt"
                >
                  <Copy className="h-5 w-5 text-purple-600" />
                </button>
                <button
                  onClick={() => {
                    const promptText = getFuelPlanPrompt(
                      {
                        raceType,
                        weight: weight ? parseFloat(weight) : undefined,
                        time:
                          raceType === "10K"
                            ? parseFloat(timeMinutes) || 0
                            : (parseFloat(timeHours) || 0) * 60 +
                              (parseFloat(timeMinutes) || 0),
                        carbsPerHour: result.carbsPerHour,
                        totalCarbs: result.totalCarbs,
                        totalCalories: result.totalCalories,
                        gelsNeeded: result.gelsNeeded,
                      },
                      userContext || "[Your situation will be inserted here]"
                    );
                    const blob = new Blob([promptText], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `gemini-prompt-${raceType.toLowerCase()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast({ title: "Prompt downloaded!" });
                  }}
                  className="p-2 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
                  title="Download prompt"
                >
                  <Download className="h-5 w-5 text-purple-600" />
                </button>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-2 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
                >
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-600 mb-4 text-xs font-sans">
                  This is the exact prompt sent to Google Gemini when you click
                  "Get Personalized Advice".
                </p>
                <pre className="whitespace-pre-wrap text-gray-800">
                  {getFuelPlanPrompt(
                    {
                      raceType,
                      weight: weight ? parseFloat(weight) : undefined,
                      time:
                        raceType === "10K"
                          ? parseFloat(timeMinutes) || 0
                          : (parseFloat(timeHours) || 0) * 60 +
                            (parseFloat(timeMinutes) || 0),
                      carbsPerHour: result.carbsPerHour,
                      totalCarbs: result.totalCarbs,
                      totalCalories: result.totalCalories,
                      gelsNeeded: result.gelsNeeded,
                    },
                    userContext || "[Your situation will be inserted here]"
                  )}
                </pre>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This prompt is sent to Google Gemini's
                  API. Variables like race type, time, and your situation are
                  dynamically inserted.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FuelPlannerV2;
