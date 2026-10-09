# PRD: Competitor Comparison SEO Pages

**Status:** Draft
**Owner:** TrainPace (solo dev)
**Type:** Config-only PSEO addition — fastest shippable roadmap item
**Est. effort:** ~half a day (content authoring, not engineering)

---

## 1. Summary

Add a set of "TrainPace vs. \<competitor\>" and "free \<competitor\> alternative" landing pages
using the **existing** programmatic-SEO (PSEO) system. Each page is a single config object in
`calculatorSeoPages` — no new components, routes, or backend. Routing, prerendering, and the
sitemap pick the pages up automatically.

This is the cheapest, fastest lever to capture high-intent, bottom-of-funnel search traffic
("runna alternative", "is strava good for training plans", "free trainingpeaks alternative")
from people already comparing tools — i.e. ready to try one.

## 2. Why this, why now

- **Direct reuse of an existing system.** `SeoPageConfig` → `calculatorSeoPageMap` →
  `CalculatorSeoLanding` renders intro, bullets, CTA, FAQ, and HowTo with schema markup. No code.
- **Auto-wired.** `getAllSeoPaths()` feeds both `vite.config.ts` (prerender) and
  `scripts/generateSitemap.ts`. Adding a config entry ships a prerendered, indexed page.
- **Highest-intent keywords TrainPace can rank for.** Comparison and "alternative" queries convert
  far better than generic "pace calculator" traffic.
- **On-brand.** Reinforces the "free, no-login, self-coached" positioning against Runna (the direct
  competitor), TrainingPeaks (too heavy/expensive), and Strava (a logger, not a planner).

## 3. Goals & non-goals

**Goals**
- Ship 5 comparison landing pages within the existing PSEO framework.
- Rank for competitor-comparison and "free alternative" keywords.
- Funnel visitors into the free tools (pace calculator, plan builder, elevation, fuel).

**Non-goals**
- No new React components, routes, or comparison-table UI (uses existing `bullets` + `faq` fields).
- No disparagement of competitors — factual, fair positioning only.
- No backend, no auth, no data model changes.

## 4. Scope — pages to ship

All live under the pace tool (`tool: 'pace'`, path `/calculator/<slug>`), rendered by
`CalculatorSeoLanding`. CTA points to the most relevant free tool.

| Slug | Primary intent | CTA target |
|------|----------------|-----------|
| `trainpace-vs-runna` | "trainpace vs runna", "runna vs trainpace" | `/plan` |
| `free-runna-alternative` | "free runna alternative", "runna alternative free" | `/plan` |
| `trainpace-vs-trainingpeaks` | "trainpace vs trainingpeaks", comparison | `/plan` |
| `free-trainingpeaks-alternative` | "free trainingpeaks alternative" | `/calculator` |
| `strava-vs-trainpace-for-training` | "strava for training plans", "strava pace zones" | `/calculator` |

(Runna gets two pages because it's the direct competitor and "free alternative" is a distinct,
high-value query from the head-to-head comparison.)

## 5. Content requirements (per page)

Each page is one `SeoPageConfig` object appended to `calculatorSeoPages` in
`src/features/seo-pages/seoPages.ts`, using `generatePageId('pace', slug)` for the `id`.

Required fields and content rules:

- **`title`** — < 60 chars, includes competitor name + "TrainPace". e.g.
  `"TrainPace vs Runna - Free Running Plans & Paces | TrainPace"`.
- **`description`** — < 160 chars, states the honest differentiator (free, no app, calculators + course pacing + fuel).
- **`h1`** — the human comparison headline, e.g. `"TrainPace vs. Runna"`.
- **`intro`** — 1–2 sentences: who each tool is for, and the one-line TrainPace angle.
- **`bullets`** — 3–5 items acting as the comparison points (what TrainPace does that's free /
  where the competitor is stronger). Fair, factual.
- **`cta`** — `{ href, label }` to the relevant free tool (see table).
- **`faq`** — 3–4 items targeting the actual search queries:
  - "Is TrainPace a free alternative to \<competitor\>?"
  - "What does \<competitor\> do that TrainPace doesn't?" (honest: device sync, adaptive plans, social)
  - "Can I use TrainPace and \<competitor\> together?" (yes — Strava/Garmin GPX export → TrainPace)
