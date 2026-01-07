/**
 * Main Plan Workspace Screen
 */

import { TrainingPlanWorkspace } from "../layout/TrainingPlanWorkspace";
import type { TrainingPlanWithStatus } from "../domain/types";
import type { PlanInputs } from "../types";

export interface PlanScreenProps {
  plan: TrainingPlanWithStatus;
  planId?: string; // Optional planId for saved plans
  wizardInputs?: PlanInputs; // Optional wizard inputs for new plans
  onSave?: () => void;
  onExit?: () => void;
}

export function PlanScreen({ plan, planId, wizardInputs, onSave, onExit }: PlanScreenProps) {
  return (
    <TrainingPlanWorkspace
      plan={plan}
      planId={planId}
      wizardInputs={wizardInputs}
      onSave={onSave}
      onExit={onExit}
    />
  );
}
