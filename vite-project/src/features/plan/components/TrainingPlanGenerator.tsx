import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usePlanGenerator } from "../hooks/usePlanGenerator";
import { useSavePlan } from "../hooks/useSavePlan";
import { usePlanProgress } from "../hooks/usePlanProgress";
import { usePlanEditor } from "../hooks/usePlanEditor";
import { PlanInputForm } from "./PlanInputForm";
import { PlanOverview } from "./PlanOverview";
import { PlanStats } from "./PlanStats";
import { PlanCalendar } from "./PlanCalendar";
import { ThisWeekCard } from "./ThisWeekCard";
import { WeekCard } from "./WeekCard";
import { cn } from "@/lib/utils";
import {
  loadDraftInputs,
  clearDraftPlan,
  getPendingSave,
  setPendingSave,
  clearPendingSave,
  clearGuestProgress,
} from "../utils/planPersistence";

import type { GoalRace, TrainingPlan } from "../types";

type Segment = "thisweek" | "schedule" | "stats";

const SEGMENT_TABS: { id: Segment; label: string }[] = [
  { id: "thisweek", label: "This Week" },
  { id: "schedule", label: "Schedule" },
  { id: "stats", label: "Stats" },
];

function SegmentTabs({ active, onChange }: { active: Segment; onChange: (s: Segment) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Plan view"
      className="sticky top-[72px] z-30 -mx-4 px-4 py-2.5 bg-white/85 backdrop-blur-md border-b border-slate-100"
    >
      <div className="flex gap-1 rounded-full bg-slate-100 p-1">
        {SEGMENT_TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex-1 rounded-full py-2 px-1 text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-colors",
                selected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressStrip({ completed, total, pct }: { completed: number; total: number; pct: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="flex-shrink-0 text-xs font-semibold text-slate-500 tabular-nums">
        {completed}/{total} runs · {pct}%
      </span>
    </div>
  );
}

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
  const { plan, error, generate, updatePlan, reset } = usePlanGenerator();
  const { save, saving, savedId, error: saveError } = useSavePlan();
  // Before save, planId is undefined and progress lives in guest localStorage
  // (even for signed-in users viewing an unsaved plan) — those ticks ride
  // into the Firestore doc via useSavePlan's readGuestProgress() merge once
  // savedId lands and this hook starts writing there instead.
  const progress = usePlanProgress({ plan, planId: savedId ?? undefined, userId: user?.uid });

  // Previously-entered form values restored from localStorage (see planPersistence.ts).
  // Loaded once — regenerating requires "Start over" first, which remounts the form.
  const draftInputs = useMemo(() => loadDraftInputs(), []);

  // Segmented plan view — defaults to This Week once the plan is in progress
  // (a current week exists), else Schedule (plan hasn't started, or it's
  // over). `userSegment` is the rider's own tab choice, which always wins;
  // it's cleared whenever `plan` changes identity (a fresh generate, or
  // "Start over" clearing it) so the next plan gets its own fresh default.
  // Adjusting state during render (rather than in an effect) so the segment
  // is correct on the very same render the plan first appears — PlanCalendar
  // stays mounted across tab switches (to track "have we auto-scrolled yet"
  // and not lose accordion state), so if it briefly rendered as the active
  // segment before a later effect corrected the default, its own
  // scroll-current-week-into-view effect would fire and yank the page.
  const [userSegment, setUserSegment] = useState<Segment | null>(null);
  const [trackedPlan, setTrackedPlan] = useState<typeof plan>(null);
  if (plan !== trackedPlan) {
    setTrackedPlan(plan);
    setUserSegment(null);
  }

  // Schedule edits (drag-reschedule) swap the plan object too — pre-sync the
  // identity tracker so the edit isn't mistaken for a fresh generate, which
  // would reset the user's segment tab out from under their drag.
  const handlePlanEdited = useCallback(
    (next: TrainingPlan) => {
      setTrackedPlan(next);
      updatePlan(next);
    },
    [updatePlan]
  );

  const editor = usePlanEditor({
    plan,
    planId: savedId ?? undefined,
    completed: progress.completed,
    onPlanChange: handlePlanEdited,
    onCompletedChange: progress.replaceCompleted,
  });
  const activeSegment: Segment = userSegment ?? (progress.currentWeekNumber !== null ? "thisweek" : "schedule");

  const currentWeek = plan?.weeks.find((w) => w.weekNumber === progress.currentWeekNumber) ?? null;

  // Reserve space above the fixed header + sticky segment tabs so
  // scrollIntoView (the "jump to now" behavior in the Schedule segment)
  // never tucks a card's top edge underneath them. Scoped to this page only
  // — cleared on unmount rather than set globally.
  useEffect(() => {
    if (!plan) return;
    const prev = document.documentElement.style.scrollPaddingTop;
    document.documentElement.style.scrollPaddingTop = "170px";
    return () => {
      document.documentElement.style.scrollPaddingTop = prev;
    };
  }, [plan]);

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
      clearGuestProgress();
    }
  }, [savedId]);

  return (
    <div className={cn("mx-auto px-4 py-10 space-y-10", plan ? "max-w-3xl lg:max-w-6xl" : "max-w-3xl")}>
      {/* Marketing intro — only shown pre-generation. Once a plan exists, the
          lean PlanOverview hero carries the page's identity instead, so this
          duplicate title/tagline block would just be dead scroll height. */}
      {!plan && (
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
      )}

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
        <div className="space-y-4 sm:space-y-6">
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
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-emerald-800 text-sm sm:text-base">Save your plan</div>
                <div className="hidden sm:block text-sm text-emerald-700 mt-0.5">
                  Sign in to save this plan to your dashboard and track your progress.
                </div>
              </div>
              <a
                href="/login?returnTo=/plan"
                onClick={setPendingSave}
                className="flex-shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 text-sm transition-colors"
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

          {progress.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {progress.error}
            </div>
          )}

          {editor.moveError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {editor.moveError}
            </div>
          )}

          {/* Segment control is a mobile/tablet affordance only — at lg the
              two-column grid below shows This Week, Schedule, and Stats
              simultaneously, so there's nothing left to switch between. */}
          <div className="lg:hidden">
            <SegmentTabs active={activeSegment} onChange={setUserSegment} />
          </div>

          {/* lg+: two-column layout. Below lg, `lg:grid` doesn't apply, so
              this is just a plain block and the left-rail / right-column
              wrappers below stack with zero imposed margin between them —
              only one of the three segment panels they contain is ever
              visible at a time (the others carry the "hidden" class), same
              as before. Gap/columns only take effect at lg, so mobile
              spacing is untouched. */}
          <div className="lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">
            {/* Left rail: This Week + progress strip + Stats, stacked.
                Sticky + capped height with its own scroll region — tried
                making only the This Week block sticky and letting Stats
                flow instead, but that produces a real rendering bug: once
                enough of the page scrolls that the (short) rail approaches
                its own end, CSS sticky transitions This Week from "stuck at
                top-88" to "pinned to the rail's bottom edge" — and since
                Stats' natural (non-sticky) position ends at that same rail
                bottom edge, the two visually overlap (verified via
                getBoundingClientRect: This Week's box and the Stats volume
                chart occupied the same rect). Sticky-ing the whole rail
                with a max-height + its own scrollbar avoids that overlap
                entirely — the tradeoff is Stats can require an internal
                scroll on shorter viewports, which is the lesser issue. */}
            <div
              className={cn(
                "lg:col-span-2 lg:sticky lg:top-[88px] lg:self-start lg:space-y-6",
                "lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto lg:pb-2"
              )}
            >
              {/* This Week */}
              <div className={cn("space-y-3 sm:space-y-4", activeSegment !== "thisweek" && "hidden", "lg:block")}>
                <ThisWeekCard
                  plan={plan}
                  currentWeekNumber={progress.currentWeekNumber}
                  nextWorkout={progress.nextWorkout}
                  planProgress={progress.planProgress}
                  weekProgress={progress.weekProgress}
                  isComplete={progress.isComplete}
                  onToggle={progress.toggle}
                  isPending={progress.isPending}
                />

                {progress.planProgress.totalCount > 0 && (
                  <ProgressStrip
                    completed={progress.planProgress.completedCount}
                    total={progress.planProgress.totalCount}
                    pct={progress.planProgress.pct}
                  />
                )}

                {/* Mobile-only: the schedule (with this same week's card,
                    idSuffix-free) is off-screen behind the Schedule segment,
                    so This Week carries its own copy here. At lg the
                    schedule column is always visible right alongside this
                    rail, so this copy would just be a redundant duplicate —
                    hidden there instead of dropped, to keep this panel's own
                    mobile-measured height (accordion state, etc.) untouched. */}
                {progress.currentWeekNumber !== null && currentWeek && (
                  <div className="lg:hidden">
                    <WeekCard
                      week={currentWeek}
                      isCurrent
                      defaultOpen
                      idSuffix="-thisweek"
                      progress={{
                        isComplete: (day) => progress.isComplete(currentWeek.weekNumber, day),
                        onToggle: (day) => progress.toggle(currentWeek.weekNumber, day),
                        pending: (day) => progress.isPending(currentWeek.weekNumber, day),
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Stats — the rail's own lg:space-y-6 (above) provides the gap
                  above this block at lg; no unprefixed spacing here so
                  mobile (only one panel ever visible) gets no extra gap. */}
              <div className={cn(activeSegment !== "stats" && "hidden", "lg:block")}>
                <PlanStats plan={plan} />
              </div>
            </div>

            {/* Right column: Schedule */}
            <div className={cn("lg:col-span-3", activeSegment !== "schedule" && "hidden", "lg:block")}>
              <PlanCalendar
                plan={plan}
                onSave={user ? handleSave : undefined}
                saving={saving}
                savedId={savedId}
                progress={progress}
                editor={editor}
                isActive={activeSegment === "schedule"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
