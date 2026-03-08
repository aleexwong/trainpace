import type { TrainingPlan } from "./types";

const marathonSchedule = Array.from({ length: 16 }, (_, i) => {
  const week = i + 1;
  const isEasy = week <= 4;
  const isBuild = week >= 5 && week <= 10;
  const isPeak = week >= 11 && week <= 14;
  const isTaper = week >= 15;
  const phase = isEasy
    ? "Base Building"
    : isBuild
    ? "Build Phase"
    : isPeak
    ? "Peak Training"
    : "Taper";

  const longRunMiles = isEasy
    ? 10 + week
    : isBuild
    ? 14 + (week - 5) * 1.5
    : isPeak
    ? 20
    : 16 - (week - 15) * 6;
  const tempoMiles = isEasy ? 4 : isBuild ? 5 + Math.floor((week - 5) / 2) : 6;

  return {
    week,
    phase,
    workouts: [
      { day: "Mon", type: "rest" as const, title: "Rest", description: "Full recovery day." },
      {
        day: "Tue",
        type: "easy" as const,
        title: "Easy Run",
        description: `Conversational pace. ${isEasy ? "Focus on form." : "Build aerobic base."}`,
        distance: `${isEasy ? 5 : isBuild ? 6 : 7} mi`,
      },
      {
        day: "Wed",
        type: "tempo" as const,
        title: "Tempo Run",
        description: "Comfortably hard effort, sustainable for 20–40 min.",
        distance: `${tempoMiles} mi`,
      },
      {
        day: "Thu",
        type: "easy" as const,
        title: "Easy Run",
        description: "Easy recovery run. Keep heart rate low.",
        distance: `${isEasy ? 4 : 5} mi`,
      },
      {
        day: "Fri",
        type: isTaper ? "rest" as const : "interval" as const,
        title: isTaper ? "Rest" : "Intervals",
        description: isTaper
          ? "Rest before long run."
          : "800m or mile repeats at 5K effort with equal recovery.",
        distance: isTaper ? undefined : `${isEasy ? 5 : 6} mi total`,
      },
      {
        day: "Sat",
        type: "easy" as const,
        title: "Easy Run",
        description: "Short shakeout before long run.",
        distance: "3 mi",
      },
      {
        day: "Sun",
        type: week === 16 ? "race" as const : "long" as const,
        title: week === 16 ? "Race Day!" : "Long Run",
        description:
          week === 16
            ? "Marathon race day. Run your best!"
            : isPeak
            ? "Peak long run. Practice race nutrition."
            : `Build endurance at easy effort.`,
        distance: week === 16 ? "26.2 mi" : `${Math.round(longRunMiles)} mi`,
      },
    ],
  };
});

const halfMarathonSchedule = Array.from({ length: 12 }, (_, i) => {
  const week = i + 1;
  const isBase = week <= 3;
  const isBuild = week >= 4 && week <= 8;
  const isPeak = week >= 9 && week <= 10;
  const phase = isBase
    ? "Base Building"
    : isBuild
    ? "Build Phase"
    : isPeak
    ? "Peak Training"
    : "Taper";
  const longRunMiles = isBase ? 6 + week : isBuild ? 9 + (week - 4) * 0.8 : isPeak ? 12 : 8;

  return {
    week,
    phase,
    workouts: [
      { day: "Mon", type: "rest" as const, title: "Rest", description: "Full recovery." },
      {
        day: "Tue",
        type: "easy" as const,
        title: "Easy Run",
        description: "Easy aerobic run.",
        distance: `${isBase ? 4 : 5} mi`,
      },
      {
        day: "Wed",
        type: "tempo" as const,
        title: "Tempo Run",
        description: "Threshold pace effort.",
        distance: `${isBase ? 3 : isBuild ? 4 : 5} mi`,
      },
      {
        day: "Thu",
        type: "cross" as const,
        title: "Cross Training",
        description: "Cycling, swimming, or yoga.",
        duration: "45 min",
      },
      {
        day: "Fri",
        type: "easy" as const,
        title: "Easy Run",
        description: "Short, easy shakeout.",
        distance: `${isBase ? 3 : 4} mi`,
      },
      { day: "Sat", type: "rest" as const, title: "Rest", description: "Rest before long run." },
      {
        day: "Sun",
        type: week === 12 ? "race" as const : "long" as const,
        title: week === 12 ? "Race Day!" : "Long Run",
        description: week === 12 ? "Half Marathon race day!" : "Easy long run for endurance.",
        distance: week === 12 ? "13.1 mi" : `${Math.round(longRunMiles)} mi`,
      },
    ],
  };
});

