/**
 * 3-Column Workspace Layout
 */

import { useState } from "react";
import { LeftNav } from "./LeftNav";
import { WeekColumn } from "./WeekColumn";
import { InspectorColumn } from "./InspectorColumn";
import { usePlanWorkspace } from "../hooks/usePlanWorkspace";
import { useWorkoutActions } from "../hooks/useWorkoutActions";
import type { TrainingPlanWithStatus, NavSection } from "../domain/types";

export interface TrainingPlanWorkspaceProps {
  plan: TrainingPlanWithStatus;
  onSave?: () => void;
  onExit?: () => void;
}

export function TrainingPlanWorkspace({
  plan,
}: TrainingPlanWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<NavSection>("plan");
  const { workspaceState, selectWorkout, selectWeek, markWorkoutComplete } =
    usePlanWorkspace(plan);
  const { moveWorkout, swapWorkouts } = useWorkoutActions();

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
            onMarkComplete={markWorkoutComplete}
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
