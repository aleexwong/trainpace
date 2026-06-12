import { useSearchParams } from "react-router-dom";
import { VdotCalculator } from "../features/vdot-calculator";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToVdotInputs } from "@/features/goals";
import { INPUT_DISTANCES } from "@/features/vdot-calculator/types";

export default function VdotCalculatorPage() {
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);
  const [searchParams] = useSearchParams();

  // Wait for the profile before mounting (prefill is applied on mount only).
  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  // URL params take priority: ?d=meters&t=totalSeconds (for sharing links)
  const urlInputs = (() => {
    const dParam = searchParams.get("d");
    const tParam = searchParams.get("t");
    if (!dParam || !tParam) return undefined;
    const meters = parseFloat(dParam);
    const totalSec = parseInt(tParam, 10);
    if (!isFinite(meters) || !isFinite(totalSec) || totalSec <= 0) return undefined;
    const match = INPUT_DISTANCES.find((d) => Math.abs(d.meters - meters) < 1);
    const distanceName = match?.name ?? `${meters}m`;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return { distanceMeters: meters, distanceName, hours: String(h), minutes: String(m), seconds: String(s) };
  })();

  const initialInputs =
    urlInputs ??
    (goals?.enabledIntegrations?.includes("vdot")
      ? goalToVdotInputs(goals.recentRace)
      : undefined);

  return <VdotCalculator initialInputs={initialInputs} autoCalculate={!!urlInputs} />;
}
