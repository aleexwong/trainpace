# shiplog output

Artifacts generated from this repository's commit history by the
[`shiplog`](https://github.com/aleexwong/claude-skills/tree/main/plugins/shiplog) skill.

Range: 471 commits, 2024-11-24 → 2026-08-13. No tags existed, so changelog versions are
retroactive groupings cut at feature arcs, not releases that happened.

| File | What it is | Audience |
|---|---|---|
| [`../../CHANGELOG.md`](../../CHANGELOG.md) | 11 retroactive releases, user-facing capabilities only | users |
| [`2026-08-the-font-bug-that-never-errors.md`](2026-08-the-font-bug-that-never-errors.md) | Build-in-public post on the silent-webfont-failure debugging session | peers |
| [`portfolio-bullets.md`](portfolio-bullets.md) | 10 evidence-backed bullets, every claim traced to a SHA | hiring |

## Triage

| Bucket | Commits | Where it appears |
|---|---|---|
| Shipped — a user can do something new | — | all three artifacts |
| Infrastructure — real engineering, no user-visible change | — | post and bullets only |
| Invisible — cleanup, formatting, merges, reverts | 160 of 471 (34%) | counted, never described |

The invisible third is why the log can't just be published.

## Regenerating

```
/shiplog                      # since the last tag, or propose boundaries if untagged
/shiplog <base>..<head>       # an explicit range
```

Append to the changelog rather than rewriting it — published entries stay as published.