const tenKSchedule = Array.from({ length: 10 }, (_, i) => {
  const week = i + 1;
  const isBase = week <= 3;
  const isBuild = week >= 4 && week <= 7;
  const isTaper = week >= 8;
  const phase = isBase ? "Base Building" : isBuild ? "Build Phase" : "Taper & Race";
  const longRunKm = isBase ? 6 + week : isBuild ? 9 + (week - 4) : isTaper ? 10 - (week - 8) * 2 : 8;

  return {
    week,
    phase,
    workouts: [
      { day: "Mon", type: "rest" as const, title: "Rest", description: "Full recovery." },
      {
        day: "Tue",
        type: "easy" as const,
        title: "Easy Run",
        description: "Relaxed aerobic run.",
        distance: `${isBase ? 4 : 5} km`,
      },
      {
        day: "Wed",
        type: "interval" as const,
        title: "Intervals",
        description: "400m repeats at 5K pace.",
        distance: `${isBase ? 4 : 5} km total`,
      },
      {
        day: "Thu",
        type: "cross" as const,
        title: "Cross Training",
        description: "Low-impact cardio or strength.",
        duration: "30 min",
      },
      {
        day: "Fri",
        type: "tempo" as const,
        title: "Tempo Run",
        description: "10K race pace practice.",
        distance: `${isBase ? 3 : 4} km`,
      },
      { day: "Sat", type: "rest" as const, title: "Rest", description: "Rest before weekend run." },
      {
        day: "Sun",
        type: week === 10 ? "race" as const : "long" as const,
        title: week === 10 ? "Race Day!" : "Long Run",
        description: week === 10 ? "10K race day!" : "Comfortable long run.",
        distance: week === 10 ? "10 km" : `${Math.round(longRunKm)} km`,
      },
    ],
  };
});

const fiveKSchedule = Array.from({ length: 8 }, (_, i) => {
  const week = i + 1;
  const isBase = week <= 2;
  const isBuild = week >= 3 && week <= 6;
  const phase = isBase ? "Base Building" : isBuild ? "Build Phase" : "Taper & Race";

  return {
    week,
    phase,
    workouts: [
      { day: "Mon", type: "rest" as const, title: "Rest", description: "Rest and recover." },
      {
        day: "Tue",
        type: "easy" as const,
        title: "Easy Run",
        description: "Gentle run to build habits.",
        distance: `${isBase ? 2 : isBuild ? 3 : 2} km`,
      },
      {
        day: "Wed",
        type: isBuild ? "interval" as const : "easy" as const,
        title: isBuild ? "Intervals" : "Easy Run",
        description: isBuild
          ? "Short fast bursts with recovery jogs."
          : "Easy run at comfortable pace.",
        distance: isBuild ? "3 km total" : "2 km",
      },
      { day: "Thu", type: "rest" as const, title: "Rest", description: "Recovery day." },
      {
        day: "Fri",
        type: "tempo" as const,
        title: "Tempo Run",
        description: "Faster sustained effort.",
        distance: `${isBase ? 2 : 3} km`,
      },
      {
        day: "Sat",
        type: "cross" as const,
        title: "Cross Training",
        description: "Easy walk, yoga, or cycling.",
        duration: "30 min",
      },
      {
        day: "Sun",
        type: week === 8 ? "race" as const : "long" as const,
        title: week === 8 ? "Race Day!" : "Long Run",
        description: week === 8 ? "5K race day!" : "Longest run of the week.",
        distance: week === 8 ? "5 km" : `${2 + week} km`,
      },
    ],
  };
});

