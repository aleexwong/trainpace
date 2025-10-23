/**
 * Race Preview Page
 *
 * Shows newly generated race plan with pace strategy and fuel schedule
 * User can review and decide to save to dashboard or go back to edit
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronDown, ChevronUp, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useRacePlanGeneration } from "@/features/race/hooks/useRacePlanGeneration";
import type { RacePlan } from "@/features/race";
import { formatTimeFromMinutes } from "@/features/race/utils/paceCalculations";

interface LocationState {
  plan: Omit<RacePlan, "id" | "userId" | "createdAt" | "updatedAt"> & { tempId: string };
}

export default function RacePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { createRacePlan } = useRacePlanGeneration();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["pace", "fuel"])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as LocationState;
  const plan = state?.plan;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-8">Please sign in to create race plans.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Plan to Preview</h2>
          <p className="text-gray-600 mb-8">
            It looks like you navigated here without generating a plan first.
          </p>
          <button
            onClick={() => navigate("/race/new")}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-medium transition-colors"
          >
            Go to Race Builder
          </button>
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setExpandedSections(newSections);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Remove tempId before saving
      const { tempId, ...planData } = plan;

      // Call createRacePlan to persist to Firestore
      const planId = await createRacePlan(planData);

      if (planId) {
        // Navigate to dashboard after successful save
        navigate("/dashboard", {
          state: { successMessage: `Race plan "${plan.name}" saved successfully!` },
        });
      }
    } catch (err) {
      console.error("Error saving race plan:", err);
      setError(err instanceof Error ? err.message : "Failed to save race plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Helmet>
        <title>Review Race Plan | TrainPace</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
            <p className="text-gray-600 mt-2">
              {plan.raceType} • {plan.routeMetadata.distance.toFixed(1)} km
              {plan.routeMetadata.elevationGain > 0 &&
                ` • ${plan.routeMetadata.elevationGain}m elevation`}
            </p>
          </div>
          <button
            onClick={() => navigate("/race/new")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Quick Overview Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Target Time
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatTimeFromMinutes(plan.targetTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Race Pace
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {plan.paceStrategy.racePace}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Fuel Needed
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {plan.fuelPlan.gelsNeeded} gels
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Total Carbs
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {plan.fuelPlan.totalCarbs}g
                </p>
              </div>
            </div>
          </div>

          {/* Pace Strategy Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection("pace")}
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-xl font-bold text-gray-900">Pace Strategy</h2>
              {expandedSections.has("pace") ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("pace") && (
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Race Pace</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {plan.paceStrategy.racePace}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Per kilometer</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Easy Pace</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {plan.paceStrategy.easyPace}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Training intensity</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Tempo Pace</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {plan.paceStrategy.tempoPace}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Threshold training</p>
                  </div>
                </div>

                {plan.paceStrategy.splits && plan.paceStrategy.splits.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Terrain-Adjusted Splits</h3>
                    <div className="space-y-2">
                      {plan.paceStrategy.splits.map((split, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">km {split.km}</p>
                            <p className="text-sm text-gray-600">{split.advice}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{split.targetPace}</p>
                            <p className="text-xs text-gray-500 capitalize">{split.terrainType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fuel Plan Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection("fuel")}
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <h2 className="text-xl font-bold text-gray-900">Fuel Plan</h2>
              {expandedSections.has("fuel") ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("fuel") && (
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Carbs per Hour</p>
                    <p className="text-2xl font-bold text-green-600">
                      {plan.fuelPlan.carbsPerHour}g
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Total Carbs</p>
                    <p className="text-2xl font-bold text-green-600">
                      {plan.fuelPlan.totalCarbs}g
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Gels Needed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {plan.fuelPlan.gelsNeeded}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Calories</p>
                    <p className="text-2xl font-bold text-green-600">
                      {plan.fuelPlan.totalCalories}
                    </p>
                  </div>
                </div>

                {plan.fuelPlan.schedule && plan.fuelPlan.schedule.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Fuel Schedule</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {plan.fuelPlan.schedule.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">
                                km {item.km} • {item.time}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">{item.action}</p>
                              {item.note && (
                                <p className="text-xs text-gray-500 mt-1">💡 {item.note}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan Notes */}
          {plan.notes && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="font-semibold text-gray-800 mb-3">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{plan.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap pb-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save to Dashboard
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/race/new")}
              className="px-8 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Builder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
