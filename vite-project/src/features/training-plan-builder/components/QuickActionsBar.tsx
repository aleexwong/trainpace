/**
 * Quick Actions Bar
 */

import { Check, Move, Repeat } from "lucide-react";
import type { WorkoutWithStatus } from "../domain/types";

export interface QuickActionsBarProps {
  workout: WorkoutWithStatus;
  onMarkComplete: () => void;
  onMove: () => void;
  onSwap: () => void;
}

export function QuickActionsBar({
  workout,
  onMarkComplete,
  onMove,
  onSwap,
}: QuickActionsBarProps) {
  return (
    <div className="flex gap-2">
      {workout.status !== "completed" && (
        <button
          onClick={onMarkComplete}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          Mark Complete
        </button>
      )}
      <button
        onClick={onMove}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        title="Move workout"
      >
        <Move className="w-4 h-4" />
      </button>
      <button
        onClick={onSwap}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        title="Swap workout"
      >
        <Repeat className="w-4 h-4" />
      </button>
    </div>
  );
}
