/**
 * Race Builder Page
 *
 * Copy this to: src/pages/RaceBuilder.tsx
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Zap } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useRacePlanGeneration } from "@/features/race/hooks/useRacePlanGeneration";
import {
  RACE_TYPE_DISTANCES,
  RACE_TYPE_LABELS,
  type RaceType,
} from "@/features/race";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RaceBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generateRacePlan, validateInputs, generating, error } =
    useRacePlanGeneration();

  // Form state
  const [name, setName] = useState("");
  const [raceType, setRaceType] = useState<RaceType>("Full");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("00");
  const [notes, setNotes] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // User's routes
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load user's routes
  useEffect(() => {
    if (user) {
      loadUserRoutes();
    }
  }, [user]);

  const loadUserRoutes = async () => {
    if (!user) return;

    try {
      setLoadingRoutes(true);
      const q = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("deleted", "==", false)
      );

      const snapshot = await getDocs(q);
      const routes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserRoutes(routes);
    } catch (err) {
      console.error("Error loading routes:", err);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const inputs = {
      name,
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

    // Validate
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

      routeData = {
        routeId: selectedRouteId,
        routeMetadata: {
          name: route.metadata.routeName,
          distance: route.metadata.totalDistance,
          elevationGain: route.metadata.elevationGain,
          hasElevationData: route.metadata.hasElevationData || false,
        },
      };
    } else {
      // Manual route
      routeData = {
        routeId: null,
        routeMetadata: {
          name: `${name} Course`,
          distance: RACE_TYPE_DISTANCES[raceType],
          elevationGain: 0,
          hasElevationData: false,
        },
      };
    }

    // Generate!
    const planId = await generateRacePlan(inputs, routeData);

    if (planId) {
      navigate("/dashboard");
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to create race plans.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Helmet>
        <title>Create Race Plan | TrainPace</title>
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Create Race Plan
        </h1>
        <p className="text-gray-600">
          Generate a complete race strategy with pacing and fueling
          recommendations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Race Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Race Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="NYC Marathon 2025"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Race Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Race Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(RACE_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRaceType(key as RaceType)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  raceType === key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Route Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Route (Optional)
          </label>
          {loadingRoutes ? (
            <p className="text-gray-500 text-sm">Loading your routes...</p>
          ) : userRoutes.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-2">
                No routes found. Using standard {RACE_TYPE_LABELS[raceType]}{" "}
                distance ({RACE_TYPE_DISTANCES[raceType]}km).
              </p>
              <a
                href="/elevation-finder"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Upload a GPX file →
              </a>
            </div>
          ) : (
            <select
              value={selectedRouteId || ""}
              onChange={(e) => setSelectedRouteId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use standard distance</option>
              {userRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.metadata.routeName} (
                  {route.metadata.totalDistance.toFixed(1)}km)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Target Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Time *
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Hours"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Hours</p>
            </div>
            <div>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="Minutes"
                min="0"
                max="59"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Minutes</p>
            </div>
            <div>
              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="Seconds"
                min="0"
                max="59"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Seconds</p>
            </div>
          </div>
        </div>

        {/* Race Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Race Date (Optional)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Race goals, conditions, gear notes..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Generate Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Race Plan
              </>
            )}
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