- **`howTo`** — optional; "How to switch from \<competitor\> to TrainPace" or "get your paces in 3 steps".

**Positioning guardrails (apply to every page):**
- Runna: acknowledge adaptive plans + audio + device sync; TrainPace wins on free, breadth of free
  calculators, GPX course pacing, and fuel planning.
- TrainingPeaks: acknowledge coach tools + training-load (TSS/PMC); TrainPace is the simple free
  option for self-coached runners who don't need that depth.
- Strava: acknowledge it's the best logger/social network; frame TrainPace as complementary — Strava
  records, TrainPace tells you what pace/plan/fuel and analyzes the course. Emphasize GPX import.

## 6. Implementation steps

1. Append 5 `SeoPageConfig` objects to `calculatorSeoPages` in
   `src/features/seo-pages/seoPages.ts`.
2. Run `validateAllPages()` (via build or the seo lib helper) — titles < 60, descriptions < 160.
3. `npm run generate-sitemap` to add the new paths to `sitemap.xml`.
4. `npm run build` (tsc + prerender) — confirm the 5 pages prerender to static HTML.
5. `npm run lint`.
6. (Optional) Add a Playwright smoke check that each `/calculator/<slug>` renders its H1.

## 7. Acceptance criteria

- [ ] 5 pages resolve at their `/calculator/<slug>` paths and render H1, intro, bullets, CTA, FAQ.
- [ ] Each page appears in `sitemap.xml` after `generate-sitemap`.
- [ ] Each page prerenders to static HTML in the build output.
- [ ] All titles < 60 chars, descriptions < 160 chars (`validateAllPages` passes).
- [ ] CTAs link to a working free tool route.
- [ ] `npm run build` and `npm run lint` pass; no console/type errors.
- [ ] Content is factually fair to competitors (no false claims).

## 8. Risks & mitigations

- **Comparison-UI expectation.** These pages use bullets + FAQ, not a side-by-side table. If a
  visual table is later wanted, that's a separate component task — explicitly out of scope here to
  keep this shippable today.
- **Competitor accuracy drift.** Feature claims (e.g. Runna pricing, TP training-load) can change.
  Keep claims high-level ("subscription", "device sync", "training-load metrics") rather than
  citing exact prices/numbers that go stale.
- **Thin/duplicate content risk.** Each page must have genuinely distinct intro/bullets/FAQ, not a
  templated find-replace, or it risks being treated as low-value by search engines.

## 9. Success metrics (post-launch)

- Impressions/clicks on comparison + "alternative" queries (Search Console).
- CTR from these pages into `/plan` and `/calculator`.
- Assisted conversions to sign-up from comparison-page sessions (PostHog).

## 10. Follow-on

**Batch 2 — shipped.** A second set of comparison pages was added using the same config-only PSEO
pattern, extending coverage from paid-app competitors into calculators, device ecosystems, and
training-log platforms:

| Slug | Competitor angle | CTA target |
|------|------------------|-----------|
| `trainpace-vs-vdot-o2` | Official paid Jack Daniels VDOT app | `/vdot` |
| `trainpace-vs-mcmillan-running-calculator` | Respected free/paid pace calculator + plans | `/calculator` |
| `trainpace-vs-garmin-coach` | Free but device-locked adaptive plans | `/plan` |
| `trainpace-vs-nike-run-club` | Free audio-guided app + basic plans | `/plan` |
| `trainpace-vs-final-surge` | Training log + coach-athlete platform | `/plan` |

Same guardrails apply: fair, factual positioning; no exact prices; distinct intro/bullets/FAQ per
page. All titles < 60 chars, descriptions < 160 chars.

**Still open:**

- Optional reusable comparison-table component if the format proves out (still deliberately out of
  scope — a separate component task, kept out to stay config-only and shippable).
- Additional slugs (e.g. a `free-<competitor>-alternative` variant, or newer apps) once these
  batches show traction.
