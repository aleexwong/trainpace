# Case-study workshop: Map costs without removing useful maps

Status: author worksheet, not a finished case study. Prepared from `c3ca2f1cfed720d36a384ef28a971690eb189d7e` on 8 November 2026.

## Topic shortlist

Pick one story for now; the alternatives are a backlog, not three writing assignments.

- **Start here: static maps by default, interactive maps when needed.** Trade recurring vendor requests against interaction and implementation complexity. [Starting evidence](https://github.com/aleexwong/trainpace/blob/c3ca2f1cfed720d36a384ef28a971690eb189d7e/vite-project/docs/mapbox.md).
- **One content model for HTML and Markdown.** Generate two representations without maintaining two versions of the page copy. [Starting evidence](https://github.com/aleexwong/trainpace/blob/c3ca2f1cfed720d36a384ef28a971690eb189d7e/vite-project/src/lib/llm/page-docs.ts).
- **Correct split labels and terrain totals.** Explain how a 3.41 km route exposed rounding and aggregation errors. [Starting evidence](https://github.com/aleexwong/trainpace/blob/c3ca2f1cfed720d36a384ef28a971690eb189d7e/README.md).

## Recommended story: evidence already in the repository

- Static map images are the default; interactive GL maps are used when panning, zooming or marker tracking is needed.
- The documented request path uses an IndexedDB image cache, in-flight deduplication and a request budget. Image dimensions are quantized to reduce cache misses.
- The budget falls back from localStorage to sessionStorage to memory. With no persistent budget storage, navigation across distinct routes can escape the intended cross-page limit.
- The repository documents 13 consecutive loads of one Boston race page producing one Mapbox request. This is an existing documented observation, not a measurement made for this draft.
- Client-side budgets can be bypassed. Token URL restrictions and vendor account controls are separate protections; do not describe the browser budget as an account-wide spending guarantee.

Source trail:

- [vite-project/docs/mapbox.md](https://github.com/aleexwong/trainpace/blob/c3ca2f1cfed720d36a384ef28a971690eb189d7e/vite-project/docs/mapbox.md)
- [vite-project/src/lib/mapbox/budget.ts](https://github.com/aleexwong/trainpace/blob/c3ca2f1cfed720d36a384ef28a971690eb189d7e/vite-project/src/lib/mapbox/budget.ts)
- [vite-project/src/lib/mapbox/staticMap.ts](https://github.com/aleexwong/trainpace/blob/c3ca2f1cfed720d36a384ef28a971690eb189d7e/vite-project/src/lib/mapbox/staticMap.ts)

## Alex's first pass

Spend 20 minutes answering these in rough bullets, in your own words, before asking an assistant to edit. "I don't remember" or "not measured" is a useful answer.

1. What triggered this work: a bill, repeated requests you observed, or a risk you anticipated? Give one concrete event. Do not imply a billing incident if there was none.

   **Alex:** [write here]

2. What did you personally choose or change, and what did an AI assistant propose or implement?

   **Alex:** [write here]

3. Did you actually consider always-interactive maps, relying on HTTP caching, or a proxy? Discuss only alternatives you genuinely considered.

   **Alex:** [write here]

4. Why was the extra cache/budget code worth maintaining at the traffic level you had?

   **Alex:** [write here]

5. What did you observe after shipping? If no billing comparison exists, use the request-count observation with its narrow conditions.

   **Alex:** [write here]

## One small evidence task

Reproduce the same-route reload observation using the existing app and browser network panel. Record date, build, route, storage state, cold/warm cache, number of loads and vendor request count. Filter request types carefully; a GL map load and a static-image request are different units. A screenshot or redacted request log is enough; do not build new measurement infrastructure.

**Evidence or limitation, added by Alex:** [write here]

## Turn the answers into a short case study

Aim for 300–450 words. Write this first pass yourself; keep one decision and one concrete example.

- **Problem (50–70 words):** who was affected, the trigger and the constraint.
- **Decision (100–140 words):** what changed, why, and an alternative you genuinely considered.
- **Verification and limits (80–120 words):** what you checked, observed result, and what remains uncertain.
- **Reflection (40–70 words):** what you would keep or change next time.

**Author draft:** [Alex writes here after the bullets.]

## Editing agreement

- Alex supplies the experience, reasoning, contribution boundaries and final wording.
- An assistant may locate evidence, challenge unsupported claims and edit Alex's draft for clarity. Keep unknowns visible; do not generate autobiographical reasoning or fill the author fields from assumptions.
- Distinguish "I decided", "an assistant implemented" and "I verified" where they differ.
- No dollar savings, traffic growth or account-wide cost guarantee without evidence.
- Keep this PR in draft until Alex has written the narrative, checked its sources and removed these workshop prompts. No application changes are part of this exercise.
