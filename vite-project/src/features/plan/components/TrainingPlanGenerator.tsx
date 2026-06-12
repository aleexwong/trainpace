import { useAuth } from "../../auth/AuthContext";
import { usePlanGenerator } from "../hooks/usePlanGenerator";
import { useSavePlan } from "../hooks/useSavePlan";
import { PlanInputForm } from "./PlanInputForm";
import { PlanOverview } from "./PlanOverview";
import { PlanCalendar } from "./PlanCalendar";

import type { GoalRace } from "../types";

interface Props {
  prefillPaces?: {
    easy: string;
    tempo: string;
    interval: string;
    race: string;
  };
  prefillGoalTime?: string;
  prefillSource?: "calculator" | "vdot";
  prefillGoal?: { goalRace: GoalRace; goalTime: string };
}

export function TrainingPlanGenerator({ prefillPaces, prefillGoalTime, prefillSource, prefillGoal }: Props) {
  const { user } = useAuth();
  const { plan, error, generate, reset } = usePlanGenerator();
  const { save, saving, savedId, error: saveError } = useSavePlan();

  async function handleSave() {
    if (!plan || !user) return;
    await save(plan, user.uid);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <div>
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          TrainPace
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Training Plan Generator
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Science-backed periodized training plans built around your race, fitness
          level, and schedule. Powered by Jack Daniels' VDOT methodology.
        </p>
      </div>

      {!plan ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Build Your Plan</h2>
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <PlanInputForm
            onGenerate={generate}
            prefillPaces={prefillPaces}
            prefillGoalTime={prefillGoalTime ?? prefillGoal?.goalTime}
            prefillGoalRace={prefillGoal?.goalRace}
            prefillSource={prefillSource}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Start over
          </button>

          <PlanOverview plan={plan} />

          {/* Save prompt for logged-in users */}
          {!user && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-emerald-800">Save your plan</div>
                <div className="text-sm text-emerald-700 mt-0.5">
                  Sign in to save this plan to your dashboard and track your progress.
                </div>
              </div>
              <a
                href="/login"
                className="flex-shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 text-sm transition-colors"
              >
                Sign in →
              </a>
            </div>
          )}

          {saveError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <PlanCalendar
            plan={plan}
            onSave={user ? handleSave : undefined}
            saving={saving}
            savedId={savedId}
          />
        </div>
      )}
    </div>
  );
}
