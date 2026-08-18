# Product, SEO & Competitive Review

**Repos:** `trainpace` (web) + `gpx` (API)
**Reviewed:** 2026-08-18
**Scope:** SEO system end to end, agent-facing surface, cross-repo architecture, competitive position.
**Method:** every claim below is anchored to a measurement — the built `dist/`, production `curl`, or a script run against the real modules. Where I could not measure, I say so.

---

## 1. Honest assessment

### 1.1 What is genuinely impressive

1. **The agent-facing surface is real and it works in production.** Not a plan, not a README claim — verified live: `/calculator.md` returns `text/markdown` (3,978 b), `Accept: text/markdown` on the HTML URL returns the same, every HTML response carries `Link: <…/calculator.md>; rel="alternate"`, `llms-full.txt` is 697 KB, `llms-index.json` is 103 KB, and the MCP server exposes five tools with no auth. I have not seen another indie product with this stack shipped. It is 12–18 months ahead of the field.

2. **One content model rendering four formats** (`src/lib/llm/page-docs.ts` → prerendered HTML, 245 `.md` mirrors, `llms-full.txt`, `llms-index.json`). This is the decision that makes everything in §1.1.1 cheap instead of heroic, and it is the single most transferable idea in the codebase.

3. **A contract test for the rule that would silently break humans.** `verify-agent-routing` asserts Chrome/Firefox/Safari/`curl` Accept strings still get HTML, that q-values are compared properly, and that `q=0` is not a request. Half the assertions protect visitors rather than agents. Most people would have tested only the feature.

4. **Static answers inside JavaScript-only pages.** Reference tables computed at build time from the same functions the widgets use, so a non-JS reader gets quotable numbers. This is the rung almost nobody does, and it is why an assistant can cite TrainPace instead of a competitor's static table.

5. **The domain engine in `gpx`.** Minetti energy-cost curves, climb categorisation, grade-adjusted pace, typed `ConfigError`s with stable machine-readable codes, pure-compute/adapter separation for weather, a two-tier fail-open cache, AES-256-GCM token encryption. Reviewed in detail in `ARCHITECTURE_REVIEW.md`; still true.

6. **The Race Intelligence Engine is research, not a feature ticket.** Five independently-sourced GPX tracks of the same Boston course plus a deliberate synthetic control that must *not* match; the discovery that reported elevation gain spans 90–263 m for one identical course, and the consequent decision to keep gain out of the identity key. A numbered spec with stable `§` anchors cited from module headers, constants and fixtures. Very few products at this stage have evidence under their thresholds.

7. **The learning loop.** `.claude/LESSONS.md`, `verify-in-browser`, the agent roster by blast radius. The repo gets smarter between sessions instead of relearning.

### 1.2 What is not impressive

1. **~4,200 lines of SEO system that nothing imports.** `src/components/seo/*` (912 lines) is imported by zero files. `src/lib/seo/{schema-generators,meta-generators,internal-linking,content-generators,build-utils}` are reachable only through those dead templates. The live pages hand-roll their own Helmet and JSON-LD — a second, drifting implementation of what the dead code does. Two different `SeoPageConfig` types are exported from the same module (`features/seo-pages/types.ts` and `lib/seo/types.ts`); one has `id` and `relatedPageIds`, the other doesn't.

2. **A quality gate that never ran and could not have failed.** `validation.ts` (589 lines) ships `runPrePublishChecks`, `formatForCI` and `getCIExitCode`. Nothing called any of them — no npm script, no CI step — while `CLAUDE.md` instructed "run `validateAllPages()` before shipping SEO changes". And when finally run: **0 errors, 196/196 valid, average score 90 — with 164 of 196 titles over the 60-char limit the same repo documents** (p50 = 74, max 92), because every breach is a *warning*. A gate whose failures are all warnings is decoration.

3. **The whole site canonicalised to a host the sitemap never listed.** `lib/seo/types.ts` said `https://trainpace.com`; `generateSitemap.ts` said `https://www.trainpace.com`. All 245 built pages declared the former; all 248 sitemap URLs declared the latter; **both hosts answer 200 with no redirect**. Twenty files hardcoded the host independently.

4. **The most valuable page cluster shipped as a copy of the homepage.** All eight `/plan/*` pages — the "marathon training plan" cluster — prerendered with the homepage's `<title>`, description and body (899 chars of generic text), because `planSeoPages` was in `getAllSeoPaths()` but missing from the page-docs model. The `.md` mirrors said "TrainPace – Free Running Tools" too. Nobody had looked at the built artifact for that route.

