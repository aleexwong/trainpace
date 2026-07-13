import { Link } from "react-router-dom";
import type { TrainingPlan } from "../../plan/types";
import { TrainingPlanCard } from "./TrainingPlanCard";
import { ThisWeekCard } from "../../plan/components/ThisWeekCard";
import { usePlanProgress } from "../../plan/hooks/usePlanProgress";
import { selectActivePlan } from "../../plan/utils/planSchedule";

interface Props {
  plans: TrainingPlan[];
  /** Unfiltered plan list (ignores search) — used to find the active plan for ThisWeekCard. */
  allPlans: TrainingPlan[];
  loading: boolean;
  onDeletePlan: (id: string) => void;
  userId?: string;
}

function ActiveWeekSummary({ plan, userId }: { plan: TrainingPlan; userId?: string }) {
  const progress = usePlanProgress({ plan, planId: plan.id, userId });
  return (
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
  );
}

export function TrainingPlansSection({ plans, allPlans, loading, onDeletePlan, userId }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <div className="text-4xl mb-4">🏃</div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No training plans yet</h3>
        <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">
          Generate a personalized training plan based on your goal race and fitness level.
        </p>
        <Link
          to="/plan"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 text-sm transition-colors"
        >
          Build your plan →
        </Link>
      </div>
    );
  }

  const activePlan = selectActivePlan(allPlans);

  return (
    <div className="space-y-3">
      {activePlan && <ActiveWeekSummary plan={activePlan} userId={userId} />}
      {plans.map((plan) => (
        <TrainingPlanCard key={plan.id} plan={plan} onDelete={onDeletePlan} userId={userId} />
      ))}
    </div>
  );
}
