/**
 * OnboardingFlow — 3-step wizard captured after signup.
 *   1. Recent race (current fitness)
 *   2. Goal race (target) with a feasibility hint
 *   3. Choose which tools the goal drives (all on by default)
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { calculateVdot, predictRaceTime, formatTime } from "@/features/vdot-calculator/vdot-math";

import { useTrainingGoals } from "../hooks/useTrainingGoals";
import {
  ALL_INTEGRATIONS,
  INTEGRATION_LABELS,
  type GoalIntegration,
  type RaceEntry,
} from "../types";
import { RaceEntryFields, type RaceFormState } from "./RaceEntryFields";

const emptyRaceForm: RaceFormState = {
  distanceMeters: 0,
  distanceName: "",
  hours: "",
  minutes: "",
  seconds: "",
};

function formToSeconds(f: RaceFormState): number {
  const h = parseInt(f.hours || "0", 10);
  const m = parseInt(f.minutes || "0", 10);
  const s = parseInt(f.seconds || "0", 10);
  return h * 3600 + m * 60 + s;
}

function isValidRace(f: RaceFormState): boolean {
  const m = parseInt(f.minutes || "0", 10);
  const s = parseInt(f.seconds || "0", 10);
  return f.distanceMeters > 0 && formToSeconds(f) > 0 && m < 60 && s < 60;
}

function formToEntry(f: RaceFormState): RaceEntry {
  return {
    distanceName: f.distanceName,
    distanceMeters: f.distanceMeters,
    totalSeconds: formToSeconds(f),
  };
}

export function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { goals, loading, saveGoals } = useTrainingGoals(user?.uid);

  const [step, setStep] = useState(1);
  const [recent, setRecent] = useState<RaceFormState>(emptyRaceForm);
  const [goal, setGoal] = useState<RaceFormState>(emptyRaceForm);
  const [enabled, setEnabled] = useState<GoalIntegration[]>(ALL_INTEGRATIONS);
  const [saving, setSaving] = useState(false);

  // Pre-fill when editing an existing profile.
  useEffect(() => {
    if (!goals) return;
    const toForm = (e: RaceEntry): RaceFormState => {
      const total = e.totalSeconds;
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      return {
        distanceMeters: e.distanceMeters,
        distanceName: e.distanceName,
        hours: h > 0 ? String(h) : "",
        minutes: String(m),
        seconds: String(s),
      };
    };
    setRecent(toForm(goals.recentRace));
    setGoal(toForm(goals.goalRace));
    setEnabled(goals.enabledIntegrations ?? ALL_INTEGRATIONS);
  }, [goals]);

  // Feasibility hint: what does current fitness predict for the goal distance?
  const feasibility = useMemo(() => {
    if (!isValidRace(recent) || !goal.distanceMeters) return null;
    const vdot = calculateVdot(recent.distanceMeters, formToSeconds(recent));
    if (!isFinite(vdot) || vdot < 10 || vdot > 100) return null;
    const predicted = predictRaceTime(vdot, goal.distanceMeters);
    return formatTime(predicted);
  }, [recent, goal.distanceMeters]);

  const toggleIntegration = (key: GoalIntegration) => {
    setEnabled((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!isValidRace(recent) || !isValidRace(goal)) return;
    setSaving(true);
    try {
      await saveGoals({
        recentRace: formToEntry(recent),
        goalRace: formToEntry(goal),
        paceUnit: "km",
        enabledIntegrations: enabled,
        onboardingCompleted: true,
      });
      toast({
        title: "Goals saved! 🎯",
        description: "Your tools are now personalized to your goal.",
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to save goals:", err);
      toast({
        title: "Couldn't save your goals",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const skip = () => navigate("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <Helmet>
        <title>Set Your Goals | TrainPace</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Let's set your goals
          </h1>
          <p className="mt-2 text-gray-600">
            Tell us where you are and where you're headed — we'll personalize
            every tool to match.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 w-10 rounded-full ${
                step >= n ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <Card className="bg-white">
          <CardContent className="p-6">
            {loading && user ? (
              <p className="text-center text-gray-500">Loading…</p>
            ) : step === 1 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your recent race
                  </h2>
                  <p className="text-sm text-gray-600">
                    A recent result tells us your current fitness.
                  </p>
                </div>
                <RaceEntryFields
                  value={recent}
                  onChange={setRecent}
                  idPrefix="recent"
                />
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={skip}>
                    Skip for now
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!isValidRace(recent)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your goal race
                  </h2>
                  <p className="text-sm text-gray-600">
                    The race you're training toward.
                  </p>
                </div>
                <RaceEntryFields
                  value={goal}
                  onChange={setGoal}
                  idPrefix="goal"
                />
                {feasibility && (
                  <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    Your current fitness predicts about{" "}
                    <strong>{feasibility}</strong> for {goal.distanceName}.
                  </p>
                )}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!isValidRace(goal)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Where should your goal show up?
                  </h2>
                  <p className="text-sm text-gray-600">
                    All on by default — uncheck anything you'd rather keep blank.
                  </p>
                </div>
                <div className="space-y-2">
                  {ALL_INTEGRATIONS.map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={enabled.includes(key)}
                        onChange={() => toggleIntegration(key)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        <span className="block font-medium text-gray-900">
                          {INTEGRATION_LABELS[key].label}
                        </span>
                        <span className="block text-sm text-gray-600">
                          {INTEGRATION_LABELS[key].description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save goals"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
