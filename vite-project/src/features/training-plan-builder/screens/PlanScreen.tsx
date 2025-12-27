/**
 * Main Plan Workspace Screen
 */

import { TrainingPlanWorkspace } from "../layout/TrainingPlanWorkspace";
import type { TrainingPlanWithStatus } from "../domain/types";

export interface PlanScreenProps {
  plan: TrainingPlanWithStatus;
  onSave?: () => void;
  onExit?: () => void;
}

export function PlanScreen({ plan, onSave, onExit }: PlanScreenProps) {
  return <TrainingPlanWorkspace plan={plan} onSave={onSave} onExit={onExit} />;
}
