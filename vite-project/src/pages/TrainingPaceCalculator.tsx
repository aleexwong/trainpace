/**
 * Training Pace Calculator Page
 * Thin page wrapper that renders the pace calculator feature, pre-filled from
 * the athlete's saved goal profile when the "pace" integration is enabled.
 * Also supports shareable URLs: /calculator?d=<distanceKm>&t=<totalSeconds>
 */

import { useSearchParams } from "react-router-dom";
import { PaceCalculatorV2 } from "@/features/pace-calculator";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToPaceInputs } from "@/features/goals";

const TrainingPaceCalculator = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);

  // Parse shareable URL params: ?d=distanceKm&t=totalSeconds
  const urlInputs = (() => {
    const d = searchParams.get("d");
    const t = searchParams.get("t");
    if (!d || !t) return undefined;
    const distKm = parseFloat(d);
    const totalSecs = parseInt(t, 10);
    if (!isFinite(distKm) || distKm <= 0 || !isFinite(totalSecs) || totalSecs <= 0) return undefined;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return {
      distance: distKm.toString(),
      units: "km" as const,
      hours: h > 0 ? String(h) : "",
      minutes: String(m),
      seconds: String(s),
    };
  })();

  // Wait for the profile before mounting (prefill is applied on mount only).
  if (!urlInputs && user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  const initialInputs = urlInputs ?? (
    goals?.enabledIntegrations?.includes("pace")
      ? goalToPaceInputs(goals.recentRace, goals.paceUnit)
      : undefined
  );

  return <PaceCalculatorV2 initialInputs={initialInputs} autoCalculate={!!urlInputs} />;
};

export default TrainingPaceCalculator;
