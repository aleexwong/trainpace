import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import { TRAINING_PLANS } from "../index";

type Step = "q1" | "q2" | "result";

const Q1_OPTIONS = [
  { id: "new", label: "I'm new to running", emoji: "🌱" },
  { id: "some", label: "I run occasionally", emoji: "🏃" },
  { id: "regular", label: "I run regularly", emoji: "⚡" },
];

const Q2_OPTIONS = [
  { id: "marathon", label: "Marathon", detail: "26.2 mi · 16 weeks" },
  { id: "half-marathon", label: "Half Marathon", detail: "13.1 mi · 12 weeks" },
  { id: "10k", label: "10K", detail: "10K · 10 weeks" },
  { id: "5k", label: "5K", detail: "5K · 8 weeks" },
];

function getRecommendedId(q1: string, q2?: string): string {
  if (q1 === "new") return "get-fit";
  if (q1 === "some" && !q2) return "5k";
  return q2 || "5k";
}

export default function PlanFinder() {
  const [step, setStep] = useState<Step>("q1");
  const [q1Answer, setQ1Answer] = useState<string | null>(null);
  const [q2Answer, setQ2Answer] = useState<string | null>(null);

  const recommendedId = q1Answer
    ? getRecommendedId(q1Answer, q2Answer ?? undefined)
    : null;
  const recommendedPlan = TRAINING_PLANS.find((p) => p.id === recommendedId);

  const handleQ1 = (id: string) => {
    setQ1Answer(id);
    if (id === "new") {
      setStep("result");
    } else {
      setStep("q2");
    }
  };

  const handleQ2 = (id: string) => {
    setQ2Answer(id);
    setStep("result");
  };

  const reset = () => {
    setStep("q1");
    setQ1Answer(null);
    setQ2Answer(null);
  };

  return (
    <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            Quick finder
          </p>
          <h2 className="text-base font-bold text-gray-900">
            {step === "q1" && "What describes you?"}
            {step === "q2" && "What's your goal race?"}
            {step === "result" && "Recommended for you"}
          </h2>
        </div>
        {step !== "q1" && (
          <button
            onClick={reset}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label="Start over"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="px-5 pb-4 flex gap-1.5">
        {["q1", "q2", "result"].map((s, i) => (
          <span
            key={s}
            className={`h-1 rounded-full transition-all duration-300 ${
              step === s
                ? "w-5 bg-gray-700"
                : i < ["q1", "q2", "result"].indexOf(step)
                ? "w-2 bg-gray-400"
                : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {step === "q1" && (
          <div className="flex flex-col gap-2">
            {Q1_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleQ1(opt.id)}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-400 hover:shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
              </button>
            ))}
          </div>
        )}

        {step === "q2" && (
          <div className="grid grid-cols-2 gap-2">
            {Q2_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleQ2(opt.id)}
                className="flex flex-col items-start gap-0.5 px-4 py-3 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-400 hover:shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.detail}</span>
              </button>
            ))}
          </div>
        )}

        {step === "result" && recommendedPlan && (
          <div>
            <Link
              to={`/training-plans/${recommendedPlan.id}`}
              className={`flex items-center justify-between px-5 py-4 rounded-xl ${recommendedPlan.color} transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20`}
            >
              <div>
                <p className={`text-lg font-bold ${recommendedPlan.textColor}`}>
                  {recommendedPlan.name}
                </p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${recommendedPlan.badgeColor}`}>
                    {recommendedPlan.weeks} weeks
                  </span>
                  {recommendedPlan.distance && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${recommendedPlan.badgeColor}`}>
                      {recommendedPlan.distance}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0 ml-3">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>
            <button
              onClick={reset}
              className="mt-3 text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              See all plans instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
