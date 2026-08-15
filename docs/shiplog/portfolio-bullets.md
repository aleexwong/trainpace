# TrainPace — portfolio and résumé bullets

Generated from 471 commits, 2024-11-24 → 2026-08-13. Every bullet traces to commits in
this repo; SHAs are kept here so any claim can be opened and checked.

Ordered by what is hardest to fake — systems and architecture first, features second,
fixes last. Use the top five or six for a résumé; the full list works as portfolio copy.

---

## Systems and architecture

**Built a configuration-driven programmatic SEO system that generates the site's landing
pages from typed configs rather than hand-authored routes.** Page definitions are
validated at build time — title and description length, ID uniqueness, canonical
correctness — so a malformed page fails the build instead of silently shipping. 79 page
configs currently drive 250 indexed URLs across calculators, race prep, elevation guides,
and training plans.
`a93f586`, `c6812db`, `47873cc`, `cf0c350`

**Designed and shipped a content-negotiation layer that serves LLM agents Markdown
instead of a JavaScript app shell.** Vercel edge middleware inspects `Accept:
text/markdown`, maps the route to a build-time-generated Markdown mirror, and falls
through to normal delivery on any error. Paired with `llms.txt`, an AI-crawler-explicit
`robots.txt`, and structured server-side request logging — added because crawlers don't
execute JavaScript, so client-side analytics record this traffic as not existing at all.
Ships with a verification script (`npm run verify-agent-routing`) that checks Accept
negotiation and Markdown path mapping.
`24b5224`, `8fda908`, `68d493b`

**Restructured a growing single-page app into 11 self-contained feature modules** with
barrel exports, business logic isolated in hooks, and presentational components kept
stateless — a boundary that made it possible to keep adding tools without the shared
surface area growing. 249 TypeScript source files at time of writing.
`7fea749`, `b4a98a5`, `efc6fd8`, `e1e624f`

**Built the GPX analysis pipeline end to end**: browser-side file validation that accepts
valid GPX 1.1 while rejecting executable payloads, elevation parsing, a downsampling
stage that bounds chart cost on large files, grade-adjusted pace calculation, and
comparison against reference race courses derived from real course data rather than
estimates. Results are cached client-side and the upload endpoint is rate-limited.
`bac25dd`, `26c1cce`, `cf0664a`, `6e28bc4`, `239bd24`

## Product

**Shipped a periodized training plan generator** that derives weekly structure from a
goal race and current fitness, cross-linked to the VDOT and pace calculators so a single
race result propagates through every tool. Plans persist for signed-out visitors in local
storage and migrate to Firestore on sign-in without loss — a boundary that's easy to get
wrong and invisible when it's right.
`630c84d`, `1ebfeff`, `5bdd63d`, `6415635`

**Implemented a VDOT calculator from Daniels' Running Formula**, including the landing
page, FAQ schema, and breadcrumb structured data that let it rank independently.
`4532762`, `fc11475`, `e37e6e3`

**Built an AI race-fuelling planner on the Gemini API**, gated behind authentication,
with request timeouts and plan auto-save for users who build a plan before signing in.
`f914712`, `46c95e1`, `25681cc`

## Quality and hardening

**Ran a full security review of the codebase and shipped the fixes**, covering Firestore
access rules, Content Security Policy (which had been silently blocking analytics,
mapping, and image hosts), and account deletion completeness — deleting an account was
leaving user training plans behind.
`b517820`, `86f5036`, `b39c922`, `c6c0d15`

**Stood up end-to-end test coverage with Playwright and wired it into GitHub Actions** on
every push and pull request, using page object models and stable selectors, with browser
and prebundle caching to keep CI time down. 4 spec files covering the core flows.
`351c5f8`, `c64ef3e`, `cb9b32c`, `ae2a9cf`

**Diagnosed and documented a class of webfont bug that produces no error**: with
`font-synthesis: none`, any face missing from the font request renders as though it was
never asked for. Traced two visible defects to it, then wrote a browser-verification
procedure into the repo so visual changes get confirmed by measuring rendered output
rather than by reading CSS.
`91efaed`, `bdea344`, `fc3f689`

---

## A note on authorship — read this before using these

The commit history has three kinds of author: 385 commits under your name, 65 authored by
Claude, and 21 by Copilot agents. That's roughly 18% agent-authored.

These bullets are written to describe **the systems and the decisions**, which are yours —
what to build, how to structure it, what to accept, what to ship. That framing is accurate
and it's the one that survives follow-up questions, because those are the questions you
can actually answer. Bullets phrased around authorship ("hand-wrote", "personally
implemented") would not be, and you're the one in the room.

If asked directly how the work was produced, the true answer is a good one: you specified,
reviewed, integrated, and shipped it, including the parts an agent drafted. Reviewing and
owning agent output is a current, marketable skill in its own right — and there's evidence
for it in this repo, in `.claude/LESSONS.md`, where you keep a running record of mistakes
made in agent sessions so they don't repeat.

## Numbers used above, and where they come from

| Claim | Source |
|---|---|
| 471 commits, 627 days | `git log` |
| 250 indexed URLs | `grep -c '<loc>' public/sitemap.xml` |
| 79 SEO page configs | `grep -c 'slug:' src/features/seo-pages/seoPages.ts` |
| 11 feature modules | `ls src/features` |
| 249 source files | `find src -name '*.ts' -o -name '*.tsx'` |
| 4 E2E spec files | `ls e2e/*.spec.ts` |
| 385 / 65 / 21 authorship | `git log --format='%an' \| sort \| uniq -c` |

No traffic, user, revenue, or performance numbers appear above. None of that is in git,
and none of it was inferred. If you want any of it in a portfolio, pull the real figure
from PostHog or Vercel Analytics and add it yourself.
