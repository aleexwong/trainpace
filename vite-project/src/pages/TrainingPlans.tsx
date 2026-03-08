import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { TRAINING_PLANS, TrainingPlanCard, PlanFinder } from "@/features/training-plans";

export default function TrainingPlans() {
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <Helmet>
        <title>Training Plans | TrainPace</title>
        <meta
          name="description"
          content="Science-backed running training plans for every distance — marathon, half marathon, 10K, 5K, and beginner fitness."
        />
      </Helmet>

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Training Plans</h1>
          <p className="text-gray-500 text-sm">
            Pick a plan or answer 2 quick questions to get a recommendation.
          </p>
        </div>

        {/* Quick finder */}
        <PlanFinder />

        {/* All plans toggle */}
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors mx-auto"
        >
          <span>{showAll ? "Hide all plans" : "Browse all plans"}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
          />
        </button>

        {showAll && (
          <div className="flex flex-col gap-3">
            {TRAINING_PLANS.map((plan) => (
              <TrainingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
