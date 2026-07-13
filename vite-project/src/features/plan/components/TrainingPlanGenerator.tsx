import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usePlanGenerator } from "../hooks/usePlanGenerator";
import { useSavePlan } from "../hooks/useSavePlan";
import { PlanInputForm } from "./PlanInputForm";
import { PlanOverview } from "./PlanOverview";
import { PlanCalendar } from "./PlanCalendar";
import {
  loadDraftInputs,
  clearDraftPlan,
  getPendingSave,
  setPendingSave,
  clearPendingSave,
} from "../utils/planPersistence";

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
  const { user, loading: authLoading } = useAuth();
  const { plan, error, generate, reset } = usePlanGenerator();
  const { save, saving, savedId, error: saveError } = useSavePlan();

  // Previously-entered form values restored from localStorage (see planPersistence.ts).
  // Loaded once — regenerating requires "Start over" first, which remounts the form.
  const draftInputs = useMemo(() => loadDraftInputs(), []);

  async function handleSave() {
    if (!plan || !user) return;
    await save(plan, user.uid);
  }

  // Sign-in handoff: a guest clicked "Sign in" on a generated plan, flagging it for
  // auto-save. If they return here signed in with the plan restored, save it for them
  // instead of making them click "Save" again.
  const autoSaveAttempted = useRef(false);
  useEffect(() => {
    if (authLoading || !user || !plan) return;
    if (!getPendingSave()) return;
    if (autoSaveAttempted.current) return;
    autoSaveAttempted.current = true;
    save(plan, user.uid);
  }, [authLoading, user, plan, save]);

  // Once a plan is saved (manually or via auto-save), it lives in the dashboard —
  // drop the local draft and any pending sign-in flag.
  useEffect(() => {
    if (savedId) {
      clearDraftPlan();
      clearPendingSave();
    }
  }, [savedId]);

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
            prefillPaces={prefillPaces ?? draftInputs?.paceResults}
            prefillGoalTime={prefillGoalTime ?? prefillGoal?.goalTime ?? draftInputs?.goalTime}
            prefillGoalRace={prefillGoal?.goalRace ?? draftInputs?.goalRace}
            prefillSource={prefillSource}
            prefillRaceDate={draftInputs?.raceDate}
            prefillFitness={draftInputs?.currentFitness}
            prefillDays={draftInputs?.availableDays}
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
                href="/login?returnTo=/plan"
                onClick={setPendingSave}
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
