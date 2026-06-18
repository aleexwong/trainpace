# Eve Integration Spike — Hosting the TrainPace Running Coach

> Status: **Spike executed (2026-06-17).** Evaluates [Vercel Eve](https://vercel.com/blog/introducing-eve)
> (open-source TS agent framework, public preview launched 2026-06-17) as the vehicle
> for the *hosted* TrainPace coach — i.e. Phase 2 of `agent-platform-strategy.md`.
>
> ✅ A real agent project was built at `eve/` and **typechecks against the actual Eve
> 0.11.4 API plus `@trainpace/core`.** The code in `eve/` is verified, not illustrative.
> The inline sketches lower in this doc were the original guesses; see
> **Spike results** below for the corrections that real types forced.

## Why Eve, in one line

Eve turns capabilities into files — `tools/` (typed functions), `skills/` (Markdown),
`channels/` (Slack/web/Telegram) — and deploys on Vercel. TrainPace already has the
pieces that slot into each slot: `@trainpace/core` → tools, `SKILL.md` → skill, Vercel →
deploy target. Eve supplies the session/durability/approval/tracing layer we'd otherwise
have to build for a hosted API.

## How it maps to what we already built

| Eve concept | TrainPace piece | Effort |
|---|---|---|
| `tools/*.ts` (`defineTool` + Zod) | thin wrappers around `@trainpace/core` functions | ~an afternoon |
| `skills/*.md` | `docs/SKILL.draft.md`, promoted | already drafted |
| `instructions.md` | the "you are a running coach" framing from the skill | small |
| `channels/` | web + Slack/Telegram so a runner just chats | config |
| Vercel deploy | existing TrainPace hosting | none new |

The key point: **`@trainpace/core` is the foundation under every path.** Eve consumes it;
it does not replace it. Nothing we built is wasted if Eve turns out flaky.

## Proposed folder layout (separate from the web app)

```
packages/core/          ← @trainpace/core (built — the engine)
eve/                    ← the hosted coach agent (this spike)
├── agent.ts            ← defineAgent: model = claude (latest)
├── instructions.md     ← coach persona + the "always call tools, never guess" rule
├── skills/
│   └── trainpace.md    ← promoted from docs/SKILL.draft.md
├── tools/
│   ├── vdot.ts
│   ├── paces.ts
│   └── gpx.ts
└── channels/
    └── web.ts          ← start web-only; add slack/telegram later
```

## Tool sketches (illustrative — verify against Eve preview API)

The tools are tiny because the math already lives in `@trainpace/core`. They exist only
to give the agent typed, validated entry points.

```ts
// eve/tools/vdot.ts
import { defineTool } from "eve";
import { z } from "zod";
import {
  calculateVdot,
  buildTrainingZones,
  buildRacePredictions,
  classifyVdot,
} from "@trainpace/core";

export default defineTool({
  name: "vdot",
  description:
    "Compute VDOT (fitness score), training pace zones, and equivalent race-time " +
    "predictions from a single race performance. Use whenever a runner gives a race result.",
  parameters: z.object({
    distanceMeters: z.number().positive().describe("Race distance in meters, e.g. 10000 for 10K"),
    timeSeconds: z.number().positive().describe("Finish time in seconds, e.g. 2400 for 40:00"),
    unit: z.enum(["km", "miles"]).default("km").describe("Output pace unit"),
  }),
  async execute({ distanceMeters, timeSeconds, unit }) {
    const vdot = calculateVdot(distanceMeters, timeSeconds);
    return {
      vdot: Math.round(vdot * 10) / 10,
      level: classifyVdot(vdot),
      trainingZones: buildTrainingZones(vdot),
      racePredictions: buildRacePredictions(vdot, unit),
    };
  },
});
```

```ts
// eve/tools/paces.ts
import { defineTool } from "eve";
import { z } from "zod";
import { calculateTrainingPaces } from "@trainpace/core";

export default defineTool({
  name: "paces",
  description:
    "Training pace ranges (easy/tempo/interval/...) from a race time, with optional " +
    "heart-rate zones (age) and heat adjustment (temperature °F).",
  parameters: z.object({
    distanceMeters: z.number().positive(),
    timeSeconds: z.number().positive(),
    unit: z.enum(["km", "miles"]).default("km"),
    age: z.number().int().positive().optional(),
    temperatureF: z.number().optional(),
  }),
  async execute({ distanceMeters, timeSeconds, unit, age, temperatureF }) {
    return calculateTrainingPaces(timeSeconds, distanceMeters, unit, {
      age,
      temperature: temperatureF,
    });
  },
});
```

```ts
// eve/tools/gpx.ts
import { defineTool } from "eve";
import { z } from "zod";
import { analyzeGpx } from "@trainpace/core";

export default defineTool({
  name: "gpx",
  description:
    "Analyze a GPX route: total distance, elevation gain, high/low points, bounds. " +
    "Pass the raw GPX file contents as a string.",
  parameters: z.object({
    gpx: z.string().describe("Raw GPX XML contents"),
    filename: z.string().optional(),
  }),
  async execute({ gpx, filename }) {
    const { metadata } = analyzeGpx(gpx, filename);
    return metadata;
  },
});
```

```ts
// eve/agent.ts
import { defineAgent } from "eve";

export default defineAgent({
  model: "claude", // latest available Claude on Vercel
});
```

```md
<!-- eve/instructions.md -->
You are the TrainPace running coach. A runner is talking to you — they speak in race
times, distances, and feelings ("am I going too hard?"), not JSON.

Rules:
- NEVER compute VDOT, paces, or elevation yourself. Always call the `vdot`, `paces`,
  or `gpx` tools. The numbers must be exact, not estimated.
- Inputs to the tools are meters and seconds. Convert the runner's words (e.g. "40 minute
  10K" → distanceMeters 10000, timeSeconds 2400) before calling.
- Lead with the most actionable thing (easy pace, race predictions). Explain like a coach,
  not a spreadsheet. Mention zones only as relevant.
- If a GPX has no elevation data, say so — never invent climb numbers.
```

## Local dev → deploy loop

```bash
# in eve/
eve dev                 # local agent + web channel for testing
vercel deploy           # ship to production on existing TrainPace Vercel account
```

Because `@trainpace/core` is a normal npm dependency, the Eve project just installs it
(`npm i @trainpace/core` once published, or workspace link during the spike).

## What this would prove

- A runner chats in a web widget: *"I ran a 40:00 10K, here's my long-run gpx — am I going
  out too hard and where are the climbs?"* → the agent calls `vdot` + `gpx`, answers in
  plain language with **correct** numbers. That's Scene A, hosted, no install.

## Decision criteria (does Eve earn Phase 2?)

Adopt Eve for the hosted coach **only if**, after the spike:
- [ ] The preview API is stable enough to not break weekly mid-evaluation.
- [ ] `defineTool` + Zod wrapping of `@trainpace/core` is as trivial as it looks.
- [ ] Web channel UX is good enough to put in front of a real runner.
- [ ] Vercel runtime + model cost is acceptable for expected usage.

If any fail: **fall back to the original Phase 2** (a thin hosted HTTP API mirroring the
CLI). We lose nothing — the npm/CLI/SKILL.md path keeps serving builders and Claude
power-users in the meantime, on the same core.

## Honest risks

- **Week-one software.** Launched 2026-06-17; expect churn. Don't bet the whole product on
  it yet — prototype, don't commit.
- **Different distribution mode.** Eve = *we host a coach runners chat with.* npm/CLI/skill
  = *runners bring TrainPace into their own LLM.* Both are Scene A; they're complementary,
  not either/or. Keep both alive.
- **Cost is still ours.** Eve removes the engineering of a hosted API, not the model +
  infra bill.
- **Vercel-centric.** Open source and TS, but channels/deploy lean on Vercel. Fine given
  our stack; noted.

## Spike results (verified 2026-06-17)

Built `eve/` (a `trainpace-coach` Eve project) and typechecked it against the real
package. **Result: `tsc --noEmit` passes** — the agent's three tools wrap
`@trainpace/core` correctly against Eve's actual types.

### What the real API forced (corrections to the sketches above)

| My original guess | Reality (Eve 0.11.4) |
|---|---|
| `import { defineTool } from "eve"` | `import { defineTool } from "eve/tools"` |
| field `parameters` | field **`inputSchema`** |
| field `name` on the tool | **no `name`** — the tool name is the **filename slug** |
| project at `eve/tools/*` | project at **`eve/agent/tools/*`** (agent lives under `agent/`) |
| any Zod | **Zod 4 required.** Eve's `inputSchema` wants a `StandardJSONSchemaV1` whose `~standard` exposes a `jsonSchema` converter. Zod 3.25 has `~standard` but **not** that converter, so it fails to typecheck; Zod 4.4 adds it and passes. |
| `defineAgent({ model })` | confirmed — `model` is an AI SDK handle or a Gateway string like `"anthropic/<id>"`; **no `name` field** (identity derives from the package name). |

### Real files produced (all typecheck-clean)

```
eve/
├── package.json            # eve, zod@^4, @trainpace/core (file:../packages/core)
├── tsconfig.json
└── agent/
    ├── agent.ts            # defineAgent({ model })
    ├── instructions.md     # coach persona + "always call tools" rule
    ├── skills/trainpace.md # long-run readiness review procedure
    └── tools/
        ├── vdot.ts         # defineTool -> calculateVdot/build* from core
        ├── paces.ts        # defineTool -> calculateTrainingPaces
        └── gpx.ts          # defineTool -> analyzeGpx
```

### Two blockers to a *live* run (not wiring problems — environment)

1. **Eve requires Node ≥24**; this container runs Node 22, so `eve dev` / `eve init`
   refuse to run here. The live agent loop must be run on Node 24 (your machine or a
   Vercel deploy).
2. **No standalone model API key** in this environment (only Claude Code's own proxy,
   not repurposed). A live run needs a Vercel AI Gateway / Anthropic key.

Neither touches the integration itself — which is proven by the passing typecheck.

## To run it live (handoff — needs Node 24 + a model key)

```bash
cd eve
nvm use 24                 # or any Node >= 24
npm install
# set a model key for the Vercel AI Gateway / Anthropic, e.g.:
#   export AI_GATEWAY_API_KEY=...   (or the key your gateway expects)
# confirm agent.ts `model` is a model id your gateway serves
npm run typecheck          # expect: clean (already verified here)
npm run dev                # eve dev — open the local web channel
```

Then ask the coach the long-run question and confirm it calls `gpx` + `vdot` and
answers with correct numbers. That closes the Phase-2 evaluation.
