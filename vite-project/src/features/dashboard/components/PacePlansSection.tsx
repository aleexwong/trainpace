import { Activity } from "lucide-react";
import { PacePlan } from "../types";
import { PacePlanCard } from "./PacePlanCard";

interface PacePlansSectionProps {
  pacePlans: PacePlan[];
  loading: boolean;
  onDeletePlan: (planId: string) => void;
  onCopyPlan: (plan: PacePlan) => void;
  onEditPlan: (plan: PacePlan) => void;
}

export function PacePlansSection({
  pacePlans,
  loading,
  onDeletePlan,
  onCopyPlan,
  onEditPlan,
}: PacePlansSectionProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading pace plans...</p>
      </div>
    );
  }

  if (pacePlans.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No Pace Plans Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Create your first training pace plan based on your race times.
        </p>
        <a
          href="/calculator"
          className="inline-block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Create Pace Plan
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {pacePlans.length} pace plan
          {pacePlans.length !== 1 ? "s" : ""} saved
        </div>
        <a
          href="/calculator"
          className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors text-sm"
        >
          Create New Plan
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pacePlans.map((plan) => (
          <PacePlanCard
            key={plan.id}
            plan={plan}
            onDelete={onDeletePlan}
            onCopy={onCopyPlan}
            onEdit={onEditPlan}
          />
        ))}
      </div>
    </>
  );
}
