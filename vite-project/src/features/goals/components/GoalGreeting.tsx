/**
 * GoalGreeting — dashboard banner that surfaces the athlete's goal race and
 * quick links into the enabled tools. Falls back to a "set goals" CTA when no
 * profile exists yet (so it's discoverable for users who skipped onboarding).
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals } from "../hooks/useTrainingGoals";
import { formatRaceLabel } from "../utils";
import type { GoalIntegration } from "../types";

const TOOL_LINKS: Partial<Record<GoalIntegration, { to: string; label: string }>> = {
  pace: { to: "/calculator", label: "Training paces" },
  vdot: { to: "/vdot", label: "VDOT" },
  fuel: { to: "/fuel", label: "Fuel plan" },
};

export function GoalGreeting() {
  const { user } = useAuth();
  const { goals, loading } = useTrainingGoals(user?.uid);

  if (loading) return null;

  // No profile yet → prompt to onboard.
  if (!goals) {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900">Set a goal race 🎯</p>
          <p className="text-sm text-gray-600">
            Personalize the calculators and fuel planner in under a minute.
          </p>
        </div>
        <Link to="/onboarding">
          <Button>Set your goals</Button>
        </Link>
      </div>
    );
  }

  // Profile exists but the dashboard integration is switched off.
  if (!goals.enabledIntegrations.includes("dashboard")) return null;

  const links = goals.enabledIntegrations
    .map((k) => TOOL_LINKS[k])
    .filter((l): l is { to: string; label: string } => Boolean(l));

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
      <p className="text-sm text-gray-600">Your goal</p>
      <p className="text-lg font-bold text-gray-900">
        🎯 {formatRaceLabel(goals.goalRace)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to}>
            <Button variant="outline" size="sm" className="hover:text-blue-600">
              {l.label}
            </Button>
          </Link>
        ))}
        <Link to="/onboarding">
          <Button variant="outline" size="sm" className="hover:text-blue-600">
            Edit goal
          </Button>
        </Link>
      </div>
    </div>
  );
}
