/**
 * Reduce Week Modal
 */

import { X } from "lucide-react";
import { useState } from "react";

export interface ReduceWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  onReduce: (percentage: number) => void;
}

export function ReduceWeekModal({
  isOpen,
  onClose,
  weekNumber,
  onReduce,
}: ReduceWeekModalProps) {
  const [percentage, setPercentage] = useState(20);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Reduce Week {weekNumber}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Reduce all workouts in this week by a percentage
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reduction Percentage
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="10"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-blue-600 mt-2">
              {percentage}%
            </div>
          </div>
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
              onReduce(percentage);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reduce Week
          </button>
        </div>
      </div>
    </div>
  );
}
