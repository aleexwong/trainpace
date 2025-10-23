/**
 * Race Builder Page - 1-Click Race Hub Generator
 *
 * Minimal friction design:
 * - Quick-pick: Race type → Time → Generate
 * - Inline preview with instant save
 * - GPX route toggle with smart distance snapping
 * - Smart auto-naming (no manual entry needed)
 * - Single time field accepting flexible HH:MM:SS format
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Zap, Check, X, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useRacePlanGeneration } from "@/features/race/hooks/useRacePlanGeneration";
import {
  RACE_TYPE_DISTANCES,
  RACE_TYPE_LABELS,
  type RaceType,
  type RacePlan,
} from "@/features/race";
import { formatTimeFromMinutes } from "@/features/race/utils/paceCalculations";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Parse time string into { hours, minutes, seconds }
const parseTimeString = (timeStr: string) => {
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  let hours = 0,
    minutes = 0,
    seconds = 0;

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length !== 3) return null;

    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseInt(parts[2], 10);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      isNaN(seconds) ||
      hours < 0 ||
      minutes < 0 ||
      seconds < 0 ||
      minutes > 59 ||
      seconds > 59
    ) {
      return null;
    }

    return {
      hours: String(hours),
      minutes: String(minutes),
      seconds: String(seconds),
    };
  }

  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num < 0) return null;

  if (trimmed.length === 1 || trimmed.length === 2) {
    hours = num;
  } else if (trimmed.length === 3 || trimmed.length === 4) {
    minutes = num % 100;
    hours = Math.floor(num / 100);
  } else if (trimmed.length === 5) {
    seconds = num % 100;
    minutes = Math.floor(num / 100) % 100;
    hours = Math.floor(num / 10000);
  } else {
    return null;
  }

  if (minutes > 59 || seconds > 59) {
    return null;
  }

  return {
    hours: String(hours),
    minutes: String(minutes),
    seconds: String(seconds),
  };
};

// Format time into human-readable string
const formatTimeReadable = (timeStr: string): string => {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return "";

  const h = parseInt(parsed.hours, 10);
  const m = parseInt(parsed.minutes, 10);
  const s = parseInt(parsed.seconds, 10);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
  if (s > 0) parts.push(`${s} second${s !== 1 ? "s" : ""}`);

  return parts.join(" ");
};

// Smart-snap race type based on GPX distance
const smartSnapRaceType = (distanceKm: number): RaceType => {
  if (distanceKm >= 40 && distanceKm <= 43) return "Full";
  if (distanceKm >= 20 && distanceKm <= 22) return "Half";
  if (distanceKm >= 9 && distanceKm <= 11) return "10K";
  if (distanceKm >= 4.5 && distanceKm <= 5.5) return "5K";
  return "Custom";
};

export default function RaceBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generateRacePlan, validateInputs, creating, error, createRacePlan } =
    useRacePlanGeneration();

  // Generated plan state
  const [generatedPlan, setGeneratedPlan] = useState<
    | (Omit<RacePlan, "id" | "userId" | "createdAt" | "updatedAt"> & {
        tempId: string;
      })
    | null
  >(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state
  const [raceType, setRaceType] = useState<RaceType>("Full");
  const [timeInput, setTimeInput] = useState("");
  const [useGpxRoute, setUseGpxRoute] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // User routes state
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Expanded sections for preview
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["pace", "fuel"])
  );

  // Load user GPX routes from gpx_uploads collection
  useEffect(() => {
    const loadUserRoutes = async () => {
      if (!user) {
        console.log("[RaceBuilder] No user - skipping route load");
        return;
      }

      console.log("[RaceBuilder] Loading GPX uploads for user:", user.uid);
      setLoadingRoutes(true);
      try {
        const routesQuery = query(
          collection(db, "gpx_uploads"),
          where("userId", "==", user.uid),
          where("deleted", "!=", true)
        );
        const snapshot = await getDocs(routesQuery);

        console.log("[RaceBuilder] GPX uploads snapshot size:", snapshot.size);

        const routes = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("[RaceBuilder] GPX upload data:", { id: doc.id, data });
          return {
            id: doc.id,
            ...data,
          };
        });

        console.log("[RaceBuilder] Total GPX routes loaded:", routes.length);
        setUserRoutes(routes);
      } catch (error) {
        console.error("[RaceBuilder] Error loading GPX uploads:", error);
      } finally {
        setLoadingRoutes(false);
      }
    };

    loadUserRoutes();
  }, [user]);

  // Handle route selection with smart-snap
  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = userRoutes.find((r) => r.id === routeId);

    console.log("[RaceBuilder] Selected route:", route);

    if (route) {
      // Check different possible field names for distance
      const distance =
        route.totalDistanceKm ||
        route.distance ||
        route.metadata?.totalDistance ||
        route.metadata?.distance;

      console.log("[RaceBuilder] Route distance:", distance);

      if (distance) {
        const snappedType = smartSnapRaceType(distance);
        console.log("[RaceBuilder] Smart-snapped to:", snappedType);
        setRaceType(snappedType);
      } else {
        console.warn("[RaceBuilder] No distance found in route data");
      }
    }
  };

  // Generate auto-name based on race type and date
  const generateAutoName = (): string => {
    const dateStr = date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        })
      : "Race";
    return `${RACE_TYPE_LABELS[raceType]} ${dateStr}`;
  };

  const handleGenerate = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const parsedTime = parseTimeString(timeInput);
    if (!parsedTime) {
      alert(
        "Invalid time format. Use: 4 (hours), 430 (4:30), 2450 (2:45:00), 4:30:0, or 2:45:30"
      );
      return;
    }

    const { hours, minutes, seconds } = parsedTime;
    const autoName = generateAutoName();

    const inputs = {
      name: autoName,
      date: date ? new Date(date) : null,
      raceType,
      routeSource: selectedRouteId
        ? ("uploaded" as const)
        : ("manual" as const),
      routeId: selectedRouteId,
      targetTimeHours: hours,
      targetTimeMinutes: minutes,
      targetTimeSeconds: seconds,
      notes,
      goal: "time" as const,
    };

    const validationError = validateInputs(inputs);
    if (validationError) {
      alert(validationError);
      return;
    }

    // Get route data
    let routeData;
    if (selectedRouteId) {
      const route = userRoutes.find((r) => r.id === selectedRouteId);
      if (!route) {
        alert("Selected route not found");
        return;
      }

      // Handle different possible data structures
      const distance =
        route.totalDistanceKm ||
        route.distance ||
        route.metadata?.totalDistance ||
        route.metadata?.distance ||
        RACE_TYPE_DISTANCES[raceType];

      const elevationGain =
        route.elevationGain || route.metadata?.elevationGain || 0;

      const routeName =
        route.raceName ||
        route.name ||
        route.metadata?.routeName ||
        `${autoName} Course`;

      routeData = {
        routeId: selectedRouteId,
        routeMetadata: {
          name: routeName,
          distance: distance,
          elevationGain: elevationGain,
          hasElevationData: elevationGain > 0,
        },
      };
    } else {
      routeData = {
        routeId: null,
        routeMetadata: {
          name: `${autoName} Course`,
          distance: RACE_TYPE_DISTANCES[raceType],
          elevationGain: 0,
          hasElevationData: false,
        },
      };
    }

    console.log("[RaceBuilder] Generating plan with route data:", routeData);

    const plan = await generateRacePlan(inputs, routeData);

    if (plan) {
      setGeneratedPlan(plan);
      setTimeout(() => {
        document.getElementById("plan-preview")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleSave = async () => {
    if (!generatedPlan) return;

    try {
      setSaving(true);
      setSaveError(null);

      const { tempId, ...planData } = generatedPlan;
      const planId = await createRacePlan(planData);

      if (planId) {
        navigate("/dashboard", {
          state: { successMessage: `Race plan "${generatedPlan.name}" saved!` },
        });
      }
    } catch (err) {
      console.error("Error saving race plan:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to save race plan"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setGeneratedPlan(null);
    setSaveError(null);
  };

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setExpandedSections(newSections);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-8">
            Please sign in to create race plans.
          </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Helmet>
        <title>Create Race Plan | TrainPace</title>
      </Helmet>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Race Hub</h1>
          </div>
          <p className="text-gray-600">
            Generate your complete race strategy in seconds
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* 1. Race Type with GPX Toggle */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Race Type
                </label>
                <button
                  onClick={() => {
                    setUseGpxRoute(!useGpxRoute);
                    if (!useGpxRoute) {
                      setSelectedRouteId(null);
                    }
                  }}
                  disabled={!!generatedPlan}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    useGpxRoute
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } ${generatedPlan ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {useGpxRoute ? "Using GPX Route" : "Use My GPX Route"}
                </button>
              </div>

              {/* Race Type Buttons (only show if not using GPX or no route selected) */}
              {(!useGpxRoute || !selectedRouteId) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {Object.entries(RACE_TYPE_LABELS)
                    .filter(([key]) => key !== "Custom")
                    .map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setRaceType(key as RaceType)}
                        disabled={
                          !!generatedPlan || (useGpxRoute && !!selectedRouteId)
                        }
                        className={`px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                          raceType === key
                            ? "bg-blue-600 text-white shadow-md scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        } ${
                          generatedPlan || (useGpxRoute && selectedRouteId)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                </div>
              )}

              {/* GPX Route Selector */}
              {useGpxRoute && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  {loadingRoutes ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Loading your routes...
                    </div>
                  ) : userRoutes.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No GPX routes found. Upload a route in{" "}
                      <button
                        onClick={() => navigate("/elevation-finder")}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Elevation Finder
                      </button>
                      .
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Select Your Route ({userRoutes.length} available)
                      </label>
                      {userRoutes.map((route) => {
                        // Extract distance from various possible fields
                        const distance =
                          route.totalDistanceKm ||
                          route.distance ||
                          route.metadata?.totalDistance ||
                          route.metadata?.distance ||
                          0;

                        const elevationGain =
                          route.elevationGain ||
                          route.metadata?.elevationGain ||
                          0;

                        const routeName =
                          route.raceName ||
                          route.name ||
                          route.metadata?.routeName ||
                          "Unnamed Route";

                        return (
                          <button
                            key={route.id}
                            onClick={() => handleRouteSelect(route.id)}
                            disabled={!!generatedPlan}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              selectedRouteId === route.id
                                ? "border-purple-600 bg-purple-100"
                                : "border-gray-200 bg-white hover:border-purple-300"
                            } ${
                              generatedPlan
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <p className="font-semibold text-gray-800">
                              {routeName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {distance > 0
                                ? `${distance.toFixed(1)} km`
                                : "Distance unknown"}
                              {elevationGain > 0 &&
                                ` • ${elevationGain}m elevation`}
                            </p>
                            {selectedRouteId === route.id && (
                              <p className="text-xs text-purple-600 font-semibold mt-2">
                                ✓ Auto-detected: {RACE_TYPE_LABELS[raceType]}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Target Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Target Time
              </label>
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                disabled={!!generatedPlan}
                placeholder="e.g., 4, 430, 2450, or 4:30:0"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {timeInput && parseTimeString(timeInput) && !generatedPlan && (
                <p className="text-sm font-semibold text-blue-600 mt-2">
                  → {formatTimeReadable(timeInput)}
                </p>
              )}
              {!generatedPlan && (
                <p className="text-xs text-gray-500 mt-2">
                  Format: 4, 430, 2450, 4:30:0, or 2:45:30
                </p>
              )}
            </div>

            {/* 3. Optional Fields (Date & Notes) */}
            {!generatedPlan && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Race Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Race goals, conditions, gear notes..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            {!generatedPlan && (
              <button
                onClick={handleGenerate}
                disabled={creating}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-bold text-lg hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating your race plan...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Generate Race Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* INLINE PREVIEW */}
        {generatedPlan && (
          <div id="plan-preview" className="mt-8 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Target Time
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatTimeFromMinutes(generatedPlan.targetTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Race Pace
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {generatedPlan.paceStrategy.racePace}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Fuel Needed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {generatedPlan.fuelPlan.gelsNeeded} gels
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Total Carbs
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {generatedPlan.fuelPlan.totalCarbs}g
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
                <h2 className="text-xl font-bold text-gray-900">
                  Pace Strategy
                </h2>
                {expandedSections.has("pace") ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.has("pace") && (
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Race Pace</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {generatedPlan.paceStrategy.racePace}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Per kilometer
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Easy Pace</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {generatedPlan.paceStrategy.easyPace}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Training intensity
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Tempo Pace</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {generatedPlan.paceStrategy.tempoPace}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Threshold training
                      </p>
                    </div>
                  </div>
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
                      <p className="text-sm text-gray-500 mb-2">
                        Carbs per Hour
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {generatedPlan.fuelPlan.carbsPerHour}g
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Total Carbs</p>
                      <p className="text-2xl font-bold text-green-600">
                        {generatedPlan.fuelPlan.totalCarbs}g
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Gels Needed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {generatedPlan.fuelPlan.gelsNeeded}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">Calories</p>
                      <p className="text-2xl font-bold text-green-600">
                        {generatedPlan.fuelPlan.totalCalories}
                      </p>
                    </div>
                  </div>

                  {generatedPlan.fuelPlan.schedule &&
                    generatedPlan.fuelPlan.schedule.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">
                          Fuel Schedule
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {generatedPlan.fuelPlan.schedule.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <p className="font-semibold text-gray-800">
                                km {item.km} • {item.time}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                {item.action}
                              </p>
                              {item.note && (
                                <p className="text-xs text-gray-500 mt-1">
                                  💡 {item.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Save Error */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {saveError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={handleReset}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 rounded-lg font-bold text-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Footer link */}
        {!generatedPlan && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
