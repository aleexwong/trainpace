/**
 * Left Navigation Sidebar
 */

import { Calendar, TrendingUp, MessageSquare, Settings, List, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavSection } from "../domain/types";

export interface LeftNavProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
  planName?: string;
  raceDate?: string;
  raceDistance?: string;
  onSave?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  planId?: string; // If planId exists, plan is already saved
}

const NAV_ITEMS: Array<{ section: NavSection; label: string; icon: any }> = [
  { section: "plan", label: "Plan", icon: List },
  { section: "today", label: "Today", icon: Calendar },
  { section: "progress", label: "Progress", icon: TrendingUp },
  { section: "coach", label: "Coach", icon: MessageSquare },
  { section: "settings", label: "Settings", icon: Settings },
];

export function LeftNav({
  activeSection,
  onSectionChange,
  planName,
  raceDate,
  raceDistance,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
  planId,
}: LeftNavProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Plan Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 truncate">
          {planName || "My Training Plan"}
        </h2>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <div>{raceDistance}</div>
          {raceDate && (
            <div>
              {new Date(raceDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 flex flex-col">
        <div className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ section, label, icon: Icon }) => (
          <button
            key={section}
            onClick={() => onSectionChange(section)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === section
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
        </div>

        {/* Save Button - Show for both new and existing plans */}
        {onSave && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{planId ? "Unsaved changes" : "Plan not saved yet"}</span>
              </div>
            )}
            <Button
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {planId ? "Save Changes" : "Save Plan"}
                </>
              )}
            </Button>
          </div>
        )}
      </nav>
    </div>
  );
}