5. **The core math is copy-pasted across two repos and has already drifted.** `gpx/lib/training/vdot.ts` is a hand-port of `vite-project/src/features/vdot-calculator/vdot-math.ts` — 11 identically-named exports, and its header says the port exists "so the public API and MCP server can serve the same numbers the web app shows." Measured divergence in non-comment lines today: **vdot 12, fuel 154, plan 183.** The fuel carb-ceiling change was made twice, by hand, in two commits. There is no test anywhere asserting the two produce the same output, and `llms.txt` tells agents the numbers are the same.

6. **The web app has no unit tests at all** — including for `vdot-math.ts`, `plan-math.ts` and `fuel-math.ts`, which *are* the product. The API repo tests its equivalents (~1,270 lines of Jest). The half that users actually touch is the untested half.

7. **The largest PSEO cluster is the thinnest.** Of 196 pages: race 120 (61%), pace 41, fuel 15, elevation 12, plan 8. The race pages measure 0.80–0.89 pairwise content similarity, and **149 of 196 pages carry no FAQ at all** (47 do), so three quarters of the surface has no `FAQPage` schema and nothing to win a long-tail answer with. The cluster with the highest commercial intent (plan) had eight pages and was broken.

8. **The blog stalled.** 31 posts, median 3.7 k characters, nothing published since 2026-06 and a gap at 2026-04. It is the one surface that compounds and it is idle.

**Bottom line:** the architecture instincts are excellent and the agent work is genuinely category-leading, but the SEO layer was built twice, verified never, and shipped broken in the places that mattered most. The gap is not knowledge — it is that no artifact-level check existed, so nothing that shipped wrong could announce itself.

---

## 2. SEO: what was wrong, what is fixed, what remains

### 2.1 Fixed in this branch

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | Two hosts, no redirect; 245 pages canonical to the non-sitemap host | `dist` 245/245 non-www; both hosts 200 live | One `SITE_URL` in `src/config/site.ts` feeding canonicals, JSON-LD, `og:url`, `.md` alternates and the sitemap |
| 2 | `/plan/*` prerendered as the homepage | 899 chars of generic body, homepage `<title>`, homepage `.md` | `planSeoPages` added to the page-docs model — now 2,900–3,400 chars of own content per page |
| 3 | `relatedPageIds` inert and mis-keyed (`plan-x` vs `plan:x`), one target with no page | 16 broken links reported by the linker | Keys fixed, dangling target dropped, links now render as a crawlable `linkList` in HTML **and** Markdown, plus a Related-plans section on the page |
| 4 | Every sitemap URL stamped with today's date on every build | 250/250 identical `lastmod` | `lastmod` derives from a fingerprint of each page's own content model; verified stable across runs and that only an edited page advances |
| 5 | `/dashboard` in the sitemap while `robots.txt` disallows it; `/elevationfinder` competing with `/elevation-finder` as a separate self-canonicalising page | both in `sitemap.xml`; identical titles in `dist` | Dropped from the sitemap; the legacy alias now canonicals to the modern path |
| 6 | The validator nothing ran | no caller outside the barrel | `npm run seo-check` + a CI job. Hard-fails on duplicate metadata, broken internal links, sitemap/robots contradictions and host mismatches; ratchets the length/FAQ backlog against `scripts/seo-baseline.json` |

Verified after the change: `tsc` clean, lint 0 errors (94 warnings, down from 96), `verify-agent-routing` all pass, `seo-check` pass, 245/245 built pages canonical to `www`, duplicate `<title>`s across the build down to the two intended aliases.

### 2.2 Remaining, in priority order

1. **Add the 301.** Code now agrees on `www`, but `trainpace.com` still answers 200. A canonical tag is a hint; a redirect is not. **Owner action:** Vercel project → Domains → set `www.trainpace.com` primary and redirect the apex. ~5 minutes. Until this lands, defect #1 is half-fixed.
2. **Titles: 164 over 60 chars** (baseline recorded, so it cannot get worse). The pattern is a long suffix: `… Race Prep - Pace, Fueling, and Course Strategy | TrainPace` is 60 chars before the race name. Shorten the template, not 164 strings.
3. **Descriptions: 117 over 160 chars.** Same shape, same fix.
4. **FAQ the top 20 pages by impression volume.** `FAQPage` schema is the cheapest rich-result and long-tail capture available, and 149 pages have none. Do the plan and race hubs first.
5. **Thin the race cluster or differentiate it.** 120 near-identical pages at 0.80–0.89 similarity is the classic doorway-page profile. Each one needs something only TrainPace can say — and you have it: the course's measured difficulty percentile from the race corpus (§4.2).
6. **Restart the blog.** One post a fortnight beats six in a week and then nothing.

