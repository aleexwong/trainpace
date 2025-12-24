/**
 * Step 3: Training Preferences
 * Training days, workout types, and philosophy
 */

import { Settings, Calendar, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Step3Data, WorkoutType, TrainingPhilosophy } from "../types";

interface Step3PreferencesFormProps {
  data: Step3Data;
  errors?: {
    trainingDaysPerWeek?: string;
    preferredWorkouts?: string;
  };
  onChange: (updates: Partial<Step3Data>) => void;
}

const TRAINING_DAYS_OPTIONS = [3, 4, 5, 6, 7];

const WORKOUT_TYPES: Array<{ value: WorkoutType; label: string; description: string }> = [
  { value: "tempo", label: "Tempo Runs", description: "Comfortably hard efforts" },
  { value: "intervals", label: "Intervals", description: "Speed & VO2 max work" },
  { value: "hills", label: "Hill Repeats", description: "Strength & power" },
  { value: "fartlek", label: "Fartlek", description: "Unstructured speed play" },
];

const TRAINING_PHILOSOPHIES: Array<{
  value: TrainingPhilosophy;
  label: string;
  description: string;
}> = [
  {
    value: "balanced",
    label: "Balanced",
    description: "Mix of endurance and speed",
  },
  {
    value: "speed",
    label: "Speed Focused",
    description: "More intervals and tempo",
  },
  {
    value: "endurance",
    label: "Endurance Focused",
    description: "Emphasize long runs and base",
  },
];

export function Step3PreferencesForm({
  data,
  errors,
  onChange,
}: Step3PreferencesFormProps) {
  const toggleWorkoutType = (workoutType: WorkoutType) => {
    const current = data.preferredWorkouts;
    const updated = current.includes(workoutType)
      ? current.filter((t) => t !== workoutType)
      : [...current, workoutType];
    onChange({ preferredWorkouts: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Settings className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">Training Preferences</h3>
        <p className="text-gray-600">Customize your training style</p>
      </div>

      {/* Training Days Per Week */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Training Days Per Week
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {TRAINING_DAYS_OPTIONS.map((days) => (
            <Button
              key={days}
              type="button"
              variant={data.trainingDaysPerWeek === days ? "default" : "outline"}
              onClick={() => onChange({ trainingDaysPerWeek: days })}
              className={`h-16 text-xl font-bold transition-all hover:scale-105 ${
                data.trainingDaysPerWeek === days
                  ? "ring-2 ring-blue-400 bg-blue-600"
                  : ""
              }`}
            >
              {days}
            </Button>
          ))}
        </div>
        {errors?.trainingDaysPerWeek && (
          <p className="text-sm text-red-600">{errors.trainingDaysPerWeek}</p>
        )}
      </div>

      {/* Long Run Day */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Preferred Long Run Day</Label>
        <Select
          value={data.longRunDay}
          onValueChange={(value: "saturday" | "sunday" | "flexible") =>
            onChange({ longRunDay: value })
          }
        >
          <SelectTrigger className="h-12 text-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saturday">Saturday</SelectItem>
            <SelectItem value="sunday">Sunday</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cross Training */}
      <div className="space-y-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  Include Cross Training
                </Label>
                <p className="text-sm text-gray-600">
                  Low-impact activities like cycling or swimming
                </p>
              </div>
              <Switch
                checked={data.includeCrossTraining}
                onCheckedChange={(checked) =>
                  onChange({ includeCrossTraining: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferred Workout Types */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Preferred Workout Types
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {WORKOUT_TYPES.map((workout) => (
            <Card
              key={workout.value}
              className={`cursor-pointer transition-all hover:scale-105 ${
                data.preferredWorkouts.includes(workout.value)
                  ? "ring-2 ring-blue-400 bg-blue-50"
                  : ""
              }`}
              onClick={() => toggleWorkoutType(workout.value)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      data.preferredWorkouts.includes(workout.value)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {data.preferredWorkouts.includes(workout.value) && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{workout.label}</div>
                    <div className="text-xs text-gray-600">{workout.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {errors?.preferredWorkouts && (
          <p className="text-sm text-red-600">{errors.preferredWorkouts}</p>
        )}
      </div>

      {/* Training Philosophy */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Training Philosophy</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TRAINING_PHILOSOPHIES.map((philosophy) => (
            <Button
              key={philosophy.value}
              type="button"
              variant={
                data.trainingPhilosophy === philosophy.value ? "default" : "outline"
              }
              onClick={() => onChange({ trainingPhilosophy: philosophy.value })}
              className={`h-auto py-4 flex flex-col items-start transition-all hover:scale-105 ${
                data.trainingPhilosophy === philosophy.value
                  ? "ring-2 ring-blue-400 bg-blue-600"
                  : ""
              }`}
            >
              <span className="font-bold">{philosophy.label}</span>
              <span className="text-xs text-left opacity-90 mt-1">
                {philosophy.description}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
