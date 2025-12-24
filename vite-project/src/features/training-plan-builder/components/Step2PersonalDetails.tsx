/**
 * Step 2: Personal Details
 * Experience level, current fitness, and available weeks
 */

import { User, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Step2Data, ExperienceLevel, TrainingDistance } from "../types";
import { getMinWeeksRequired } from "../utils/validation";

interface Step2PersonalDetailsProps {
  data: Step2Data;
  distance: TrainingDistance;
  errors?: {
    experienceLevel?: string;
    currentWeeklyMileage?: string;
    longestRecentRun?: string;
    availableWeeks?: string;
  };
  onChange: (updates: Partial<Step2Data>) => void;
}

const EXPERIENCE_LEVELS: Array<{
  value: ExperienceLevel;
  label: string;
  description: string;
}> = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to running or returning after a break",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Running regularly for several months",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Experienced runner with solid base",
  },
];

export function Step2PersonalDetails({
  data,
  distance,
  errors,
  onChange,
}: Step2PersonalDetailsProps) {
  const minWeeks = getMinWeeksRequired(data.experienceLevel, distance);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">About You</h3>
        <p className="text-gray-600">Tell us about your current fitness level</p>
      </div>

      {/* Experience Level */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Experience Level</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXPERIENCE_LEVELS.map((level) => (
            <Button
              key={level.value}
              type="button"
              variant={data.experienceLevel === level.value ? "default" : "outline"}
              onClick={() => onChange({ experienceLevel: level.value })}
              className={`h-auto py-4 flex flex-col items-start transition-all hover:scale-105 ${
                data.experienceLevel === level.value
                  ? "ring-2 ring-blue-400 bg-blue-600"
                  : ""
              }`}
            >
              <span className="font-bold text-lg">{level.label}</span>
              <span className="text-xs text-left opacity-90 mt-1">
                {level.description}
              </span>
            </Button>
          ))}
        </div>
        {errors?.experienceLevel && (
          <p className="text-sm text-red-600">{errors.experienceLevel}</p>
        )}
      </div>

      {/* Current Weekly Mileage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Current Weekly Mileage
          </Label>
          <span className="text-2xl font-bold text-blue-600">
            {data.currentWeeklyMileage} km
          </span>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Slider
              value={[data.currentWeeklyMileage]}
              onValueChange={([value]) =>
                onChange({ currentWeeklyMileage: value })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </CardContent>
        </Card>
        {errors?.currentWeeklyMileage && (
          <p className="text-sm text-red-600">{errors.currentWeeklyMileage}</p>
        )}
      </div>

      {/* Longest Recent Run */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Longest Recent Run (last 4 weeks)
          </Label>
          <span className="text-2xl font-bold text-blue-600">
            {data.longestRecentRun} km
          </span>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Slider
              value={[data.longestRecentRun]}
              onValueChange={([value]) =>
                onChange({ longestRecentRun: value })
              }
              min={0}
              max={40}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 km</span>
              <span>20 km</span>
              <span>40 km</span>
            </div>
          </CardContent>
        </Card>
        {errors?.longestRecentRun && (
          <p className="text-sm text-red-600">{errors.longestRecentRun}</p>
        )}
      </div>

      {/* Available Weeks */}
      <div className="space-y-3">
        <Label htmlFor="availableWeeks" className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Training Duration (weeks)
        </Label>
        <Input
          id="availableWeeks"
          type="number"
          value={data.availableWeeks}
          onChange={(e) =>
            onChange({ availableWeeks: parseInt(e.target.value) || 0 })
          }
          min={minWeeks}
          max={30}
          className="text-lg h-12"
        />
        <p className="text-sm text-gray-600">
          Minimum {minWeeks} weeks recommended for {data.experienceLevel} {distance} training
        </p>
        {errors?.availableWeeks && (
          <p className="text-sm text-red-600">{errors.availableWeeks}</p>
        )}
      </div>
    </div>
  );
}
