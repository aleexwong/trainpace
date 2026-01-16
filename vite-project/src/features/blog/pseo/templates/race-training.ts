// Race-specific training guide template
import { RaceData } from "../types";
import { BlogPost, BlogCategory } from "../../types";

export function generateRaceTrainingPost(race: RaceData): BlogPost {
  const slug = `${race.key}-marathon-training-guide`;
  const year = new Date(race.raceDate).getFullYear();

  // Calculate difficulty rating based on elevation
  const getDifficultyRating = (gain: number): string => {
    if (gain < 100) return "Easy (flat course)";
    if (gain < 150) return "Moderate";
    if (gain < 200) return "Challenging";
    return "Difficult (hilly course)";
  };

  // Generate pace strategy section
  const paceStrategySection = race.paceStrategy.segments
    .map(seg => `### Miles ${seg.miles}: ${seg.terrain}\n${seg.advice}`)
    .join("\n\n");

  // Generate FAQ section
  const faqSection = race.faq
    .map(faq => `### ${faq.question}\n${faq.answer}`)
    .join("\n\n");

  const content = `# ${race.name} Training Guide ${year}

Planning to run the ${race.name}? This comprehensive guide covers everything you need to know about training for, racing, and conquering one of the world's most iconic marathons.

## Course Overview

The ${race.name} in ${race.city}, ${race.country} is a ${race.distance}km race with **${race.elevationGain}m of elevation gain** and **${race.elevationLoss}m of elevation loss**.

${race.description}

**Course Difficulty**: ${getDifficultyRating(race.elevationGain)}

**Race Date**: ${race.raceDate}

## Key Training Tips

${race.tips.map(tip => `- ${tip}`).join("\n")}

## Pacing Strategy: ${race.paceStrategy.type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}

${race.paceStrategy.summary}

${paceStrategySection}

## Course Elevation Profile

With ${race.elevationGain}m of climbing, here's how to prepare:

${race.elevationGain > 150
  ? `This is a **challenging course** that requires specific hill training. Include:
- Weekly hill repeats (8-10 x 60-90 second efforts)
- Long runs on hilly terrain
- Downhill running practice to prepare your quads`
  : `This is a **relatively flat course** ideal for PRs. Focus on:
- Even pacing from start to finish
- Tempo runs to dial in your goal pace
- Speed work to sharpen your turnover`}

Analyze the full elevation profile and plan your segment-by-segment strategy with our [Elevation Finder](/elevation-finder).

## Race-Specific Fueling

${race.fuelingNotes}

**General Fueling Guidelines for ${race.name}:**
- Start fueling by km 6-8
- Take 30-60g of carbs per hour
- Practice your exact race nutrition in training
- Use our [Fuel Planner](/fuel) to create your personalized strategy

## Training Plan Overview

For a goal marathon like ${race.name}, follow this weekly structure:

| Day | Workout Type | Purpose |
|-----|--------------|---------|
| Monday | Rest or cross-train | Recovery |
| Tuesday | Easy run | Base building |
| Wednesday | Speed/tempo work | Fitness development |
| Thursday | Easy run | Recovery |
| Friday | Rest | Pre-long run recovery |
| Saturday | Long run | Endurance building |
| Sunday | Easy run | Active recovery |

**Training Phases:**
1. **Base Building (Weeks 1-6)**: Build aerobic fitness with easy running
2. **Build Phase (Weeks 7-12)**: Add tempo runs and longer intervals
3. **Peak Phase (Weeks 13-18)**: Race-specific workouts, longest runs
4. **Taper (Weeks 19-20)**: Reduce volume, maintain intensity

Get your personalized training paces with our [Pace Calculator](/calculator).

## Frequently Asked Questions

${faqSection}

## Your Race Day Checklist

- [ ] Know your goal pace and splits
- [ ] Have your fueling plan memorized
- [ ] Lay out all gear the night before
- [ ] Eat a tested pre-race breakfast
- [ ] Arrive with time to spare
- [ ] Start conservative, finish strong

## Ready to Train?

1. **Calculate your paces**: [Pace Calculator](/calculator)
2. **Analyze the course**: [${race.name} Elevation](/preview-route/${race.key})
3. **Plan your nutrition**: [Fuel Planner](/fuel)

Good luck with your ${race.name} journey!`;

  return {
    slug,
    title: `${race.name} Training Guide ${year}: Course Strategy & Tips`,
    excerpt: `Complete training guide for the ${race.name}. Learn the course strategy, pacing tips, and how to prepare for ${race.elevationGain}m of elevation across ${race.distance}km.`,
    content,
    date: new Date().toISOString().split("T")[0],
    author: {
      name: "TrainPace",
      bio: "Science-backed running tools for serious athletes.",
    },
    category: "race-strategy" as BlogCategory,
    tags: [
      race.key,
      "marathon",
      "training guide",
      race.city.toLowerCase(),
      "race strategy",
      "world major",
    ],
    readingTime: 12,
    featured: false,
  };
}
