# @trainpace/core

**Running coach math, packaged for your own tools and agents.** VDOT, training
pace zones, and GPX route analysis — pure functions, meters in, numbers out. The
same engine behind [trainpace.com](https://www.trainpace.com).

> Bring the run. Your AI brings the conversation. TrainPace brings the math that
> has to be right.

## Install

```bash
npm install @trainpace/core
```

## Library usage

```ts
import {
  calculateVdot,
  buildTrainingZones,
  buildRacePredictions,
  calculateTrainingPaces,
  analyzeGpx,
} from "@trainpace/core";

const vdot = calculateVdot(10000, 40 * 60); // 10K in 40:00 -> 51.9
const zones = buildTrainingZones(vdot);      // Easy / Marathon / Threshold / ...
const races = buildRacePredictions(vdot);    // equivalent times 800m..Marathon

const paces = calculateTrainingPaces(40 * 60, 10000, "km", { age: 35, temperature: 82 });

const { metadata } = analyzeGpx(gpxFileString); // distance, elevation gain, bounds
```

All inputs are **meters and seconds**; `"km" | "miles"` controls only the
formatting of output paces.

## CLI

```bash
npx @trainpace/core vdot  --distance 10000 --time 40:00 --pretty
npx @trainpace/core paces --distance 10000 --time 40:00 --unit km --age 35 --temp 82
npx @trainpace/core gpx   ./route.gpx
```

Every command prints JSON to stdout (`--pretty` for humans). Bad input prints
`{"error": "..."}` and exits non-zero — easy for an agent to call and parse.

## Use it with your AI

This package is the engine behind the TrainPace **skill**: a runner asks their
assistant a plain-English question ("am I going out too hard, and where are the
climbs?") and the assistant uses these commands to compute exact numbers instead
of guessing. See `docs/SKILL.draft.md` in the repo.

## API

| Function | Returns |
|---|---|
| `calculateVdot(distanceMeters, timeSeconds)` | VDOT number |
| `predictRaceTime(vdot, distanceMeters)` | seconds |
| `buildRacePredictions(vdot, unit?)` | equivalent race times |
| `buildTrainingZones(vdot)` | formatted Daniels zones |
| `classifyVdot(vdot)` | "Beginner" … "Elite" |
| `calculateTrainingPaces(timeSeconds, distanceMeters, unit?, opts?)` | training paces (+ optional HR/heat) |
| `calculateHeartRateZones(age)` | HR zones |
| `analyzeGpx(gpxString, filename?)` | `{ metadata, displayPoints, thumbnailPoints }` |

## License

MIT — use it anywhere, including commercial projects.
