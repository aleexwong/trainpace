/**
 * Swap Workout Modal
 */

import { X } from "lucide-react";

export interface SwapWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  onSwap: (targetWorkoutId: string) => void;
}

export function SwapWorkoutModal({
  isOpen,
  onClose,
  workoutId,
  onSwap,
}: SwapWorkoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Swap Workout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            TODO: Implement workout selector for workout {workoutId}
          </p>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSwap("other-workout-id"); // TODO: Use selected workout
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Swap Workouts
          </button>
        </div>
      </div>
    </div>
  );
}
