/**
 * DistanceSelector — Compact distance picker grouped by category
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

const DISTANCE_TOOLTIP: Record<string, string> = {
  Mile: "1.61km",
  "3K": "1.86mi",
  "5K": "3.11mi",
  "10K": "6.21mi",
  "15K": "9.32mi",
  "Half Marathon": "21.1km / 13.1mi",
  Marathon: "42.2km / 26.2mi",
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
          <div key={group.label} className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider w-20 shrink-0">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.distances.map((d) => {
                const isSelected = selectedMeters === d.meters;
                return (
                  <button
                    key={d.name}
                    onClick={() => onSelect(d.meters, d.name)}
                    title={DISTANCE_TOOLTIP[d.name]}
                    className={`relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    {isSelected && (
                      <Check className="inline w-3 h-3 mr-1 -mt-0.5" />
                    )}
                    {d.label}
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
