/**
 * Edit Pace Plan Dialog
 * Modal for editing plan name, notes, and race date
 */

import { useState, useEffect } from "react";
import { X, Calendar, FileText, Tag, Save } from "lucide-react";

interface EditPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    planName?: string,
    notes?: string,
    raceDate?: string
  ) => Promise<void>;
  currentPlanName?: string;
  currentNotes?: string;
  currentRaceDate?: string;
  raceDistance: string;
  raceTime: string;
}

export function EditPlanDialog({
  isOpen,
  onClose,
  onSave,
  currentPlanName,
  currentNotes,
  currentRaceDate,
  raceDistance,
  raceTime,
}: EditPlanDialogProps) {
  const [planName, setPlanName] = useState("");
  const [notes, setNotes] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current values when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPlanName(currentPlanName || "");
      setNotes(currentNotes || "");
      setRaceDate(currentRaceDate || "");
    }
  }, [isOpen, currentPlanName, currentNotes, currentRaceDate]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(
        planName.trim() || undefined,
        notes.trim() || undefined,
        raceDate || undefined
      );
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Training Plan
          </h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className=" border bg-gray-300 text-gray-700 rounded-md hover:bg-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Race Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-900">
              <strong>Race:</strong> {raceDistance} in {raceTime}
            </p>
          </div>

          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Plan Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., Boston 2025, Fall PR Attempt"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSaving}
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Give your plan a memorable name
            </p>
          </div>

          {/* Race Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Race Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              When is your target race?
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focus on negative splits, adjust for weather"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSaving}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add any training notes or context
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border bg-gray-300 text-gray-700 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:from-purple-800 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
