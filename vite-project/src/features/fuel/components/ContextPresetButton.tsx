/**
 * Context Preset Button Component
 * Reusable preset selector for fuel contexts
 */

import { CheckCircle } from "lucide-react";
import type { FuelContextPreset } from "../types";

interface ContextPresetButtonProps {
  preset: FuelContextPreset;
  isSelected: boolean;
  onToggle: () => void;
}

export function ContextPresetButton({
  preset,
  isSelected,
  onToggle,
}: ContextPresetButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative p-3 text-left border-2 rounded-lg transition-all ${
        isSelected
          ? "bg-purple-100 border-purple-500"
          : "bg-white border-purple-200 hover:bg-purple-50"
      }`}
    >
      <div className="text-2xl mb-1">{preset.icon}</div>
      <div className="text-xs font-medium text-gray-700">{preset.label}</div>
      {isSelected && (
        <CheckCircle className="h-4 w-4 text-purple-600 absolute top-2 right-2" />
      )}
    </button>
  );
}
