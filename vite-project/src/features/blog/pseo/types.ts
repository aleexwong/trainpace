// Programmatic SEO types for auto-generated blog content

export interface PSEOTemplate {
  type: "race-training" | "time-goal" | "distance-topic";
  generateSlug: (params: Record<string, string>) => string;
  generateTitle: (params: Record<string, string>) => string;
  generateExcerpt: (params: Record<string, string>) => string;
  generateContent: (params: Record<string, string>) => string;
  category: import("../types").BlogCategory;
  tags: (params: Record<string, string>) => string[];
}

export interface RaceData {
  key: string;
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  raceDate: string;
  description: string;
  tips: string[];
  paceStrategy: {
    type: string;
    summary: string;
    segments: Array<{
      miles: string;
      terrain: string;
      advice: string;
    }>;
  };
  fuelingNotes: string;
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export interface TimeGoal {
  distance: "5k" | "10k" | "half-marathon" | "marathon";
  distanceLabel: string;
  distanceKm: number;
  targetTime: string;
  targetTimeMinutes: number;
  pacePerKm: string;
  pacePerMile: string;
  vdot: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "elite";
}

export interface DistanceTopic {
  distance: "5k" | "10k" | "half-marathon" | "marathon" | "ultra";
  distanceLabel: string;
  topic: "fueling" | "pacing" | "training-plan" | "race-day" | "recovery";
  topicLabel: string;
}
