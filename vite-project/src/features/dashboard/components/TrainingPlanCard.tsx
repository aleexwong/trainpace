import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Target, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TrainingPlanSummary } from "../hooks/useTrainingPlans";

interface TrainingPlanCardProps {
  plan: TrainingPlanSummary;
  onDelete: (planId: string) => void;
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
    year: "numeric",
  });
}

// Get days until race
function getDaysUntilRace(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDate = new Date(dateString);
  raceDate.setHours(0, 0, 0, 0);
  const diffTime = raceDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get status badge color
function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "archived":
      return "bg-gray-100 text-gray-600";
    case "draft":
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

// Get distance display name
function getDistanceDisplay(distance: string): string {
  const distanceMap: Record<string, string> = {
    "5K": "5K",
    "10K": "10K",
    "half-marathon": "Half Marathon",
    "marathon": "Marathon",
  };
  return distanceMap[distance] || distance;
}

export function TrainingPlanCard({ plan, onDelete }: TrainingPlanCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const daysUntilRace = getDaysUntilRace(plan.raceDate);
  const isPastRace = daysUntilRace < 0;

  const handleOpenPlan = () => {
    navigate(`/training-plan-builder/${plan.planId}`);
  };

  const handleDelete = () => {
    onDelete(plan.planId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1" onClick={handleOpenPlan}>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {plan.planName || `${getDistanceDisplay(plan.distance)} Training Plan`}
              </h3>
              <p className="text-sm text-gray-500">{getDistanceDisplay(plan.distance)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(plan.status)}`}>
                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-4" onClick={handleOpenPlan}>
            <div className="flex items-center text-sm text-gray-600">
              <Target className="h-4 w-4 mr-2 text-gray-400" />
              <span>Goal: {formatGoalTime(plan.goalTime)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {formatRaceDate(plan.raceDate)}
                {!isPastRace && daysUntilRace <= 30 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({daysUntilRace} days away)
                  </span>
                )}
                {isPastRace && (
                  <span className="ml-2 text-gray-400">
                    (Race completed)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{plan.totalWeeks} week program</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {plan.experienceLevel.charAt(0).toUpperCase() + plan.experienceLevel.slice(1)} level
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenPlan}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-2"
            >
              View Plan
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Training Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{plan.planName || getDistanceDisplay(plan.distance) + ' Training Plan'}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
