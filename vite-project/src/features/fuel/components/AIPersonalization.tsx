/**
 * AI Personalization Component
 * Handles AI context input, presets, and refinement
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, FileText, CheckCircle, Download } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ContextPresetButton } from "./ContextPresetButton";
import { AIRecommendationCard } from "./AIRecommendationCard";
import { FUEL_CONTEXT_PRESETS, type AIRecommendation, type RaceType } from "../types";
import { getFuelPlanPrompt, type FuelPlanContext } from "@/services/gemini";
import { useToast } from "@/hooks/use-toast";

interface AIPersonalizationProps {
  raceType: RaceType;
  planContext: FuelPlanContext;
  recommendations: AIRecommendation[];
  isRefining: boolean;
  cooldownSeconds: number;
  onRefine: (userContext: string) => Promise<void>;
  onReset: () => void;
  onFeedback: (helpful: boolean) => void;
  feedbackGiven: boolean;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export function AIPersonalization({
  raceType,
  planContext,
  recommendations,
  isRefining,
  cooldownSeconds,
  onRefine,
  onReset,
  onFeedback,
  feedbackGiven,
  onSave,
  isSaving,
  isSaved,
}: AIPersonalizationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userContext, setUserContext] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showAsList, setShowAsList] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handlePresetToggle = (presetId: string) => {
    const newSet = new Set(selectedPresets);
    if (newSet.has(presetId)) {
      newSet.delete(presetId);
    } else {
      newSet.add(presetId);
    }
    setSelectedPresets(newSet);

    // Combine all selected preset values
    const combined = Array.from(newSet)
      .map((id) => FUEL_CONTEXT_PRESETS.find((p) => p.id === id)?.value)
      .filter(Boolean)
      .join(" ");
    setUserContext(combined);
  };

  const handleRefine = async () => {
    await onRefine(userContext);
    setCurrentSlide(0);
  };

  const handleReset = () => {
    onReset();
    setUserContext("");
    setSelectedPresets(new Set());
    setCurrentSlide(0);
    setShowAsList(false);
  };

  const handleCopyAI = async () => {
    let text = `AI Fuel Recommendations for ${raceType}\n\n`;
    recommendations.forEach((rec, idx) => {
      text += `${idx + 1}. ${rec.headline}\n`;
      if (rec.detail) {
        text += `   ${rec.detail}\n`;
      }
      text += `\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "AI recommendations copied!" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleDownloadAI = () => {
    let text = `AI Fuel Recommendations for ${raceType}\n\n`;
    recommendations.forEach((rec, idx) => {
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
  };

  return (
    <>
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
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Using Google Gemini (Free):</strong> We use Google's free
              AI to personalize your plan. Google may use your input to improve
              their models, so avoid sharing medical info or personal details.
              Just focus on race-day scenarios like weather, gut tolerance, and
              past experiences!
            </p>
          </div>

          {recommendations.length === 0 ? (
            <>
              {/* Preset Buttons */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Quick select common scenarios:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {FUEL_CONTEXT_PRESETS.map((preset) => (
                    <ContextPresetButton
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresets.has(preset.id)}
                      onToggle={() => handlePresetToggle(preset.id)}
                    />
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
                    {selectedPresets.size > 1 ? "s" : ""} selected. Feel free to
                    edit!
                  </span>
                ) : (
                  "Select multiple scenarios or write your own."
                )}
              </p>

              <button
                onClick={handleRefine}
                disabled={isRefining || !userContext.trim() || cooldownSeconds > 0}
                className="w-full py-3 text-base font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : cooldownSeconds > 0 ? (
                  <span>Wait {cooldownSeconds}s</span>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Get Personalized Advice
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <AIRecommendationCard
                recommendations={recommendations}
                currentSlide={currentSlide}
                showAsList={showAsList}
                onToggleView={() => setShowAsList(!showAsList)}
                onPrevSlide={() =>
                  setCurrentSlide(
                    (currentSlide - 1 + recommendations.length) %
                      recommendations.length
                  )
                }
                onNextSlide={() =>
                  setCurrentSlide((currentSlide + 1) % recommendations.length)
                }
                onCopy={handleCopyAI}
                onDownload={handleDownloadAI}
              />

              {/* Save to Dashboard Section */}
              <div className="mt-6 pt-4 border-t border-white/20">
                {user ? (
                  <button
                    onClick={onSave}
                    disabled={isSaving || isSaved}
                    className="w-full py-3 text-base font-semibold bg-white text-purple-600 rounded-xl hover:bg-white/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : isSaved ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Saved to Dashboard
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Save to Dashboard
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-700 mb-3">
                      💾 Want to save this plan to your dashboard?
                    </p>
                    <button
                      onClick={onSave}
                      className="w-full py-3 text-base font-semibold bg-white text-purple-600 rounded-xl hover:bg-white/90 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                      Sign Up to Save (Free)
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback Section */}
              {!feedbackGiven ? (
                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-sm text-center text-gray-700 mb-3">
                    Were these recommendations helpful?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => onFeedback(true)}
                      className="flex-1 py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <span className="text-lg">👍</span>
                      Helpful
                    </button>
                    <button
                      onClick={() => onFeedback(false)}
                      className="flex-1 py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <span className="text-lg">👎</span>
                      Not helpful
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-4 border-t border-white/20 text-center">
                  <p className="text-sm text-gray-700">
                    ✨ Thanks for your feedback!
                  </p>
                </div>
              )}

              <button
                onClick={handleReset}
                disabled={cooldownSeconds > 0}
                className="mt-6 w-full py-3 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                {cooldownSeconds > 0
                  ? `Wait ${cooldownSeconds}s to refine`
                  : "Refine Again"}
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {/* System Prompt Modal */}
      {showPromptModal && (
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
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap text-gray-800">
                  {getFuelPlanPrompt(
                    planContext,
                    userContext || "[Your situation will be inserted here]"
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
