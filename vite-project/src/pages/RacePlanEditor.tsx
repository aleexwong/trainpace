import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { useRacePlans } from "@/features/race/hooks/useRacePlans";
import type { RacePlan, RaceStatus } from "@/features/race/types";
import { calculatePaceStrategy, parseTimeToMinutes, formatTimeFromMinutes } from "@/features/race/utils/paceCalculations";
import { calculateFuelPlan } from "@/features/race/utils/fuelSchedule";

export default function RacePlanEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { racePlans, updateRacePlan } = useRacePlans();

  const existing = useMemo(
    () => racePlans.find((p) => p.id === id),
    [racePlans, id]
  );

  const [loading, setLoading] = useState(!existing);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState(""); // yyyy-mm-dd
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<RaceStatus>("draft");
  const [targetHours, setTargetHours] = useState<string>("0");
  const [targetMinutes, setTargetMinutes] = useState<string>("0");
  const [targetSeconds, setTargetSeconds] = useState<string>("0");
  const [pendingRegeneration, setPendingRegeneration] = useState<
    | {
        targetTime: number;
        paceStrategy: RacePlan["paceStrategy"];
        fuelPlan: RacePlan["fuelPlan"];
      }
    | null
  >(null);

  useEffect(() => {
    if (!user) return;
    if (existing) {
      hydrateFromPlan(existing);
      setLoading(false);
      return;
    }

    // Fallback: fetch single document if not in state yet
    if (id) {
      (async () => {
        try {
          setLoading(true);
          const ref = doc(db, "user_race_plans", id);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            throw new Error("Race plan not found");
          }
          const data = snap.data();
          const plan: RacePlan = {
            id: snap.id,
            ...(data as any),
            // Convert Firestore Timestamp to Date for local usage
            date: data.date?.toDate ? data.date.toDate() : data.date ?? null,
          };
          hydrateFromPlan(plan);
        } catch (e) {
          console.error(e);
          setError(e instanceof Error ? e.message : "Failed to load plan");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, existing, user]);

  function hydrateFromPlan(plan: RacePlan) {
    setName(plan.name || "");
    setDate(plan.date ? toInputDate(plan.date) : "");
    setNotes(plan.notes || "");
    setStatus(plan.status);
    // Decompose targetTime (minutes) to H/M/S strings
    const totalMinutes = plan.targetTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutesWhole = Math.floor(totalMinutes % 60);
    const seconds = Math.round((totalMinutes % 1) * 60);
    setTargetHours(String(hours));
    setTargetMinutes(String(minutesWhole));
    setTargetSeconds(String(seconds));
  }

  function toInputDate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function handleSave() {
    if (!id) return;
    try {
      const updates: Partial<RacePlan> = {
        name: name.trim(),
        notes: notes.trim() || undefined,
        status,
        // Convert to Date (or null) for our local type. The hook will convert to Timestamp.
        date: date ? new Date(date) : null,
      };
      await updateRacePlan(id, updates);
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to save changes");
    }
  }

  async function handleRegenerate() {
    if (!id || !existing) return;
    try {
      const newTargetTime = parseTimeToMinutes(
        Number(targetHours || 0),
        Number(targetMinutes || 0),
        Number(targetSeconds || 0)
      );
      if (newTargetTime <= 0) {
        setError("Please enter a valid target time");
        return;
      }

      const distance = existing.routeMetadata.distance;
      const paceStrategy = calculatePaceStrategy({
        distance,
        targetTime: newTargetTime,
      });
      const fuelPlan = calculateFuelPlan({
        distance,
        targetTime: newTargetTime,
        raceType: existing.raceType,
      });

      // Store as pending preview; do not persist yet
      setPendingRegeneration({
        targetTime: newTargetTime,
        paceStrategy,
        fuelPlan,
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to regenerate plan");
    }
  }

  async function handleApplyRegeneration() {
    if (!id || !pendingRegeneration) return;
    try {
      await updateRacePlan(id, {
        targetTime: pendingRegeneration.targetTime,
        paceStrategy: pendingRegeneration.paceStrategy,
        fuelPlan: pendingRegeneration.fuelPlan,
      });
      setPendingRegeneration(null);
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to apply changes");
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to edit race plans.</p>
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
    <div className="max-w-3xl mx-auto p-6">
      <Helmet>
        <title>Edit Race Plan | TrainPace</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Edit Race Plan</h1>
        <Link
          to="/dashboard"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading plan...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Boston Marathon 2025"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Race Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RaceStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Target Time (for regeneration) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Time (for re-generation)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  min={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Hours</p>
              </div>
              <div>
                <input
                  type="number"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(e.target.value)}
                  min={0}
                  max={59}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Minutes</p>
              </div>
              <div>
                <input
                  type="number"
                  value={targetSeconds}
                  onChange={(e) => setTargetSeconds(e.target.value)}
                  min={0}
                  max={59}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Seconds</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Current route distance: {existing?.routeMetadata.distance.toFixed(1)} km
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Race goals, conditions, gear notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Pending Regeneration Preview */}
          {pendingRegeneration && existing && (
            <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3">
                Preview Updated Plan — Review and Confirm
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-md border p-3">
                  <p className="text-gray-500 mb-2">Target Time</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      Current: {formatTimeFromMinutes(existing.targetTime)}
                    </span>
                    <span className="text-green-700 font-medium">
                      New: {formatTimeFromMinutes(pendingRegeneration.targetTime)}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-md border p-3">
                  <p className="text-gray-500 mb-2">Race Pace</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      Current: {existing.paceStrategy.racePace}
                    </span>
                    <span className="text-green-700 font-medium">
                      New: {pendingRegeneration.paceStrategy.racePace}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-600">
                      Current easy: {existing.paceStrategy.easyPace}
                    </span>
                    <span className="text-green-700 font-medium">
                      New easy: {pendingRegeneration.paceStrategy.easyPace}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-600">
                      Current tempo: {existing.paceStrategy.tempoPace}
                    </span>
                    <span className="text-green-700 font-medium">
                      New tempo: {pendingRegeneration.paceStrategy.tempoPace}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-md border p-3 md:col-span-2">
                  <p className="text-gray-500 mb-2">Fuel Plan Summary</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Carbs/hr</div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{existing.fuelPlan.carbsPerHour}g</span>
                        <span className="text-green-700 font-medium">{pendingRegeneration.fuelPlan.carbsPerHour}g</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Gels</div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{existing.fuelPlan.gelsNeeded}</span>
                        <span className="text-green-700 font-medium">{pendingRegeneration.fuelPlan.gelsNeeded}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Carbs</div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{existing.fuelPlan.totalCarbs}g</span>
                        <span className="text-green-700 font-medium">{pendingRegeneration.fuelPlan.totalCarbs}g</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Schedule Items</div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{existing.fuelPlan.schedule.length}</span>
                        <span className="text-green-700 font-medium">{pendingRegeneration.fuelPlan.schedule.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleApplyRegeneration}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  Apply Changes
                </button>
                <button
                  onClick={() => setPendingRegeneration(null)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={handleRegenerate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Regenerate Pace & Fuel
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
