import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { TrainingPlan } from "../types";

interface TrainingPlanCardProps {
  plan: TrainingPlan;
}

export default function TrainingPlanCard({ plan }: TrainingPlanCardProps) {
  return (
    <Link
      to={`/training-plans/${plan.id}`}
      className={`group flex items-center justify-between px-6 py-5 rounded-2xl ${plan.color} transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-black/20`}
      aria-label={`View ${plan.name}`}
    >
      <div className="flex flex-col gap-2">
        <h2 className={`text-2xl font-bold ${plan.textColor}`}>{plan.name}</h2>
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full border ${plan.badgeColor}`}
          >
            {plan.weeks} weeks
          </span>
          {plan.distance && (
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full border ${plan.badgeColor}`}
            >
              {plan.distance}
            </span>
          )}
        </div>
      </div>

      <div className={`flex-shrink-0 ml-4 w-12 h-12 rounded-full bg-black flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1`}>
        <ArrowRight className="w-5 h-5 text-white" />
      </div>
    </Link>
  );
}
