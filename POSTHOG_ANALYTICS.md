# PostHog Analytics

Working notes for TrainPace analytics: decisions, rationale, and the things
code can't state for itself.

Deliberately **not** duplicated here: the event taxonomy (it lives in
`vite-project/src/lib/analytics.ts` as a typed union once that lands — a
markdown copy would drift) and stack status (that lives in git). Prose in this
file references source as `path:line` rather than quoting it, so it stays
correct as the code moves.

---

## Current state (audited 2026-07-26)

Two independent integrations feeding one PostHog project.

### Frontend — `trainpace` (`posthog-js` ^1.288.0)

| What | Where |
|---|---|
| Provider init | `vite-project/src/main.tsx:13-23` — wraps `<App/>` inside `AuthProvider` + `BrowserRouter`; `capture_exceptions: true` + `PostHogErrorBoundary`, so error tracking is live |
| Identity | `src/features/auth/AuthContext.tsx:29-37` — `identify(uid, {email, name})` on sign-in, `reset()` on logout, guarded by `prevUidRef` so anonymous `distinct_id`s don't fragment on every page load |
| Custom events | Exactly one: `mcp_docs_copy` at `src/pages/McpDocs.tsx:161` |
| Env vars | `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST` — typed at `src/vite-env.d.ts:13-14` |
| CSP | `vercel.json:20` allowlists `us.i.posthog.com` + `us-assets.i.posthog.com` in both `script-src` and `connect-src` |
| Prerender | `prerender.jsx` is a separate React entry that never imports `main.tsx` — the 80+ static pages fire no events at build time |

### Backend — `gpx` (server-side, no SDK)

