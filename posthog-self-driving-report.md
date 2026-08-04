# PostHog Self-driving setup report

**Project:** TrainPace (project 524328)  
**Date:** 2026-08-04  
**Inbox:** https://us.posthog.com/project/524328/inbox

## Summary

PostHog Self-driving has been configured for TrainPace. Six signal sources are now active (health checks, error tracking, session replay, and support), five scouts are running (general, product-analytics, web-analytics, web-vitals, and health-checks), and GitHub is connected so findings can be researched and fixed in code. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/524328/inbox) within approximately 30 minutes.

---

## AI data processing

Approved (enforced by the wizard's organization-level AI opt-in gate before this run started).

---

## GitHub

| Status | Detail |
|---|---|
| Connected during this run | Integration id 200436, account `aleexwong` |

GitHub access lets Self-driving look up code context behind findings and open draft PRs for issues it judges automatically fixable.

---

## Products enabled

The `products-enable` MCP tool was not available in this deployment. The three products must be turned on manually — see Follow-ups below.

| Product | Status | Notes |
|---|---|---|
| Session Replay | **Follow-up required** | Enable in PostHog → Settings → Session replay → "Record user sessions". No `disable_session_recording` override found in `posthog.init` — the server flip will take effect immediately once toggled. |
| Error Tracking | **Follow-up required** | Enable in PostHog → Settings → Error tracking → "Enable exception autocapture". The SDK already sends exceptions (`capture_exceptions: true` in `vite-project/src/main.tsx:18`) — only the server-side toggle is missing. |
| Support (Conversations) | **Follow-up required** | Enable from the product sidebar in PostHog. Tickets only arrive once an inbound channel (email / inbox / Slack) is also connected — see Follow-ups. |

`posthog.init` in `vite-project/src/main.tsx` was checked: no `disable_session_recording` or `capture_exceptions: false` overrides found — the init is clean.

---

## Signal sources

| source_product | source_type | Action | Config id |
|---|---|---|---|
| `health_checks` | `health_issue` | **Enabled** | `019fcbd2-b64d-7a17-bdb2-6af7eab6ee58` |
| `error_tracking` | `issue_created` | **Enabled** | `019fcbd2-ba71-701c-b2a9-ea73d9aadf33` |
| `error_tracking` | `issue_reopened` | **Enabled** | `019fcbd2-be01-7ac0-9774-2bf4a19cc7a4` |
| `error_tracking` | `issue_spiking` | **Enabled** | `019fcbd2-c1eb-7d63-9fd0-e521a752a1ae` |
| `session_replay` | `session_analysis_cluster` | **Enabled** (sample rate 0.1) | `019fcbd2-c5dd-7cc7-b743-9d129ab80bc3` |
| `conversations` | `ticket` | **Enabled** (dormant until a channel is connected) | `019fcbd2-c7bf-7680-8a6e-9a8f5986266d` |
| `signals_scout` | `cross_source_issue` | **Skipped** — on by default; a config row is only needed to opt out | — |

---

## Connected tools

User selected **None of these** at the connected-tools step. No external issue-tracker, error-tracker, support-desk, or other third-party sources were connected.

| Tool | Status |
|---|---|
| GitHub Issues | Not used |
| Linear | Not used |
| Jira | Not used |
| Sentry | Not used |
| Zendesk | Not used |

---

## Scout troop

**Run budget:** 100 runs/day, 3 runs/tick, 0 runs used today  
**Early-access banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (5)

| Scout | Reason |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and surfaces no specialist covers |
| `signals-scout-product-analytics` | Confirmed heavy analytics usage: pace calculator, VDOT, training plan builder, and fuel planner all produce events |
| `signals-scout-web-analytics` | 80+ prerendered SEO pages; traffic health and landing-page regressions are directly tied to growth |
| `signals-scout-web-vitals` | PWA with SEO focus — Core Web Vitals directly affect Google rankings for trainpace.com |
| `signals-scout-health-checks` | Catches instrumentation gaps, outdated SDKs, and PostHog setup health issues proactively |

### Disabled (22)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the native `error_tracking` signal source (step 4) — native source is authoritative |
| `signals-scout-session-replay` | Covered by the native `session_replay` signal source (step 4) — native source is authoritative |
| `signals-scout-surveys` | No surveys found in this project |
| `signals-scout-ai-observability` | No `$ai_*` events; Gemini AI calls go through the backend and are not instrumented via PostHog AI SDK |
| `signals-scout-revenue-analytics` | No payment SDK connected yet (Stripe integration is planned but not shipped) |
| `signals-scout-feature-flags` | No feature flags confirmed active in the codebase |
| `signals-scout-experiments` | No A/B experiments found |
| `signals-scout-logs` | PostHog Logs product not in use |
| `signals-scout-csp-violations` | No CSP reporting configured |
| `signals-scout-customer-analytics` | Not a B2B / group-analytics product |
| `signals-scout-data-pipelines` | No CDP destinations or batch exports configured |
| `signals-scout-data-warehouse` | No external data warehouse sources connected |
| `signals-scout-replay-vision` | No Replay Vision scanners configured |
| `signals-scout-anomaly-detection` | Not a primary surface; general scout covers cross-product anomalies |
| `signals-scout-observability-gaps` | Not enabled; revisit once more insights/dashboards are saved in PostHog |
| `signals-scout-inbox-validation` | Fresh setup — no resolved reports to validate yet |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry spans |
| `signals-scout-conversations` | Support has no inbound channel connected yet |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` telemetry |
| `signals-scout-skills-store` | Not relevant for this project |
| `signals-scout-tasks` | Fresh setup — no completed tasks to validate |
| `signals-scout-insight-alerts` | No insight alerts configured |

Re-enable follow-up: if you later add feature flags, experiments, surveys, or connect Stripe revenue, enable the matching scout in PostHog → Self-driving → Scouts.

---

## Custom scouts

Two custom scouts were proposed; the user cancelled the proposal. Both can be revisited once custom PostHog events are added to the codebase.

### Proposed (not created)

**Watch your onboarding funnel for activation drops**  
Surface: `$pageview` at `/onboarding` → `/dashboard` among newly identified users.  
Discriminator: drop in onboarding → dashboard completion rate.  
Why uncovered: `signals-scout-product-analytics` needs saved PostHog funnels; `signals-scout-web-analytics` watches traffic channels, not auth funnels.

**Watch your SEO pages for traffic that never reaches the tools**  
Surface: `$pageview` on `/calculator/:seoSlug`, `/plan/:seoSlug`, `/fuel/:seoSlug` → base tool pages.  
Discriminator: drop in progression rate from SEO slug pages to actual tool usage.  
Why uncovered: `signals-scout-web-analytics` watches bounce/404 but not the SEO-landing→tool-usage conversion funnel specifically.

### Surfaces considered and ruled out

| Surface | Filter that killed it |
|---|---|
| AI Fuel Planner usage | No custom PostHog events — Gemini calls tracked only in Firestore, not PostHog; $ai_* events absent |
| GPX upload / analysis pipeline | Error tracking native source covers unhandled failures; session replay covers UX breakdowns |
| Feature flags / experiments | None confirmed active in codebase |

**Noise escape hatch:** if any scout turns out too noisy, set `emit: false` on its config in PostHog (Self-driving → Scouts) to switch it to dry-run mode. It keeps running and logging but writes nothing to the inbox.

---

## Follow-ups

- [ ] **Enable Session Replay**: PostHog → Settings → Session replay → "Record user sessions"
- [ ] **Enable Error Tracking**: PostHog → Settings → Error tracking → "Enable exception autocapture" (SDK `capture_exceptions: true` is already set in `vite-project/src/main.tsx`)
- [ ] **Enable Support / Conversations**: PostHog product sidebar
- [ ] **Connect a Conversations inbound channel** (email, inbox, or Slack) so tickets reach the support source: PostHog → Settings → Conversations
- [ ] **Add custom PostHog events** for key user actions — plan generation, fuel planner AI requests, GPX analysis completion — to unlock richer feature-funnel scout coverage. Once those events exist, the two proposed custom scouts above become viable.
- [ ] **Re-enable scouts** as new product surfaces ship: `signals-scout-feature-flags` if feature flags are adopted, `signals-scout-revenue-analytics` when Stripe is integrated, `signals-scout-experiments` for A/B tests, `signals-scout-surveys` if PostHog surveys are added.

---

## What happens next

The scout coordinator picks up fresh configs within ~30 minutes; the first scout runs fire on the next coordinator tick. Each run draws from the project's daily budget (100 runs/day during early access). Findings are clustered into reports in the [Self-driving inbox](https://us.posthog.com/project/524328/inbox); immediately-actionable reports come with a suggested fix that can start a coding task without further triage.
