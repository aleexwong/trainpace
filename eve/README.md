# TrainPace Coach — Eve agent

A hosted running coach: an [Eve](https://eve.dev) agent that wraps
[`@trainpace/core`](../packages/core) so runners can chat in plain language and get
**exact** VDOT, training paces, and GPX route analysis — computed, never guessed.

> The agent's three tools (`vdot`, `paces`, `gpx`) just call `@trainpace/core`. All the
> running math lives there; this project is the conversational shell around it.

## Layout

```
eve/
├── package.json            # eve, zod@^4, @trainpace/core (file:../packages/core)
├── tsconfig.json
└── agent/
    ├── agent.ts            # defineAgent({ model })
    ├── instructions.md     # coach persona + "always call tools, never guess"
    ├── skills/trainpace.md # long-run readiness review procedure
    └── tools/
        ├── vdot.ts         # -> calculateVdot / buildTrainingZones / buildRacePredictions
        ├── paces.ts        # -> calculateTrainingPaces
        └── gpx.ts          # -> analyzeGpx
```

## Requirements

- **Node ≥ 24** (Eve refuses to run on older Node).
- A model key for the **Vercel AI Gateway** (or the provider your `agent.ts` `model`
  points at). The `model` field uses an AI SDK handle / Gateway slug like
  `"anthropic/<id>"` — set it to a Claude id your gateway serves.
- **Zod 4** specifically — Eve's `inputSchema` needs the `~standard.jsonSchema`
  converter that Zod 4 exposes (Zod 3 does not, and will fail to typecheck).

## Run it locally

```bash
cd eve
nvm use 24                       # or any Node >= 24
npm install                      # links ../packages/core (build it first if needed)
export AI_GATEWAY_API_KEY=...     # the key your gateway expects

npm run typecheck                # tsc --noEmit — should be clean
npm run dev                      # eve dev — opens the local web channel
```

If `@trainpace/core` hasn't been built, run `npm run build` in `../packages/core` first
(the `file:` dependency resolves to its `dist/`).

## Try it

In the web channel, ask:

> "I ran a 40:00 10K last month. Here's my Sunday long-run gpx — am I going out too
> hard, and where are the climbs?"

Expected: the coach calls `gpx` (route distance + elevation) and `vdot` (easy pace),
then answers like a coach — target easy pace, and how to handle the hills — with
numbers that match the CLI (`npx @trainpace/core vdot --distance 10000 --time 40:00`).

## Status

Built and **typecheck-verified** against Eve 0.11.4 + `@trainpace/core`. The live model
loop has not been run in CI (needs Node 24 + a model key). See
[`../docs/eve-integration-spike.md`](../docs/eve-integration-spike.md) for the full
evaluation, the API corrections the real types forced, and the Phase-2 decision criteria.

## Deploy

`vercel deploy` from this folder ships it to production on your existing TrainPace
Vercel account. Add channels (`agent/channels/slack.ts`, etc.) to reach runners beyond
the web widget.
