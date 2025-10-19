/**
 * Race Input Form Component
 * Handles distance, time, and unit inputs
 */

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, RotateCcw, Calculator } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CalculatorModal from "@/features/pace-calculator/components/CalculatorModal";
import { PRESET_DISTANCES } from "../types";
import type { PaceInputs, FormErrors } from "../types";

interface RaceInputFormProps {
  inputs: PaceInputs;
  errors: FormErrors;
  onInputChange: (e: { target: { name: string; value: string } }) => void;
  onPresetClick: (distance: number) => void;
  onCalculate: () => void;
  onReset: () => void;
  isCalculating: boolean;
  isEmpty: boolean;
}

export function RaceInputForm({
  inputs,
  errors,
  onInputChange,
  onPresetClick,
  onCalculate,
  onReset,
  isCalculating,
  isEmpty,
}: RaceInputFormProps) {
  const isKm = inputs.units === "km";

  const handleUnitToggle = () => {
    onInputChange({
      target: {
        name: "units",
        value: isKm ? "miles" : "km",
      },
    });
  };

  return (
    <Card className="shadow-lg w-full mx-auto pb-12">
      <div className="bg-gradient-to-r from-blue-300 to-blue-800 p-4">
        <h2 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
          <span className="text-4xl mr-2">⏱️</span>
          TrainPace
        </h2>
      </div>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center relative">
          Pace Calculator
          <div className="absolute right-2 ml-4">
            <CalculatorModal />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {/* Preset Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6 w-full">
          {PRESET_DISTANCES.map((preset) => (
            <TooltipProvider key={preset.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      inputs.distance === preset.distance.toString()
                        ? "default"
                        : "outline"
                    }
                    onClick={() => onPresetClick(preset.distance)}
                    className="w-full transition-all hover:scale-105"
                  >
                    {preset.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{preset.distance} km</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distance Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Race Distance</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]+"
                  placeholder="Distance"
                  name="distance"
                  min="0"
                  max="250"
                  value={inputs.distance}
                  onChange={onInputChange}
                  className={`w-4/5 ${errors.distance ? "border-red-500" : ""}`}
                />
                <div
                  className="relative w-40 h-10 bg-blue-100 rounded-full cursor-pointer overflow-hidden"
                  onClick={handleUnitToggle}
                >
                  {/* Sliding Indicator */}
                  <div
                    className={`absolute top-1 left-1 w-[calc(50%-0.25rem)] h-8 bg-blue-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                      !isKm ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                  {/* Labels */}
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className={`w-1/2 text-center font-medium transition-colors ${
                        isKm ? "text-white" : "text-blue-700"
                      }`}
                    >
                      KM
                    </div>
                    <div
                      className={`w-1/2 text-center font-medium transition-colors ${
                        !isKm ? "text-white" : "text-blue-700"
                      }`}
                    >
                      MI
                    </div>
                  </div>
                </div>
              </div>
              {errors.distance && (
                <p className="text-red-500 text-sm">{errors.distance}</p>
              )}
            </div>

            {/* Time Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Race Time</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-2">
                  <Input
                    type="number"
                    inputMode="tel"
                    placeholder="HH"
                    name="hours"
                    min="0"
                    max="99"
                    value={inputs.hours}
                    onChange={onInputChange}
                    className={`pr-10 flex-1 ${
                      errors.time ? "border-red-500" : ""
                    }`}
                  />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <span>:</span>
                <Input
                  type="number"
                  inputMode="tel"
                  placeholder="MM"
                  name="minutes"
                  min="0"
                  max="59"
                  value={inputs.minutes}
                  onChange={onInputChange}
                  className={`flex-1 ${errors.time ? "border-red-500" : ""}`}
                />
                <span>:</span>
                <Input
                  type="number"
                  inputMode="tel"
                  placeholder="SS"
                  name="seconds"
                  min="0"
                  max="59"
                  value={inputs.seconds}
                  onChange={onInputChange}
                  className={`flex-1 ${errors.time ? "border-red-500" : ""}`}
                />
              </div>
              {errors.time && (
                <p className="text-red-500 text-sm">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Pace Type Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-1/2">
              Display paces in:
            </label>
            <select
              value={inputs.paceType}
              onChange={onInputChange}
              name="paceType"
              className="w-1/2 border rounded-md p-2 bg-white"
            >
              <option value="km">min/km</option>
              <option value="Miles">min/mile</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onCalculate}
              className="flex-1"
              disabled={isCalculating}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              disabled={isEmpty}
              className="w-fit"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