---

## 3. Patterns worth taking further

1. **Contract-test the cross-repo math instead of porting it.** Do not merge the repos; generate a golden-vector file — a JSON of inputs → outputs produced by the web app's modules, committed into `gpx`, asserted by its Jest suite (and vice versa). A few hundred vectors would have caught all three drifts, costs an afternoon, and makes the `llms.txt` claim true rather than aspirational.
2. **Extend the "one content model" up into `<head>`.** Meta tags and JSON-LD are the last thing still written twice (dead generator + hand-rolled per page). Either wire the generators into the live templates or delete them — but stop paying for both.
3. **Take the `§`-anchor discipline from `gpx` into `trainpace`.** The web repo has PRDs and roadmaps with no stable anchors, so code cannot cite them and they rot. Number the sections; cite them from the config that implements them.
4. **Check the artifact, not the source.** Every defect in §1.2 items 3 and 4 was invisible in the source and obvious in `dist/`. The `verify-in-browser` skill exists for pixels; the equivalent for build output — parse `dist/**/index.html`, assert canonical host, title length, per-cluster body length — is now partly `seo-check` and should grow.
5. **Ship the negative control habit into the web repo.** The five-source Boston corpus with a synthetic non-match is the best testing idea in either repo, and none of that instinct has crossed over to the frontend.

---

## 4. Competitive position

### 4.1 Where the moat is not

Pace calculators are a commodity — there are hundreds, several with better domain authority. Plan builders are a funded market: Runna and TrainingPeaks will outspend a solo developer on content and app polish indefinitely. Strava integration is a feature they can turn on. Competing on these is renting attention.

### 4.2 Where the moat actually is

**The race corpus.** Deduped canonical courses built from independently-sourced tracks, with the elevation-comparability problem *solved* rather than ignored (nobody else has published that gain is 2.9× source-dependent for the same course), heading toward DEM normalisation and difficulty percentiles. Nobody — not Strava, not Runna — sells "this course is harder than 78% of marathons, and here is the specific 5 km window that will break your pace." That is a data asset that compounds with every ingest and cannot be cloned by shipping a feature.

**Being the callable layer.** Every assistant answering "what pace should I run for a 3:30 marathon?" today is estimating. You are the only running product I can find that is *callable*, and tool choice is sticky: once an agent's setup contains your MCP endpoint, it calls it every time. First-mover advantage here is real but time-limited — this window closes when a funded competitor notices.

**Method honesty as positioning.** "Daniels & Gilbert, cited, free, no login" is a genuine differentiator against apps whose numbers come from an opaque model, and it is exactly what makes an agent prefer you as a source.

### 4.3 The five moves I would make, in order

1. **Publish to the MCP registry and the directories.** Already scoped in `AI_AGENT_DISCOVERY.md` §1–3, still unchecked. It is the difference between having an endpoint and being discoverable, costs about half a day plus DNS access, and it is the highest-leverage unshipped item in either repo.
2. **Expose the race corpus as MCP tools** — `find_similar_races`, `race_difficulty_percentile`, `hardest_window`. This is the pairing that no competitor can answer: a unique data asset behind the one channel where you are early.
3. **Put percentiles on the race pages.** It fixes the thin-content problem (§2.2.5) with the one thing only you have, and turns 120 near-duplicates into 120 pages with a unique number on each.
4. **Report the agent channel.** You already log agent requests at the edge and MCP `initialize` client names — nobody else in this vertical can tell you which assistants their users run. Publish that as a quarterly note; it is both a product input and a distribution story that gets linked.
5. **Ship the comparison pages' second wave.** Five slugs exist; the PRD estimates half a day each. Bottom-of-funnel comparison traffic converts far better than "pace calculator" traffic — and now that the plan cluster actually renders, the funnel it feeds is no longer broken.

---

## 5. Handoff

**Verified in this branch:** host consolidation (245/245 pages), plan-cluster content (899 → ~3,000 chars), related-link rendering in HTML and Markdown, sitemap `lastmod` stability under re-run and correct advance on edit, `seo-check` gate green, no new lint errors, agent-routing contract intact.

**Not verified:** anything requiring the deployed site — the redirect (does not exist yet), Search Console impact, and whether the canonical flip re-consolidates existing signal. Re-check Search Console coverage two weeks after deploy.

**Blocked on you:** the apex → `www` 301 in the Vercel dashboard (~5 min); DNS or deploy access for MCP registry domain verification (~30 min).
