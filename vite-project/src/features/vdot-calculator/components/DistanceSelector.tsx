/**
 * DistanceSelector — Visual card-based distance picker grouped by category
 */

import { Check } from "lucide-react";
import { INPUT_DISTANCES } from "../types";

const DISTANCE_GROUPS = [
  {
    label: "Track",
    distances: INPUT_DISTANCES.filter((d) => d.meters <= 1609.34),
  },
  {
    label: "Road",
    distances: INPUT_DISTANCES.filter((d) => d.meters > 1609.34 && d.meters <= 15000),
  },
  {
    label: "Endurance",
    distances: INPUT_DISTANCES.filter((d) => d.meters > 15000),
  },
];

const DISTANCE_CONTEXT: Record<string, string> = {
  "800m": "Half mile",
  "1500m": "Metric mile",
  Mile: "Classic mile",
  "3K": "Cross country",
  "5K": "Park run",
  "10K": "Road classic",
  "15K": "Long road race",
  "Half Marathon": "13.1 miles",
  Marathon: "26.2 miles",
};

interface DistanceSelectorProps {
  selectedMeters: number;
  onSelect: (meters: number, name: string) => void;
  error?: string;
}

export function DistanceSelector({ selectedMeters, onSelect, error }: DistanceSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Race Distance
      </label>

      <div className="space-y-2">
        {DISTANCE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {group.distances.map((d) => {
                const isSelected = selectedMeters === d.meters;
                return (
                  <button
                    key={d.name}
                    onClick={() => onSelect(d.meters, d.name)}
                    className={`relative p-2 rounded-xl text-left transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span
                      className={`block text-sm font-bold ${
                        isSelected ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {d.label}
                    </span>
                    <span
                      className={`block text-xs mt-0.5 ${
                        isSelected ? "text-blue-500" : "text-gray-400"
                      }`}
                    >
                      {DISTANCE_CONTEXT[d.name] || ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
