# TrainPace Agent Platform — Strategy

> Status: **Proposal / thinking doc.** No code committed yet.
> Goal: let runners use *their own* LLMs/agents with TrainPace's running science —
> go from a GPX file to actionable training output ("GPX → skill") fast.

## The one-line vision

Package TrainPace's running math (VDOT, pace zones, GPX/elevation analysis, fueling)
as a small, pure, open-source toolkit so **any agent** — Claude, Cursor, a custom
script — can compute *correct* numbers and then reason on top of them.

The LLM brings judgment and narrative. TrainPace brings the math that must not be
hallucinated. That division of labor is the whole point.

## Decisions locked in (2026-06-15)

| Question | Decision |
|---|---|
| Where it lives | **Separate public repo** (standalone open-source project) |
| First deliverable | **This strategy doc** — no code yet |
| Foundation distribution | **npm package + CLI** (the engine the skill calls) |
| **Who is the hero** | **The runner, not the developer (Scene A).** |

The headline product is a **personal runner skill** — a runner uses *their own* LLM
(Claude, etc.) with TrainPace's running science and never touches a command line.
The npm package + CLI are the *engine*; **SKILL.md is the product runners feel.**

A hosted HTTP API moves *up* the roadmap (not down): it's what removes the local-install
step for a non-technical runner. A developer docs page becomes an "add TrainPace to your
AI" page — install instructions for a runner, not API reference for a dev.

## Who is the hero — the target user journey (Scene A)

A runner opens Claude (desktop / mobile / web) with the TrainPace skill available. They type:

> "Here's my Sunday long-run gpx. I ran a 40:00 10K last month. Am I going out too
> hard, and where are the climbs?"

The agent, guided by `SKILL.md`, computes the VDOT, the terrain-adjusted easy pace, and
the elevation profile, then answers in plain English. The runner never sees a command
line, never uploads to trainpace.com, never hits a premium gate. It's *their* data,
*their* LLM, *their* coach-in-a-box.

**Implications that drive everything below:**
- The LLM brings judgment and narrative; TrainPace brings numbers that must not be
  hallucinated. The skill exists to enforce that boundary.
- `SKILL.md` is the headline artifact — the thing we market and a runner "installs."
- The CLI is plumbing the runner never touches. It still must exist (the skill needs
  something concrete and correct to call), but it is a *means*, not the end.
- **Friction caveat:** a local skill today still needs the CLI present on the machine.
  For a non-technical runner that's real friction — which is exactly why the hosted API
  is the friction-remover, not a "later, maybe."

## The layering (build bottom-up)

The chain "API → CLI → npm → repo → SKILL.md → dev page" is real, but the **build
order is the reverse** of how it's usually spoken. Everything rests on one pure package:

```
@trainpace/core   ← pure npm package: the crown jewels (vdot, pace, gpx math)
      │
   trainpace CLI   ← `npx trainpace gpx route.gpx` → JSON in / JSON out
      │
   SKILL.md        ← teaches ANY agent how to drive the CLI/package
      │
   HTTP API        ← LATER: optional hosted version (non-JS agents, no install)
      │
   developer page  ← LATER: docs + SKILL.md + examples
```

Because the trainpace.com web app will *also* import `@trainpace/core`, the website
and the agent product can never silently drift — there is one source of truth for the
math. (Trade-off of the separate-repo choice: we must consciously keep the web app
pointed at the published package, or vendor it, rather than maintaining two copies.)

## Why this is mostly packaging, not a rewrite

Audit of the existing code (in `vite-project/src`):

| Module | Purity | Notes |
|---|---|---|
| `features/vdot-calculator/vdot-math.ts` | ✅ 100% pure | `calculateVdot`, `predictRaceTime`, `calculateTrainingZones`, formatters. No React/Firebase/browser. Lifts cleanly. |
| `features/pace-calculator/utils.ts` | ✅ 100% pure | `calculateTrainingPaces`, HR zones, terrain & weather adjustments. Lifts cleanly. |
| `lib/gpxMetaData.ts` | ⚠️ pure math, browser parser | Haversine distance, Douglas-Peucker simplification, elevation-gain math are all pure. BUT parsing uses `DOMParser` — **browser-only**. |

### The single real porting task

`gpxMetaData.ts` parses XML with `DOMParser`, which does not exist in Node.

**Decision (see resolved questions):** bundle `fast-xml-parser` in core so
`analyzeGpx(gpxString)` runs identically in the browser, Node, and the CLI — the
simplest API for agents and builders, at the cost of one small dependency. The pure
math (Haversine distance, Douglas-Peucker, elevation gain) is unaffected and moves
over untouched; only the `DOMParser` call is replaced.

## What `@trainpace/core` exports (proposed surface)

Keep it boring, pure, and JSON-shaped. Everything returns plain objects/numbers.

