<!-- DRAFT README for the future standalone repo (e.g. trainpace-core).
     Lives here in docs/ until the repo is scaffolded. Tone: runner-first. -->

# TrainPace

**Bring real running-coach math to your own AI.** TrainPace turns a race time or a
GPX file into exact VDOT, training pace zones, and route analysis — so when you ask
Claude (or any agent) "am I training too hard?", the numbers are *computed*, not
guessed.

You bring the run. Your AI brings the conversation. TrainPace brings the math that
has to be right.

## For runners — add it to your AI

Drop the TrainPace skill into your assistant and just talk to it:

> "Here's my Sunday long-run gpx. I ran a 40:00 10K last month. Am I going out too
> hard, and where are the climbs?"

Your assistant uses TrainPace under the hood to figure out your easy pace, your
fitness score, and your route's elevation — then explains it like a coach. No
spreadsheet, no website login, no premium wall.

See [`SKILL.md`](./SKILL.md) for the skill and example questions.

## For builders — use the engine directly

```bash
npm install @trainpace/core      # the pure math library
npx @trainpace/core vdot --distance 10000 --time 40:00   # CLI, JSON out
```

```ts
import { calculateVdot, calculateTrainingZones } from "@trainpace/core";

const vdot = calculateVdot(10000, 40 * 60); // 10K in 40:00
const zones = calculateTrainingZones(vdot);  // easy / tempo / threshold / ...
```

- **Zero runtime dependencies.** Pure functions: meters in, numbers out.
- **Same engine that powers [trainpace.com](https://www.trainpace.com).**
- **MIT** *(license TBD — see strategy doc).*

## What it does

| Command | Gives you |
|---|---|
| `vdot`  | Fitness score, training zones, race-time predictions from one result |
| `paces` | Easy/tempo/interval paces, optional HR zones & heat adjustment |
| `gpx`   | Route distance, elevation gain, high/low points |

## Status

Early. The skill, CLI, and package are taking shape — see
[`docs/agent-platform-strategy.md`](./docs/agent-platform-strategy.md) for the
roadmap (personal runner skill first, hosted API to remove the install step next).