`lib/analytics.ts` posts batches to `https://us.i.posthog.com/batch/`, called
from `api/mcp.ts:70` (rate-limit case) and `:101-104` (normal path, awaited
*after* the MCP response so the serverless runtime doesn't freeze first).

- Events: `mcp_initialize`, `mcp_tool_call`, `mcp_tools_list`, `mcp_rate_limited`
- Anonymous by construction: `distinct_id` = `mcp:` + `sha256(ip-or-uid)[0:16]`,
  with `$process_person_profile: false`. Raw IPs never leave the server.
- Fails open: no `POSTHOG_API_KEY` is a no-op, 1500ms `AbortController` timeout,
  network errors swallowed. Covered by `tests/analytics.test.ts`.

This half is sound and needs no changes beyond documenting its env vars.

### Also live

GA4 (`vite-project/src/lib/GoogleAnalytics.tsx`) runs alongside PostHog — two
analytics payloads on every page load.

---

## Known gaps

1. **SPA pageviews are probably not firing.** `defaults` is unset in
   `main.tsx`, so `posthog-js` keeps legacy behavior: `$pageview` on init only,
   not on React Router transitions. A user going `/calculator → /plan → /fuel`
   would register one pageview.
   **Verify against `node_modules/posthog-js` before writing the fix** — this
   is inferred from the library's migration behavior, not yet confirmed against
   the installed version.
2. **The product is uninstrumented.** One custom event, and it's on the MCP
   docs page. No funnel is constructible — autocapture gives clicks keyed on
   fragile DOM selectors with no properties.
3. **Privacy policy is incomplete.** `src/pages/Privacy.tsx:174-180` names
   Google Analytics only; the cookies bullet at `:89-90` says "via Google
   Analytics". `identify()` ships email and name to PostHog today.
4. **Env vars undocumented** — absent from `vite-project/.env.example`,
   the Environment section of `CLAUDE.md`, and gpx's `.env.example`.
5. **No reverse proxy.** `us.i.posthog.com` is on every adblock list, so the
   frontend silently loses events that the server-side MCP path doesn't.
6. **`README.md:211` claims feature flags.** None are read anywhere in the app.

**Not answerable from code:** session recording is a PostHog *project* setting,
not a code flag. Check the PostHog UI — if it's enabled, `Privacy.tsx` has to
disclose it and the scope of gap 3 grows.

---

## Event taxonomy — PROPOSED, not agreed

Naming: `noun_verb`, snake_case, verb in past tense. One event per completed
user outcome, not per click — autocapture already covers clicks.

| Event | Fires when | Properties | PR |
|---|---|---|---|
| `pace_calculated` | Pace calculator returns a result | `distance`, `unit`, `source` (`direct` \| `seo_page`) | 5 |
| `vdot_calculated` | VDOT calculator returns a result | `race_distance`, `unit` | 5 |
| `plan_generated` | Training plan builder produces a plan | `race_distance`, `weeks`, `days_per_week`, `experience_level` | 5 |
| `plan_saved` | Plan persisted | `destination` (`localstorage` \| `firestore`) | 5 |
| `workout_completed` | User marks a workout done | `workout_type`, `week_index` | 5 |
| `gpx_uploaded` | GPX file accepted for analysis | `file_size_bucket` | 6 |
| `elevation_analysis_completed` | Analysis renders | `distance_bucket`, `elevation_gain_bucket`, `has_gap` | 6 |
| `route_shared` | Shareable route URL created | `method` | 6 |
| `fuel_plan_generated` | Fuel planner returns a plan | `race_distance`, `duration_bucket`, `carb_target` | 6 |
| `poster_exported` | Poster download completes | `format`, `template` | 6 |
| `goal_created` | Goal saved | `goal_type`, `race_distance` | 6 |
| `signup_started` | Google OAuth flow opened | `entry_feature`, `entry_path` | 7 |
| `signup_completed` | First successful auth for a new uid | `entry_feature` | 7 |

`signup_started` / `signup_completed` with `entry_feature` is the pair that
answers the actual business question: which tool converts.

### Property rules

- **Bucket continuous values.** `distance_bucket: "21-30km"`, never
  `distance: 23.7`. Raw numbers make PostHog breakdowns unusable and blow up
  property cardinality.
- **No PII in event properties.** Email and name belong in person properties
  via `identify()` only — they are already there.
- **No free text, ever.** No route names, goal names, or plan titles.
  Unbounded cardinality, and users name routes after their home address.

### Deliberately not tracked

Recorded so it isn't "helpfully" re-added later:

- GPX coordinates or route geometry — privacy, and useless in aggregate
- Any user-entered string (see property rules)
- Per-field or per-keystroke form interaction — autocapture covers the
  diagnostic need at a fraction of the volume
- Blog scroll depth — not worth the event volume until there's a content
  strategy for it to inform

### Open naming question

The one existing event, `mcp_docs_copy`, doesn't fit the past-tense convention
(`mcp_docs_copied` would). Either grandfather it or rename it while the
historical volume is still near zero — renaming later orphans the history.

---

## Open decisions

Blocking, in the sense that guessing wrong is expensive to undo:

1. **GA4 and PostHog both loaded.** Keep both, or is PostHog meant to replace
   GA4? Determines whether the cleanup PR is a one-line README edit or a GA4
   removal.
2. **Event names above.** Cheap to redline now, expensive after 30 call sites
   and months of history.
3. **Branch permission.** The stack needs eight branches; this session is
   scoped to `claude/posthog-integration-overview-qk9j6z`.

---

## Stack plan

Ordering principle: config correctness first, so any data collected afterward
is trustworthy; risky-but-file-isolated changes early, since they're cheap to
revert when nothing above them touches the same files; instrumentation last,
because it's the widest and most bikesheddable diff.

| # | Branch | Contents |
|---|---|---|
| 1 | `posthog/01-config` | `defaults` fix + init guard + env docs (`.env.example`, `CLAUDE.md`) |
| 2 | `posthog/02-privacy` | `Privacy.tsx` PostHog disclosure |
| 3 | `posthog/03-proxy` | Vercel `/ingest` rewrite + `api_host`/`ui_host` + CSP |
| 4 | `posthog/04-event-layer` | Typed `src/lib/analytics.ts`; migrate `mcp_docs_copy` as the sole call site |
| 5 | `posthog/05-instrument-core` | Calculators + training plan |
| 6 | `posthog/06-instrument-tools` | Elevation, fuel, poster, goals |
| 7 | `posthog/07-instrument-auth` | Signup funnel |
| 8 | `posthog/08-cleanup` | README feature-flag claim, GA4 decision |

Separately, in `gpx`: a single standalone PR adding `POSTHOG_API_KEY` and
`POSTHOG_HOST` to `.env.example`. No stacking needed.

**Gotcha for PR 3:** Vercel evaluates `rewrites` in order, and `vercel.json:4-9`
has a catch-all `/(.*)` → `/index.html`. The `/ingest` rules must go *above*
it, or every event silently POSTs into the SPA shell.

**Gotcha for PR 3:** without `ui_host`, the PostHog toolbar and "view in
PostHog" links break once `api_host` points at the proxy.

Verification gate on every PR — there are no unit tests in this repo:
`npm run build && npm run lint && npm run test:e2e`. PR 1's init guard is what
keeps e2e green, since CI runs without a PostHog key.
