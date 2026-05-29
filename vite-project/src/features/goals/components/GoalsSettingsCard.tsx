/**
 * GoalsSettingsCard — shows the athlete's saved goal in Settings and links to
 * the onboarding wizard (which pre-fills when a profile already exists) to edit.
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals } from "../hooks/useTrainingGoals";
import { INTEGRATION_LABELS } from "../types";
import { formatRaceLabel } from "../utils";

export function GoalsSettingsCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { goals, loading } = useTrainingGoals(user?.uid);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Training Goals</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/onboarding")}
          className="hover:text-blue-600"
        >
          {goals ? "Edit" : "Set goals"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : goals ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-medium text-gray-700">Recent race</span>
            <span className="text-gray-900">
              {formatRaceLabel(goals.recentRace)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-medium text-gray-700">Goal race</span>
            <span className="text-gray-900">
              🎯 {formatRaceLabel(goals.goalRace)}
            </span>
          </div>
          <div className="flex items-start justify-between py-2">
            <span className="font-medium text-gray-700">Used in</span>
            <span className="text-right text-gray-900">
              {goals.enabledIntegrations.length > 0
                ? goals.enabledIntegrations
                    .map((k) => INTEGRATION_LABELS[k].label)
                    .join(", ")
                : "Nowhere (all disabled)"}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Set a goal race to personalize the calculators and fuel planner.
        </p>
      )}
    </div>
  );
}
