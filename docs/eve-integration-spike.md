# Eve Integration Spike — Hosting the TrainPace Running Coach

> Status: **Spike / proposal.** Evaluates [Vercel Eve](https://vercel.com/blog/introducing-eve)
> (open-source TS agent framework, public preview launched 2026-06-17) as the vehicle
> for the *hosted* TrainPace coach — i.e. Phase 2 of `agent-platform-strategy.md`.
>
> ⚠️ Eve is week-one preview software. Every API shape below is **illustrative**, drawn
> from the launch post, and must be checked against the live Eve docs before relying on
> it. Treat this as "what the fit looks like," not copy-paste-ready code.

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

## Next step (when ready)

Promote `docs/SKILL.draft.md` → `eve/skills/trainpace.md`, scaffold the three tool files
above, run `eve dev`, and try the long-run question in a web channel. Timebox to an
afternoon — that's enough to judge the fit.
