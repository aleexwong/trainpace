import { useState } from "react";
import {
  Trash2,
  Copy,
  Edit,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PacePlan } from "../types";

interface PacePlanCardProps {
  plan: PacePlan;
  onDelete: (planId: string) => void;
  onCopy: (plan: PacePlan) => void;
  onEdit: (plan: PacePlan) => void;
}

export function PacePlanCard({
  plan,
  onDelete,
  onCopy,
  onEdit,
}: PacePlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const raceTime = `${plan.hours}:${String(plan.minutes).padStart(2, "0")}:${String(
    plan.seconds
  ).padStart(2, "0")}`;
  const paceUnit = plan.paceType === "km" ? "min/km" : "min/mi";

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const formatRaceDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const raceDate = formatRaceDate(plan.raceDate);
  const hasNotes = plan.notes && plan.notes.trim().length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">
            {plan.planName || `${plan.distance}${plan.units} Race`}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDate(plan.createdAt)} • {raceTime}
          </p>
          {raceDate && (
            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Race: {raceDate}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(plan)}
            className="text-gray-400 hover:text-blue-500 transition-colors bg-transparent rounded-full p-1 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Edit plan"
            aria-label="Edit pace plan"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="text-gray-400 hover:text-red-500 transition-colors bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Delete pace plan"
            aria-label="Delete pace plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pace Unit Badge */}
      <div className="mb-3">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          Paces in {paceUnit}
        </span>
      </div>

      {/* Paces Grid */}
      <div className="space-y-2 mb-3 bg-blue-50 p-3 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Race Pace</div>
            <div className="font-bold text-blue-600">{plan.paces.race}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Easy</div>
            <div className="font-bold text-blue-600">{plan.paces.easy}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Tempo</div>
            <div className="font-bold text-blue-600">{plan.paces.tempo}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Interval</div>
            <div className="font-bold text-blue-600">{plan.paces.interval}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Long Run</div>
            <div className="font-bold text-blue-600">{plan.paces.xlong}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Yasso 800s</div>
            <div className="font-bold text-blue-600">{plan.paces.yasso}</div>
          </div>
        </div>
      </div>

      {/* Notes (Expandable) */}
      {hasNotes && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-sm text-purple-600 hover:text-purple-700 flex items-center justify-between bg-purple-50 p-2 rounded-lg"
          >
            <span className="font-medium">Training Notes</span>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expanded && (
            <div className="mt-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {plan.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onCopy(plan)}
        className="w-full bg-blue-500 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
      >
        <Copy className="w-4 h-4" />
        Copy Paces
      </button>
    </div>
  );
}
