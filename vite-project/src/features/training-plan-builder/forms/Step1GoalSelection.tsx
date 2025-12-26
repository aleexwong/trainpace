/**
 * Step 1: Goal Selection
 * Select race distance, goal time, and race date
 */

import { Calendar, Target, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Step1Data, TrainingDistance } from "../types";
import { TRAINING_DISTANCES } from "../types";

interface Step1GoalSelectionProps {
  data: Step1Data;
  errors?: {
    distance?: string;
    goalTime?: string;
    raceDate?: string;
  };
  onChange: (updates: Partial<Step1Data>) => void;
}

export function Step1GoalSelection({ data, errors, onChange }: Step1GoalSelectionProps) {
  const handleDistanceSelect = (distance: TrainingDistance) => {
    onChange({ distance });
  };

  const handleTimeChange = (field: keyof Pick<Step1Data, "goalTimeHours" | "goalTimeMinutes" | "goalTimeSeconds">, value: string) => {
    // Allow only numbers
    const numericValue = value.replace(/\D/g, "");
    onChange({ [field]: numericValue });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">Set Your Goal</h3>
        <p className="text-gray-600">
          Choose your race distance, goal time, and race date
        </p>
      </div>

      {/* Distance Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Race Distance</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRAINING_DISTANCES.map((dist) => (
            <Button
              key={dist.name}
              type="button"
              variant={data.distance === dist.label ? "default" : "outline"}
              onClick={() => handleDistanceSelect(dist.label as TrainingDistance)}
              className={`h-20 flex flex-col items-center justify-center transition-all hover:scale-105 ${
                data.distance === dist.label
                  ? "ring-2 ring-blue-400 bg-blue-600"
                  : ""
              }`}
            >
              <span className="text-2xl font-bold">{dist.label}</span>
              <span className="text-xs opacity-75">{dist.distance}km</span>
            </Button>
          ))}
        </div>
        {errors?.distance && (
          <p className="text-sm text-red-600">{errors.distance}</p>
        )}
      </div>

      {/* Goal Time */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Goal Time
        </Label>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-sm text-gray-600">
                  Hours
                </Label>
                <Input
                  id="hours"
                  type="text"
                  inputMode="numeric"
                  value={data.goalTimeHours}
                  onChange={(e) => handleTimeChange("goalTimeHours", e.target.value)}
                  placeholder="0"
                  className="text-center text-2xl font-bold h-16"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes" className="text-sm text-gray-600">
                  Minutes
                </Label>
                <Input
                  id="minutes"
                  type="text"
                  inputMode="numeric"
                  value={data.goalTimeMinutes}
                  onChange={(e) => handleTimeChange("goalTimeMinutes", e.target.value)}
                  placeholder="0"
                  className="text-center text-2xl font-bold h-16"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seconds" className="text-sm text-gray-600">
                  Seconds
                </Label>
                <Input
                  id="seconds"
                  type="text"
                  inputMode="numeric"
                  value={data.goalTimeSeconds}
                  onChange={(e) => handleTimeChange("goalTimeSeconds", e.target.value)}
                  placeholder="0"
                  className="text-center text-2xl font-bold h-16"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {errors?.goalTime && (
          <p className="text-sm text-red-600">{errors.goalTime}</p>
        )}
      </div>

      {/* Race Date */}
      <div className="space-y-3">
        <Label htmlFor="raceDate" className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Race Date
        </Label>
        <Input
          id="raceDate"
          type="date"
          value={data.raceDate}
          onChange={(e) => onChange({ raceDate: e.target.value })}
          min={new Date().toISOString().split("T")[0]}
          className="text-lg h-12"
        />
        {errors?.raceDate && (
          <p className="text-sm text-red-600">{errors.raceDate}</p>
        )}
        {data.raceDate && !errors?.raceDate && (
          <p className="text-sm text-gray-600">
            {(() => {
              const weeks = Math.floor(
                (new Date(data.raceDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24 * 7)
              );
              return `Your race is ${weeks} weeks away`;
            })()}
          </p>
        )}
      </div>
    </div>
  );
}