```ts
// VDOT
calculateVdot(distanceMeters, timeSeconds): number
predictRaceTime(vdot, distanceMeters): number
calculateTrainingZones(vdot): TrainingZoneResult[]

// Presentation builders — RELOCATE from useVdotCalculator.ts (already pure, no React)
buildRacePredictions(vdot, unit): RacePrediction[]
buildTrainingZones(vdot): TrainingZone[]

// Pace
calculateTrainingPaces(raceTimeSeconds, raceDistanceMeters, paceUnit, opts?): PaceResults
calculateHeartRateZones(age): HeartRateZones

// GPX (parser injected or isomorphic)
analyzeGpx(gpxString): { metadata, displayPoints, thumbnailPoints }

// Formatters
formatTime(seconds), formatPace(seconds)
```

Design rules:
- **Exactly one runtime dependency** in core: `fast-xml-parser` (for GPX). Nothing
  else — guard this jealously; the value of the package is that it's tiny and trustable.
- **Pure functions only** — no I/O, no globals, no `Date.now()` surprises.
- **Meters & seconds everywhere** for inputs; `--unit km|miles` controls only the
  *pace output* formatting. This is a deliberate fix to the current code, where
  `calculateTrainingPaces` takes distance in the display unit — the core/CLI
  normalize on meters so `vdot` and `paces` never disagree.
- **Relocate, don't rewrite:** `buildRacePredictions` and `buildTrainingZones`
  currently live in the React hook `useVdotCalculator.ts` but are pure. Move them
  into core so the CLI reuses them instead of reimplementing the prediction list.
- Stable, documented types — the agent contract depends on them.

## The CLI (the agent's actual entry point)

Thin wrapper over core. JSON in, JSON out, one concept per command:

```bash
npx trainpace vdot  --distance 10000 --time 40:00
npx trainpace paces --distance 10000 --time 40:00 --unit km
npx trainpace gpx   ./boston.gpx
npx trainpace fuel  --duration 4:00:00 --weight 70   # later
```

- Every command emits JSON to stdout (add `--pretty` for humans).
- Non-zero exit + JSON error on bad input.
- No network, no auth, no state — trivial for an agent to call and parse.

## SKILL.md — the product runners actually "install"

A single markdown file that teaches an agent the commands above, with example
input/output for each. Dropped into Claude/Cursor/etc., it turns the CLI into a
capability:

> "Analyze my `boston.gpx`, compute my VDOT from my recent 10K (40:00), give me
> terrain-adjusted easy pace, and tell me where the hard climbs are."

The agent shells out to `trainpace gpx` and `trainpace vdot`, gets correct numbers,
and writes the narrative. This is the "GPX → skill" loop, fully realized, with no
server on our side.

## Roadmap (sequenced for Scene A — the runner is the hero)

**Phase 1 — Prove the skill (MVP).** A runner with the skill + a local CLI gets a real
terrain-aware answer.
1. New public repo, e.g. `trainpace-core` (npm workspaces: `core` + `cli`).
2. Move `vdot-math.ts` + pace `utils.ts` + GPX math into `core`; make GPX parsing
   isomorphic (porting task above). Publish `@trainpace/core`.
3. Thin CLI with `vdot`, `paces`, `gpx` — each prints JSON.
4. **`SKILL.md` — the headline deliverable.** Documents the commands with real example
   I/O *and* the runner-facing framing (what to ask, what you get back).
   - Done = an agent with the SKILL.md takes a GPX + a race time and produces a
     terrain-aware training picture, using only published open-source pieces.

**Phase 2 — Remove the friction (make it truly personal-runner-grade).**
5. Hosted HTTP API mirroring the CLI commands (JSON in/out) so the skill works with
   **no local install** — the unlock for non-technical runners.
6. SKILL.md gains a "no-install" path that points at the API instead of the CLI.

**Phase 3 — Reach.**
7. "Add TrainPace to your AI" page — runner-facing install instructions (not dev API
   docs). This is what "developer page" becomes once the hero is the runner.

## Explicitly out of scope for Phase 1

- Hosted HTTP API — Phase 2, not abandoned (it's the friction-remover, above).
- "Add to your AI" page — Phase 3; the repo README + SKILL.md suffice at first.
- Fuel planner extraction — `FuelPlannerV2` is large and Gemini-coupled; port the
  deterministic parts later, after the pure-math core lands.
- Firebase/auth/persistence — never belongs in the open core.

## Open questions — RESOLVED (2026-06-16)

1. **Package name & scope** → **`@trainpace/core`**, scoped under a new `@trainpace`
   npm org. Leaves room for `@trainpace/cli`, `@trainpace/react`, etc. under one
   namespace. (Free for public packages; org must be created on npm.)
2. **License** → **MIT.** Maximum adoption — anyone can put the math in their agent
   or app. The goal is reach, not lock-in.
3. **Web-app integration** → **trainpace.com consumes the published `@trainpace/core`**
   from npm like any dependency. True single source of truth. Trade-off accepted:
   new math must be published before the site can use it (mitigated by `npm link`
   during local dev).
4. **GPX parser** → **bundle `fast-xml-parser`** in core so `analyzeGpx(gpxString)`
   works everywhere with no setup. Costs core its zero-dependency status (now exactly
   one small, well-maintained dep) in exchange for the simplest possible agent/builder
   API. Worth it.
5. **Versioning** → **strict semver from v1.0.0.** The JSON shapes the CLI emits and
   the function signatures core exports are the public contract; breaking either is a
   major bump. Pre-1.0 (0.x) while the surface is still settling.
```
