// Time-goal specific training guide template
import { TimeGoal } from "../types";
import { BlogPost, BlogCategory } from "../../types";

export function generateTimeGoalPost(goal: TimeGoal): BlogPost {
  const slug = `sub-${goal.targetTime.replace(":", "-")}-${goal.distance}-training-guide`;

  // Training advice based on difficulty
  const getTrainingAdvice = (): string => {
    switch (goal.difficulty) {
      case "beginner":
        return `This is an achievable goal for dedicated beginners. Focus on:
- Building consistent weekly mileage (30-50km/week)
- Running most miles at an easy, conversational pace
- One weekly long run building to ${goal.distance === "marathon" ? "32-35km" : goal.distance === "half-marathon" ? "18-21km" : "10-12km"}
- One quality session per week (tempo or intervals)`;

      case "intermediate":
        return `This goal requires structured training and dedication. Your plan should include:
- Weekly mileage of ${goal.distance === "marathon" ? "50-80km" : goal.distance === "half-marathon" ? "40-60km" : "30-50km"}
- Two quality sessions per week (tempo + speed work)
- Progressive long runs with race-pace segments
- Adequate recovery between hard efforts`;

      case "advanced":
        return `This is a competitive goal that demands serious commitment. Expect:
- High weekly mileage (${goal.distance === "marathon" ? "80-120km" : goal.distance === "half-marathon" ? "60-90km" : "50-70km"})
- Multiple quality sessions per week
- Race-specific workouts at goal pace
- Careful attention to recovery and injury prevention`;

      case "elite":
        return `This is an elite-level goal requiring exceptional fitness and training. You'll need:
- Very high volume (${goal.distance === "marathon" ? "120-180km" : "80-120km"}/week)
- Doubles (two runs per day) on some days
- Precise race-pace workouts
- Periodized training with strategic racing`;
    }
  };

  // Weekly structure based on distance and difficulty
  const getWeeklyPlan = (): string => {
    const easyPace = goal.difficulty === "elite" ? "5:00-5:30/km" :
                     goal.difficulty === "advanced" ? "5:30-6:00/km" :
                     goal.difficulty === "intermediate" ? "6:00-6:30/km" : "6:30-7:30/km";

    return `| Day | Workout | Notes |
|-----|---------|-------|
| Monday | Rest or easy 5-8km | Recovery is training |
| Tuesday | Easy run ${goal.difficulty === "beginner" ? "6-10km" : "8-14km"} @ ${easyPace} | Aerobic base |
| Wednesday | **Quality: Tempo** ${goal.difficulty === "beginner" ? "20min" : "30-40min"} @ ${goal.pacePerKm}/km + ~10 sec | Threshold development |
| Thursday | Easy run ${goal.difficulty === "beginner" ? "5-8km" : "8-12km"} @ ${easyPace} | Active recovery |
| Friday | Rest or easy 4-6km | Pre-long run rest |
| Saturday | **Long run** ${goal.distance === "marathon" ? "25-35km" : goal.distance === "half-marathon" ? "16-24km" : "12-16km"} | Endurance building |
| Sunday | Easy run ${goal.difficulty === "beginner" ? "5-8km" : "8-10km"} @ ${easyPace} | Recovery |`;
  };

  // Key workouts based on distance
  const getKeyWorkouts = (): string => {
    if (goal.distance === "marathon") {
      return `### Marathon-Specific Workouts

**1. Marathon Pace Long Run**
- 28-32km with final 12-16km at goal pace (${goal.pacePerKm}/km)
- Simulates race-day fatigue

**2. Progression Long Run**
- Start easy, finish at marathon pace
- Example: 28km total, last 10km at ${goal.pacePerKm}/km

**3. Tempo Intervals**
- 3-4 x 3km at tempo pace with 3min recovery
- Builds lactate threshold

**4. Yasso 800s**
- 10 x 800m with equal recovery
- Target: ${goal.targetTime.split(":")[0]}:${goal.targetTime.split(":")[1]} per 800m (e.g., 3:45 for 3:45 marathon)`;
    } else if (goal.distance === "half-marathon") {
      return `### Half Marathon-Specific Workouts

**1. Race Pace Tempo**
- 8-12km continuous at goal pace (${goal.pacePerKm}/km)
- The bread-and-butter workout

**2. Cruise Intervals**
- 4-5 x 2km at goal pace with 2min jog recovery
- Breaks up the pace into manageable chunks

**3. Progression Run**
- 14-16km starting easy, finishing at half marathon pace
- Last 5-6km at ${goal.pacePerKm}/km

**4. Long Intervals**
- 5-6 x 1km at slightly faster than goal pace with 90sec recovery
- Builds speed and confidence`;
    } else {
      return `### ${goal.distanceLabel} Specific Workouts

**1. Tempo Run**
- 20-30min at goal pace (${goal.pacePerKm}/km)
- Builds race-specific fitness

**2. Interval Training**
- 6-8 x 800m at goal pace with 90sec recovery
- Develops speed and efficiency

**3. Fartlek**
- 30-40min with 6-8 x 2-3min hard efforts
- Fun, unstructured speed work

**4. Race Pace Reps**
- 4-5 x 1km at goal pace with 2min recovery
- Locks in your target rhythm`;
    }
  };

  const content = `# Sub-${goal.targetTime} ${goal.distanceLabel} Training Guide

Running a sub-${goal.targetTime} ${goal.distanceLabel.toLowerCase()} means maintaining a pace of **${goal.pacePerKm} per kilometer** (${goal.pacePerMile} per mile) for ${goal.distanceKm}km. This guide will help you get there.

## Is Sub-${goal.targetTime} Realistic for You?

This goal corresponds to a **VDOT of approximately ${goal.vdot}**, which is considered a **${goal.difficulty}** level target.

**Prerequisite fitness markers:**
${goal.distance === "marathon"
  ? `- Half marathon: ~${Math.floor(goal.targetTimeMinutes / 2.1)}:${String(Math.floor((goal.targetTimeMinutes / 2.1 % 1) * 60)).padStart(2, "0")}
- 10K: ~${Math.floor(goal.targetTimeMinutes / 4.6)}:${String(Math.floor((goal.targetTimeMinutes / 4.6 % 1) * 60)).padStart(2, "0")}`
  : goal.distance === "half-marathon"
  ? `- 10K: ~${Math.floor(goal.targetTimeMinutes / 2.15)}:${String(Math.floor((goal.targetTimeMinutes / 2.15 % 1) * 60)).padStart(2, "0")}
- 5K: ~${Math.floor(goal.targetTimeMinutes / 4.6)}:${String(Math.floor((goal.targetTimeMinutes / 4.6 % 1) * 60)).padStart(2, "0")}`
  : `- Shorter race times that predict this goal
- Consistent training for at least 3-6 months`}

Use our [Pace Calculator](/calculator) to check your current fitness level and see what your recent races predict.

## Training Overview

${getTrainingAdvice()}

## Sample Training Week

${getWeeklyPlan()}

## Key Workouts for Sub-${goal.targetTime}

${getKeyWorkouts()}

## Pacing Strategy on Race Day

**Target pace**: ${goal.pacePerKm}/km (${goal.pacePerMile}/mile)

### Split Strategy

| Split | Time | Cumulative |
|-------|------|------------|
${goal.distance === "marathon"
  ? `| 5km | ${formatTime(goal.targetTimeMinutes / 8.44)} | ${formatTime(goal.targetTimeMinutes / 8.44)} |
| 10km | ${formatTime(goal.targetTimeMinutes / 8.44)} | ${formatTime((goal.targetTimeMinutes / 8.44) * 2)} |
| Half | ${formatTime(goal.targetTimeMinutes / 2)} | ${formatTime(goal.targetTimeMinutes / 2)} |
| 30km | ${formatTime(goal.targetTimeMinutes / 8.44)} | ${formatTime((goal.targetTimeMinutes / 8.44) * 6)} |
| Finish | -- | ${goal.targetTime} |`
  : goal.distance === "half-marathon"
  ? `| 5km | ${formatTime(goal.targetTimeMinutes / 4.22)} | ${formatTime(goal.targetTimeMinutes / 4.22)} |
| 10km | ${formatTime(goal.targetTimeMinutes / 4.22)} | ${formatTime((goal.targetTimeMinutes / 4.22) * 2)} |
| 15km | ${formatTime(goal.targetTimeMinutes / 4.22)} | ${formatTime((goal.targetTimeMinutes / 4.22) * 3)} |
| Finish | -- | ${goal.targetTime} |`
  : `| 1km | ${goal.pacePerKm} | ${goal.pacePerKm} |
| 2km | ${goal.pacePerKm} | ${formatTime(parseTime(goal.pacePerKm) * 2)} |
| 3km | ${goal.pacePerKm} | ${formatTime(parseTime(goal.pacePerKm) * 3)} |
| Finish | -- | ${goal.targetTime} |`}

**Pacing tips:**
1. Start 5-10 seconds slower than goal pace for the first km
2. Settle into rhythm by km 2-3
3. Stay relaxed through the middle miles
4. Save your kick for the final ${goal.distance === "marathon" ? "5km" : goal.distance === "half-marathon" ? "3km" : "1km"}

## Fueling for Sub-${goal.targetTime}

${goal.distance === "marathon"
  ? `At this pace, you'll be racing for ${goal.targetTime}. That means:
- **Pre-race**: 100-150g carbs 2-3 hours before
- **During**: 60-90g carbs per hour (gel every 25-30 min)
- **Hydration**: 400-800ml per hour depending on conditions

Create your exact plan with our [Fuel Planner](/fuel).`
  : goal.distance === "half-marathon"
  ? `For a ${goal.targetTime} half marathon:
- **Pre-race**: 100-150g carbs 2-3 hours before
- **During**: 30-60g carbs (1-2 gels during the race)
- **When**: First gel around km 7-8, second around km 14 if needed

Create your exact plan with our [Fuel Planner](/fuel).`
  : `For shorter races like ${goal.distanceLabel}:
- **Pre-race**: Light carb-rich meal 2-3 hours before
- **During**: Water only (fueling not needed for ${goal.distanceLabel})
- **Focus**: Start line readiness, not nutrition logistics`}

## Common Mistakes to Avoid

1. **Going out too fast** - The first km will feel easy. Trust your watch, not your legs.
2. **Skipping easy days** - Recovery is when you get faster. Honor the easy pace.
3. **Neglecting the long run** - Endurance is built through consistent long efforts.
4. **Racing every workout** - Save your race-day effort for race day.
5. **Ignoring rest** - Sleep and recovery are as important as training.

## Your 12-Week Countdown

| Weeks Out | Focus | Key Sessions |
|-----------|-------|--------------|
| 12-10 | Base building | Easy miles + strides |
| 9-7 | Tempo development | Weekly tempo runs |
| 6-4 | Race-specific | Goal pace workouts |
| 3-2 | Peak fitness | Tune-up race or time trial |
| 1 | Taper | Reduce volume, maintain intensity |
| Race week | Execute | Trust your training |

## Get Your Paces

Enter your recent race time in our [Pace Calculator](/calculator) to get:
- Easy run pace
- Tempo pace
- Interval pace
- Your predicted ${goal.distanceLabel.toLowerCase()} time

## Ready to Chase Sub-${goal.targetTime}?

1. **Know your paces**: [Pace Calculator](/calculator)
2. **Plan your fuel**: [Fuel Planner](/fuel)
3. **Study your course**: [Elevation Finder](/elevation-finder)

Now get out there and train smart. Sub-${goal.targetTime} is waiting.`;

  return {
    slug,
    title: `Sub-${goal.targetTime} ${goal.distanceLabel} Training Guide: Paces, Workouts & Strategy`,
    excerpt: `How to run a sub-${goal.targetTime} ${goal.distanceLabel.toLowerCase()}. Complete training guide with paces (${goal.pacePerKm}/km), weekly plans, key workouts, and race-day strategy.`,
    content,
    date: new Date().toISOString().split("T")[0],
    author: {
      name: "TrainPace",
      bio: "Science-backed running tools for serious athletes.",
    },
    category: "training" as BlogCategory,
    tags: [
      goal.distance,
      "training guide",
      `sub-${goal.targetTime.replace(":", "-")}`,
      "pacing",
      goal.difficulty,
      "race strategy",
    ],
    readingTime: 10,
    featured: false,
  };
}

// Helper functions
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes % 1) * 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  }
  return 0;
}
