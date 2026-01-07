/**
 * 3-Column Workspace Layout
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainingPlanPersistence } from "../hooks/useTrainingPlanPersistence";
import { LeftNav } from "./LeftNav";
import { WeekColumn } from "./WeekColumn";
import { InspectorColumn } from "./InspectorColumn";
import { usePlanWorkspace } from "../hooks/usePlanWorkspace";
import { useWorkoutActions } from "../hooks/useWorkoutActions";
import type { TrainingPlanWithStatus, NavSection } from "../domain/types";
import type { PlanInputs } from "../types";

export interface TrainingPlanWorkspaceProps {
  plan: TrainingPlanWithStatus;
  planId?: string; // Optional - if provided, plan is already saved
  wizardInputs?: PlanInputs; // Optional - wizard inputs for new plans
  onSave?: () => void;
  onExit?: () => void;
}

export function TrainingPlanWorkspace({
  plan,
  planId,
  wizardInputs,
  onExit,
}: TrainingPlanWorkspaceProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavSection>("plan");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedPlan, setLastSavedPlan] = useState<string>(JSON.stringify(plan.weeks));
  
  const { workspaceState, selectWorkout, selectWeek, markWorkoutComplete } =
    usePlanWorkspace(plan);
  const { moveWorkout, swapWorkouts } = useWorkoutActions();
  const { updatePlan, isUpdating, saveToDashboard, isSaving } = useTrainingPlanPersistence();

  // Track changes to detect unsaved state
  useEffect(() => {
    if (!planId) {
      // New plan - always has unsaved changes until first save
      setHasUnsavedChanges(true);
      return;
    }

    const currentPlanState = JSON.stringify(workspaceState.plan?.weeks || []);
    const hasChanged = currentPlanState !== lastSavedPlan;
    setHasUnsavedChanges(hasChanged);
  }, [workspaceState.plan, lastSavedPlan, planId]);

  // Handle save for existing plans
  const handleSaveExisting = useCallback(async (weeksToSave?: typeof workspaceState.plan.weeks) => {
    if (!planId || !workspaceState.plan) return;

    const weeks = weeksToSave || workspaceState.plan.weeks;

    try {
      await updatePlan(planId, {
        weeks,
        planName: workspaceState.plan.planName,
      });
      
      // Update last saved state
      setLastSavedPlan(JSON.stringify(weeks));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  }, [planId, workspaceState.plan, updatePlan]);

  // Handle save for new plans (first-time save)
  const handleSaveNew = useCallback(async () => {
    if (!workspaceState.plan) return;

    try {
      const savedPlanId = await saveToDashboard({
        plan: workspaceState.plan,
        inputs: wizardInputs || {
          // Fallback if no wizard inputs provided
          step1: { distance: plan.distance } as any,
          step2: { experienceLevel: plan.experienceLevel } as any,
          step3: {} as any,
        },
        planName: workspaceState.plan.planName,
      });

      if (savedPlanId) {
        // Redirect to workspace with planId
        navigate(`/training-plan-builder/${savedPlanId}`);
      }
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  }, [workspaceState.plan, plan, saveToDashboard, navigate, wizardInputs]);

  const handleSave = planId ? () => handleSaveExisting() : handleSaveNew;

  // Handle mark complete with auto-save
  const handleMarkComplete = useCallback(async (workoutId: string) => {
    // First, update local state
    markWorkoutComplete(workoutId);

    // Then, if this is a saved plan, auto-save to backend
    if (planId && workspaceState.plan) {
      // Build the updated weeks with the completed workout
      const updatedWeeks = workspaceState.plan.weeks.map((week) => ({
        ...week,
        workouts: week.workouts.map((workout) =>
          workout.id === workoutId
            ? { ...workout, status: "completed" as const }
            : workout
        ),
        completedCount: week.workouts.filter(
          (w) => w.id === workoutId || w.status === "completed"
        ).length,
      }));

      // Auto-save with the updated weeks
      try {
        await updatePlan(planId, {
          weeks: updatedWeeks,
          planName: workspaceState.plan.planName,
        });
        
        // Update last saved state
        setLastSavedPlan(JSON.stringify(updatedWeeks));
        setHasUnsavedChanges(false);
        console.log("✅ Auto-saved workout completion");
      } catch (error) {
        console.error("Failed to auto-save workout completion:", error);
      }
    }
  }, [markWorkoutComplete, planId, workspaceState.plan, updatePlan]);

  const selectedWorkout = workspaceState.plan?.weeks
    .flatMap((w) => w.workouts)
    .find((w) => w.id === workspaceState.selectedWorkoutId);

  const selectedWeek = workspaceState.plan?.weeks.find(
    (w) => w.weekNumber === workspaceState.selectedWeekNumber
  );

  return (
    <div className="flex justify-center min-h-screen bg-gray-50">
      <div className="flex w-full max-w-7xl shadow-lg">
        {/* Left Navigation */}
        <LeftNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          planName={plan.planName}
          raceDate={plan.raceDate}
          raceDistance={plan.distance}
          onSave={handleSave}
          isSaving={planId ? isUpdating : isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          planId={planId}
        />

        {/* Center: Week Column */}
        {activeSection === "plan" && workspaceState.plan && (
          <WeekColumn
            weeks={workspaceState.plan.weeks}
            selectedWeekNumber={workspaceState.selectedWeekNumber}
            selectedWorkoutId={workspaceState.selectedWorkoutId}
            onWeekSelect={selectWeek}
            onWorkoutSelect={selectWorkout}
            currentWeek={workspaceState.plan.currentWeek}
          />
        )}

        {/* Right: Inspector */}
        {activeSection === "plan" && (
          <InspectorColumn
            selectedWorkout={selectedWorkout || null}
            selectedWeek={selectedWeek || null}
            onMarkComplete={handleMarkComplete}
            onMoveWorkout={(id) => moveWorkout(id, 1)}
            onSwapWorkout={(id) => swapWorkouts(id, "")}
            onReduceWeek={(wn) => console.log("Reduce week", wn)}
          />
        )}

        {/* TODO: Add other sections (Today, Progress, Coach, Settings) */}
      </div>
    </div>
  );
}
