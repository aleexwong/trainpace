# Tutorial analytics

Everything the tour sends to PostHog, and the handful of insights worth
building from it. The question this instrumentation exists to answer is
**"does anyone actually take the tour, and are they better off for it?"**

PostHog is initialised once in `src/main.tsx`. The tutorial captures through
that same client (`analytics.ts`) and no-ops silently when
`VITE_PUBLIC_POSTHOG_KEY` is unset — local dev and CI produce no events.

## Events

Every event carries `tour_id` (currently always `pace-calculator`). Step events
also carry `step_id`, `step_index` (0-based) and `total_steps`.

| Event | When | Extra properties |
|---|---|---|
| `tutorial_invite_shown` | Invite card is genuinely on screen, after its entry delay | `surface` |
| `tutorial_invite_accepted` | "Show me around" | `surface`, `ms_to_decision` |
| `tutorial_invite_dismissed` | "No thanks" or the X | `surface`, `method` (`no_thanks` \| `close`), `ms_to_decision` |
| `tutorial_started` | Tour begins | `source` (`invite` \| `launcher` \| `url`), `total_steps`, `times_started` |
| `tutorial_step_viewed` | A step is shown | — |
| `tutorial_step_completed` | A step is left behind | `method` (`click` \| `next` \| `skip`), `ms_on_step` |
| `tutorial_step_back` | "Back" | — |
| `tutorial_step_target_missing` | A step's element never appeared | `selector` |
| `tutorial_completed` | Final step finished | `total_ms`, `total_steps`, `interactions` |
| `tutorial_exited` | Closed or Escape before the end | `reason` (`close` \| `escape` \| `unmount`), `total_ms`, `progress_pct` |

`surface` distinguishes the standalone `/calculator` page (`calculator`) from
the calculator embedded in an SEO landing (`calculator-seo`). Only the
standalone page offers the invite; SEO landings are launcher-only.

`interactions` counts steps satisfied by a real click on the highlighted
control rather than by the Next button — the difference between someone
walking through the product and someone clicking past a slideshow.

## Person properties

| Property | Set when |
|---|---|
| `trainpace_tutorial_first_seen_at` | First time the invite is shown (set-once) |
| `trainpace_tutorial_completed` | Tour finished |
| `trainpace_tutorial_completed_at` | Tour finished |

These exist so tour-takers can be compared against everyone else on the
behaviour that actually matters — plans saved, return visits, signups.

## Insights worth building

1. **Adoption funnel** — `tutorial_invite_shown` → `tutorial_invite_accepted` →
   `tutorial_started` → `tutorial_completed`. The single number answering "does
   anyone use this".
2. **Per-step drop-off** — funnel over `tutorial_step_viewed` broken down by
   `step_id`. Where people quit is where the copy or the step is wrong.
3. **Walkthrough vs. skim** — distribution of `interactions` on
   `tutorial_completed`. Low values mean people are clicking Next past the
   parts meant to be hands-on.
4. **Time per step** — median `ms_on_step` by `step_id`. A step that is much
   slower than its neighbours is either confusing or doing real work.
5. **Did it help?** — retention or "saved a plan" conversion, split on the
   `trainpace_tutorial_completed` person property. This is the one that decides
   whether the tour keeps earning its place.
6. **Health check** — any `tutorial_step_target_missing` at all. A spike means
   a `data-tour` anchor was renamed or removed and a step is now pointing at
   nothing.

## Changing the tour

`step_id` values in `tours.ts` are the analytics primary key. Rewording a step
is free. Renaming an id silently breaks every funnel built on it — add a new id
rather than repurposing an old one.
