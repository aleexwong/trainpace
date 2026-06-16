---
name: trainpace
description: >-
  Running coach math for athletes. Compute VDOT from a race result, generate
  terrain-aware training pace zones, and analyze a GPX route's distance and
  elevation. Use this skill whenever a runner shares a race time, a goal, or a
  GPX file and wants pacing, training zones, or route insight. The skill computes
  the exact numbers; you interpret them in plain language.
---

# TrainPace — running coach math

> **Draft.** Written against the planned `@trainpace/core` CLI (see
> `docs/agent-platform-strategy.md`). Command shapes here are the contract the
> CLI must implement, not yet a published tool.

You are helping a runner. They are not a developer — they will speak in race
times, distances, and "am I going too hard?", not in JSON. Your job:

1. Translate what the runner said into a `trainpace` command.
2. Run it. **Never compute VDOT, paces, or elevation yourself — always call the
   CLI.** The whole point of this skill is that these numbers are exact and must
   not be hallucinated.
3. Read the JSON it returns and explain it warmly, like a coach.

## When to use this skill

- A runner gives a race result and asks how fast they should train.
- A runner asks for easy / tempo / threshold / interval paces.
- A runner shares a `.gpx` file and asks about distance, climbing, or difficulty.
- A runner asks "what could I run for a [distance]?" → race-time prediction.

## Setup (one time)

```bash
npm install -g @trainpace/core   # provides the `trainpace` command
# or call ad hoc without installing:
npx @trainpace/core <command> ...
```

Every command prints JSON to stdout. Add `--pretty` for readable output. On bad
input the command exits non-zero and prints `{ "error": "..." }`.

---

## Commands

### `trainpace vdot` — fitness score + zones + race predictions

Compute VDOT (Daniels & Gilbert) from one race performance.

```bash
trainpace vdot --distance 10000 --time 40:00
```

| Flag | Meaning |
|---|---|
| `--distance` | race distance in **meters** (e.g. `10000` = 10K, `21097` = half) |
| `--time` | race time `HH:MM:SS` or `MM:SS` |
| `--unit` | `km` (default) or `miles` for the pace fields in the output |

**Example output** (illustrative numbers for a 40:00 10K):

```json
{
  "vdot": 51.9,
  "level": "Intermediate",
  "trainingZones": [
    { "name": "Easy",       "shortName": "E", "pacePerKm": "4:44-5:41" },
    { "name": "Marathon",   "shortName": "M", "pacePerKm": "4:18-4:36" },
    { "name": "Threshold",  "shortName": "T", "pacePerKm": "4:07-4:15" },
    { "name": "Interval",   "shortName": "I", "pacePerKm": "3:48-3:54" },
    { "name": "Repetition", "shortName": "R", "pacePerKm": "3:32-3:40" }
  ],
  "racePredictions": [
    { "distance": "5K",       "time": "19:18" },
    { "distance": "10K",      "time": "40:00" },
    { "distance": "Half",     "time": "1:28:42" },
    { "distance": "Marathon", "time": "3:04:30" }
  ]
}
```

**How to talk about it:** lead with the predictions and the easy pace (most
actionable). Explain that Easy should feel conversational and is most of weekly
mileage; Threshold is "comfortably hard." Don't dump all five zones unless asked.

### `trainpace paces` — training paces from a race time

Quick training-pace ranges without the full VDOT model. Supports optional age
(heart-rate zones) and temperature (heat adjustment).

```bash
trainpace paces --distance 10000 --unit km --time 40:00 --age 35 --temp 82
```

| Flag | Meaning |
|---|---|
| `--distance` | race distance in **meters** (same as `vdot` — meters everywhere) |
| `--unit` | pace **output** unit: `km` or `miles` |
| `--time` | race time `HH:MM:SS` or `MM:SS` |
| `--age` | *(optional)* adds max-HR-based heart-rate zones |
| `--temp` | *(optional)* °F; ≥80 slows easy pace and notes the heat adjustment |

**Example output:**

```json
{
  "race":  "4:00-4:00 min/km",
  "easy":  "4:48-5:12 min/km",
  "tempo": "3:48-4:12 min/km",
  "interval": "3:36-4:00 min/km",
  "yasso": "3:00-3:30 min/800m",
  "heartRateZones": {
    "maxHR": 185,
    "easyZone": "60-70% (111-130 bpm)",
    "tempoZone": "80-90% (148-167 bpm)"
  },
  "adjustments": {
    "weather": {
      "temperature": 82,
      "adjustedEasyPace": "5:18-5:42 min/km",
      "message": "In 82°F+, slow easy pace by ~0:30/km."
    }
  }
}
```

### `trainpace gpx` — route distance + elevation analysis

Analyze a GPX file: total distance, elevation gain, high/low points, bounds.

```bash
trainpace gpx ./boston-marathon.gpx
```

**Example output:**

```json
{
  "routeName": "Boston Marathon",
  "totalDistance": 42.2,
  "elevationGain": 246,
  "maxElevation": 71,
  "minElevation": 2,
  "pointCount": 1184,
  "hasElevationData": true
}
```

Distances are kilometers, elevations meters. `hasElevationData: false` means the
file had no elevation track — say so honestly rather than inventing climb numbers.

---

## Putting it together — the runner's real question

> *"Here's my Sunday long-run gpx. I ran a 40:00 10K last month. Am I going out
> too hard, and where are the climbs?"*

1. `trainpace gpx ./sunday.gpx` → distance + elevation gain.
2. `trainpace vdot --distance 10000 --time 40:00` → easy-pace range.
3. Answer: compare their intended long-run pace to the **Easy** range from step 2;
   if the route's `elevationGain` is significant, remind them Easy effort means
   *slowing down* on the climbs (roughly +0:30/km on real hills), so pace will
   drift and that's correct. Point to the high point from the GPX as the crux.

Stay in the runner's language. The numbers are exact because the CLI computed
them — your job is to make them feel like coaching.