const getFitSchedule = Array.from({ length: 8 }, (_, i) => {
  const week = i + 1;
  const phase = week <= 3 ? "Getting Started" : week <= 6 ? "Building Fitness" : "Peak Fitness";

  return {
    week,
    phase,
    workouts: [
      { day: "Mon", type: "rest" as const, title: "Rest", description: "Full rest." },
      {
        day: "Tue",
        type: "easy" as const,
        title: "Walk/Run",
        description: `Alternate ${week <= 3 ? "1 min running, 2 min walking" : "2 min running, 1 min walking"}.`,
        duration: `${20 + week * 2} min`,
      },
      {
        day: "Wed",
        type: "cross" as const,
        title: "Cross Training",
        description: "Cycling, swimming, or strength.",
        duration: "30 min",
      },
      { day: "Thu", type: "rest" as const, title: "Rest", description: "Recovery." },
      {
        day: "Fri",
        type: "easy" as const,
        title: "Easy Run",
        description: "Continuous easy jog.",
        duration: `${15 + week * 2} min`,
      },
      {
        day: "Sat",
        type: "cross" as const,
        title: "Active Recovery",
        description: "Light walk or yoga.",
        duration: "20 min",
      },
      {
        day: "Sun",
        type: "long" as const,
        title: "Long Easy Run",
        description: "Longest effort of the week at easy pace.",
        duration: `${25 + week * 3} min`,
      },
    ],
  };
});

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "marathon",
    name: "Marathon Plan",
    subtitle: "Full Marathon Training",
    weeks: 16,
    distance: "26.2 mi",
    color: "bg-red-500",
    textColor: "text-white",
    badgeColor: "bg-red-600/40 text-white border-red-300/30",
    description:
      "A complete 16-week plan to take you from consistent running to marathon finish line. Includes base building, tempo work, long runs up to 20 miles, and a proper taper.",
    goal: "Finish a marathon strong",
    schedule: marathonSchedule,
  },
  {
    id: "half-marathon",
    name: "Half Marathon Plan",
    subtitle: "Half Marathon Training",
    weeks: 12,
    distance: "13.1 mi",
    color: "bg-emerald-600",
    textColor: "text-white",
    badgeColor: "bg-emerald-700/40 text-white border-emerald-300/30",
    description:
      "12 weeks of structured training to conquer the half marathon. Balances easy runs, tempo work, and progressive long runs up to 12 miles.",
    goal: "Run a strong half marathon",
    schedule: halfMarathonSchedule,
  },
  {
    id: "10k",
    name: "10K Plan",
    subtitle: "10K Race Training",
    weeks: 10,
    distance: "10K",
    color: "bg-yellow-400",
    textColor: "text-gray-900",
    badgeColor: "bg-yellow-500/40 text-gray-900 border-yellow-600/30",
    description:
      "10 weeks of focused training to race your best 10K. Features interval sessions, tempo runs, and a progressive long run build-up.",
    goal: "Set a 10K personal best",
    schedule: tenKSchedule,
  },
  {
    id: "5k",
    name: "5K Plan",
    subtitle: "5K Race Training",
    weeks: 8,
    distance: "5K",
    color: "bg-blue-500",
    textColor: "text-white",
    badgeColor: "bg-blue-600/40 text-white border-blue-300/30",
    description:
      "8 weeks to run your first or fastest 5K. Perfect for newer runners looking to race confidently, with a manageable mix of easy runs and speed work.",
    goal: "Race a strong 5K",
    schedule: fiveKSchedule,
  },
  {
    id: "get-fit",
    name: "Get Fit Plan",
    subtitle: "Beginner Fitness",
    weeks: 8,
    color: "bg-green-500",
    textColor: "text-white",
    badgeColor: "bg-green-600/40 text-white border-green-300/30",
    description:
      "8 weeks to build a running habit from scratch. Uses run/walk intervals progressing to continuous easy runs. Great for anyone new to running.",
    goal: "Build a sustainable running habit",
    schedule: getFitSchedule,
  },
];
