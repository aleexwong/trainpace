import { Flame } from "lucide-react";
import { FuelPlan } from "../types";
import { FuelPlanCard } from "./FuelPlanCard";

interface FuelPlansSectionProps {
  fuelPlans: FuelPlan[];
  loading: boolean;
  onDeletePlan: (planId: string) => void;
  onCopyPlan: (plan: FuelPlan) => void;
}

export function FuelPlansSection({
  fuelPlans,
  loading,
  onDeletePlan,
  onCopyPlan,
}: FuelPlansSectionProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading fuel plans...</p>
      </div>
    );
  }

  if (fuelPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No Fuel Plans Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Create your first AI-powered fuel plan to see it here. Plans are
          automatically saved when you generate AI recommendations.
        </p>
        <a
          href="/fuel"
          className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Create Fuel Plan
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {fuelPlans.length} fuel plan
          {fuelPlans.length !== 1 ? "s" : ""} saved
        </div>
        <a
          href="/fuel"
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm"
        >
          Create New Plan
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fuelPlans.map((plan) => (
          <FuelPlanCard
            key={plan.id}
            plan={plan}
            onDelete={onDeletePlan}
            onCopy={onCopyPlan}
          />
        ))}
      </div>
    </>
  );
}
