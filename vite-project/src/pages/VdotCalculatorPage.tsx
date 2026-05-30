import { VdotCalculator } from "../features/vdot-calculator";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToVdotInputs } from "@/features/goals";

export default function VdotCalculatorPage() {
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);

  // Wait for the profile before mounting (prefill is applied on mount only).
  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  const initialInputs =
    goals?.enabledIntegrations?.includes("vdot")
      ? goalToVdotInputs(goals.recentRace)
      : undefined;

  return <VdotCalculator initialInputs={initialInputs} />;
}
