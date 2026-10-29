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
          ? "bg-purple-100 dark:bg-purple-900/40 border-purple-500"
          : "bg-white dark:bg-neutral-900 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-950/40"
      }`}
    >
      <div className="text-2xl mb-1">{preset.icon}</div>
      <div className="text-xs font-medium text-gray-700 dark:text-neutral-300">{preset.label}</div>
      {isSelected && (
        <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 absolute top-2 right-2" />
      )}
    </button>
  );
}
