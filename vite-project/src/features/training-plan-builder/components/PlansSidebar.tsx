/**
 * Plans Sidebar Component
 * Displays previous training plans in a sidebar similar to Notion/Claude chat history
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, Target, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrainingPlanSummary } from "@/features/dashboard/hooks/useTrainingPlans";

interface PlansSidebarProps {
  plans: TrainingPlanSummary[];
  loading: boolean;
  onNewPlan?: () => void;
}

// Format goal time from seconds to HH:MM:SS or MM:SS
function formatGoalTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

// Format race date
function formatRaceDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Get distance display name
function getDistanceDisplay(distance: string): string {
  const distanceMap: Record<string, string> = {
    "5K": "5K",
    "10K": "10K",
    "half-marathon": "Half",
    "marathon": "Marathon",
  };
  return distanceMap[distance] || distance;
}

// Get status indicator color
function getStatusDot(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "completed":
      return "bg-blue-500";
    case "archived":
      return "bg-gray-400";
    case "draft":
    default:
      return "bg-yellow-500";
  }
}

export function PlansSidebar({ plans, loading, onNewPlan }: PlansSidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handlePlanClick = (planId: string) => {
    navigate(`/training-plan-builder/${planId}`);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 h-full",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Header */}
      <div className={cn(
        "p-4 border-b border-gray-100",
        isCollapsed && "flex justify-center"
      )}>
        {isCollapsed ? (
          <span className="text-lg">📋</span>
        ) : (
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Your Plans</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewPlan}
              className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Plans List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : isCollapsed ? (
          // Collapsed view - show just dots/icons
          <div className="flex flex-col items-center gap-2 py-4">
            {plans.slice(0, 10).map((plan) => (
              <button
                key={plan.planId}
                onClick={() => handlePlanClick(plan.planId)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center relative group"
                title={plan.planName || `${getDistanceDisplay(plan.distance)} Plan`}
              >
                <span className={cn("w-2 h-2 rounded-full", getStatusDot(plan.status))} />
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20">
                  {plan.planName || `${getDistanceDisplay(plan.distance)} Plan`}
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Expanded view - show full plan cards
          <div className="py-2">
            {plans.map((plan) => (
              <button
                key={plan.planId}
                onClick={() => handlePlanClick(plan.planId)}
                className="w-full px-3 py-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-b-0"
              >
                {/* Plan Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusDot(plan.status))} />
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {plan.planName || `${getDistanceDisplay(plan.distance)} Training Plan`}
                  </span>
                </div>
                
                {/* Plan Details */}
                <div className="ml-4 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {formatGoalTime(plan.goalTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatRaceDate(plan.raceDate)}
                  </span>
                </div>
              </button>
            ))}
            
            {plans.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No saved plans yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - View Dashboard Link */}
      {!isCollapsed && plans.length > 0 && (
        <div className="p-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="w-full text-xs text-gray-500 hover:text-gray-700"
          >
            View all in Dashboard →
          </Button>
        </div>
      )}
    </div>
  );
}
