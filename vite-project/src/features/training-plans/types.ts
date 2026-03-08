export type WorkoutType =
  | "rest"
  | "easy"
  | "tempo"
  | "interval"
  | "long"
  | "cross"
  | "race";

export interface Workout {
  day: string;
  type: WorkoutType;
  title: string;
  description: string;
  distance?: string;
  duration?: string;
}

export interface TrainingWeek {
  week: number;
  phase: string;
  workouts: Workout[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  subtitle: string;
  weeks: number;
  distance?: string;
  color: string;
  textColor: string;
  badgeColor: string;
  description: string;
  goal: string;
  schedule: TrainingWeek[];
}
