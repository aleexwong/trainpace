/**
 * Fuel Planner - Core Types & Constants
 */

export const RACE_SETTINGS = {
  "10K": 30,
  Half: 45,
  Full: 75,
} as const;

export type RaceType = keyof typeof RACE_SETTINGS;

// Upper limit on carbs/hour per race. Marathon plans go up to 100g/hr —
// the practical ceiling of modern glucose+fructose fueling — for runners
// whose guts can handle it; shorter races cap at 90g/hr.
export const MAX_CARBS_PER_HOUR: Record<RaceType, number> = {
  "10K": 90,
  Half: 90,
  Full: 100,
};

export const MIN_CARBS_PER_HOUR = 30;

// Race distances in km for fuel stop calculations
export const RACE_DISTANCES: Record<RaceType, number> = {
  "10K": 10,
  Half: 21.1,
  Full: 42.2,
};

export interface FuelStop {
  time: string; // e.g. "0:20"
  distance: string; // e.g. "5.2km"
  distanceKm: number;
  carbsNeeded: number;
  suggestion: string;
}

export interface FuelPlanResult {
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
  fuelStops: FuelStop[];
}

export interface FuelPlanInputs {
  raceType: RaceType;
  weight: string;
  timeHours: string;
  timeMinutes: string;
  carbsPerHour?: number;
}

export interface AIRecommendation {
  headline: string;
  detail: string;
}

export interface FuelContextPreset {
  id: string;
  icon: string;
  label: string;
  value: string;
}

export const FUEL_CONTEXT_PRESETS: FuelContextPreset[] = [
  {
    id: "bonking-late",
    icon: "😰",
    label: "Bonking late",
    value: "I typically bonk around the 30-32km mark with sudden energy crashes.",
  },
  {
    id: "gi-issues",
    icon: "🤢",
    label: "GI issues",
    value: "I experience nausea and stomach cramps when I take gels.",
  },
  {
    id: "hot-weather",
    icon: "🌡️",
    label: "Hot weather",
    value: "I'm racing in hot conditions (26°C/80°F+) and tend to sweat heavily.",
  },
  {
    id: "first-timer",
    icon: "🎯",
    label: "First timer",
    value: "This is my first time racing this distance and I need a beginner-friendly fueling approach.",
  },
  {
    id: "real-food",
    icon: "🍌",
    label: "Prefer real food",
    value: "I prefer real food like bananas or energy bars instead of gels.",
  },
  {
    id: "no-appetite",
    icon: "😐",
    label: "No appetite",
    value: "I lose my appetite during runs and struggle to force food down.",
  },
  {
    id: "caffeine",
    icon: "☕",
    label: "Caffeine sensitive",
    value: "Caffeine makes me jittery or causes GI issues.",
  },
  {
    id: "fasted",
    icon: "⏰",
    label: "Train fasted",
    value: "I usually train fasted and need help transitioning to race-day fueling.",
  },
];

// Common fuel products for reference section
export interface FuelProduct {
  name: string;
  carbs: number;
}

export const FUEL_PRODUCTS: FuelProduct[] = [
  { name: "GU Gel", carbs: 22 },
  { name: "Maurten Gel", carbs: 25 },
  { name: "SiS Go Gel", carbs: 22 },
  { name: "Clif Bloks (3)", carbs: 24 },
  { name: "Banana", carbs: 27 },
  { name: "Gatorade (500ml)", carbs: 30 },
];

// Calculation constants
export const CALORIES_PER_GRAM_CARB = 4;
export const CARBS_PER_KG_MULTIPLIER = 0.7; // 0.7g carbs per kg body weight per hour
export const GELS_PER_HOUR = 1.5;
export const MAX_GELS = 7;
export const MIN_10K_TIME_FOR_GEL = 0.75; // 45 minutes in hours
export const AI_COOLDOWN_SECONDS = 30;
export const LBS_TO_KG = 0.453592; // Conversion factor

// Fuel stop timing constants
export const FUEL_INTERVAL_MINUTES = 20; // Take fuel every 20 minutes
export const MIN_RACE_TIME_FOR_FUELING = 60; // Only generate stops for races > 1 hour
