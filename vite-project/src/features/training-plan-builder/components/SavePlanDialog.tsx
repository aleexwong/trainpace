/**
 * Save Training Plan Dialog
 * Modal for collecting plan name and notes before saving
 */

import { useState } from "react";
import { X, FileText, Tag, Calendar, Target } from "lucide-react";

interface SavePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planName?: string, notes?: string) => void;
  isSaving: boolean;
  distance: string;
  goalTime: string;
  raceDate: string;
}

export function SavePlanDialog({
  isOpen,
  onClose,
  onSave,
  isSaving,
  distance,
  goalTime,
  raceDate,
}: SavePlanDialogProps) {
  const [planName, setPlanName] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(planName.trim() || undefined, notes.trim() || undefined);
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const raceDateFormatted = new Date(raceDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Save Training Plan
          </h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Plan Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Target className="w-4 h-4" />
              <strong>Goal:</strong> {distance} in {goalTime}
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Calendar className="w-4 h-4" />
              <strong>Race Date:</strong> {raceDateFormatted}
            </div>
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
              placeholder={`${distance} Training Plan`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
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
              placeholder="Add any notes about your training plan..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              "Save to Dashboard"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
