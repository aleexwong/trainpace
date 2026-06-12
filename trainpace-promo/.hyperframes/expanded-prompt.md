# TrainPace Promo — Production Breakdown

**Format:** 1920x1080 · 25s · 30fps. **Canvas:** light (slate-50 `#f8fafc`) per design.md — no dark mode.
**Type:** Space Grotesk (display, 500/700) + DM Sans (body, 400/500/700). Tabular numerals on all stats.
**Palette:** emerald `#059669` hero accent, `#10b981` bright accent, ink `#0f172a`, body `#475569`, muted `#64748b`, hairline `#e2e8f0`, washes `#d1fae5` (emerald-100) and `#dbeafe` (blue-100, atmospheric only).

## Rhythm

`hook — BUILD — BUILD — PEAK — resolve` (brand reel). Energy: medium-high, athletic but credible.

**Primary transition:** blur crossfade (10px, 0.5s, power2.inOut) — scenes 1→2, 2→3, 3→4.
**Accent transition:** zoom through (power3, 0.4s) into the CTA — the payoff.
**Final scene:** gentle fade-out (the only scene allowed exit animations).

## Scenes

### S1 · Hook (0–5.1s) — "Train Smarter. Race Faster."

**Concept:** The landing page hero comes alive. A bright, airy frame already breathing — soft emerald and blue washes drifting like morning light on a track — and the brand promise lands in two decisive beats.
**Mood:** Confident product launch, Apple-fitness-ad lightness; nothing grungy.
**Depth:** BG — slate-50 fill, emerald-100 + blue-100 radial blobs (drift, finite yoyo), oversized ghost pace figure "5:32" at 12% opacity bleeding off right. MG — badge chip with pulsing emerald dot ("MADE FOR RUNNERS BY A RUNNER"), headline line 1 "Train Smarter." (ink), line 2 "Race Faster." (emerald), supporting line. FG — emerald rule DRAWS (scaleX 0→1), mono metadata strip "TRAINPACE.COM · PACE / COURSE / FUEL" bottom-left.
**Choreography:** badge DROPS (power3.out, 0.5s) · line 1 RISES hard (expo.out, 0.7s) · line 2 PUNCHES from left with slight overshoot (back.out(1.4), 0.6s) · rule DRAWS (power2.inOut) · sub-line fades up late (sine.out) · ghost figure drifts 30px over the whole beat.

### S2 · Pace zones (5.1–10.1s) — BUILD

**Concept:** One race time becomes a complete training week. A zone card builds itself bar by bar on the right while the claim anchors left — the product literally assembling on screen.
**Depth:** BG — ghost "VDOT" display type 14% opacity top-right, emerald radial wash low-left. MG — left column: kicker "PACE CALCULATOR", headline "One race time. Every training pace.", body line; right: white rounded-2xl card, 5 zone rows (Easy 5:58 · Marathon 5:12 · Threshold 4:52 · Interval 4:28 · Rep 4:09 /km), each row a label + emerald-tinted bar + tabular pace. FG — "⚡ VDOT 45.2 · Intermediate" chip, hairline dividers.
**Choreography:** card SLIDES in from right (power3.out) · bars CASCADE scaleX 0→1, 90ms stagger (power2.out, transform-origin left) · paces fade in following each bar · left headline RISES (expo.out) · chip POPS (back.out) last.

### S3 · Elevation (10.1–15.1s) — BUILD

**Concept:** The course reveals itself. An elevation profile draws itself left-to-right like a heartbeat across the card — the moment a runner sees the hills before their legs do.
**Depth:** BG — ghost "GPX" type, blue-100 wash upper-left (the one sanctioned blue moment). MG — full-width white card with SVG elevation profile (emerald stroke DRAWS via dash-offset, soft emerald area fill fades up), grade badge "+6.2%" POPS at the steep pitch. Left column: kicker "ELEVATIONFINDER", headline "See every climb before race day.", stat chips (GAIN 312 M · MAX GRADE 8%). FG — mono distance ticks under the chart.
**Choreography:** card RISES (power3.out) · profile DRAWS over 1.6s (power1.inOut) · area fill BLOOMS (sine.out) · grade badge SPRINGS (back.out(2)) at draw apex · stat chips CASCADE from left (110ms stagger).

### S4 · Fuel (15.1–19.6s) — PEAK

**Concept:** Numbers snap into place like a race-morning checklist. Three big counters COUNT UP simultaneously — the fastest, punchiest beat in the piece.
**Depth:** BG — emerald radial glow center-low, ghost "FUEL" type right. MG — headline "Fuel it. Don't wing it.", three stat blocks counting up: 68 G CARBS/HR · 7 GELS · 1,840 KCAL (Space Grotesk 120px, tabular). FG — chip "AI-PERSONALIZED · GEMINI", hairline frame corners.
**Choreography:** headline STAMPS (power4.out, 0.45s) · stat blocks CASCADE (scale 0.92→1, 120ms stagger) · numbers COUNT UP over 1.2s (power2.out, snapped) · chip slides up late.

### S5 · CTA (19.6–25s) — resolve

**Concept:** Exhale. Everything clears to a clean, bright frame: the wordmark, the URL in emerald, the no-friction promise. Holds, then breathes out to white.
**Depth:** BG — slate-50, faint emerald-100 halo behind wordmark (breathing, finite yoyo). MG — wordmark "TrainPace" (Space Grotesk 700), URL "trainpace.com" in emerald, pill button "Get Started →" (solid emerald). FG — proof line "Free · No credit card · No account needed", top + bottom hairlines.
**Choreography:** wordmark SETTLES from scale 1.06 (expo.out, 0.9s) · URL fades up · pill POPS (back.out) · proof line last (sine.out) · 23.9s: everything fades down gently (final-scene exception).

## Motifs

Emerald rule lines (scaleX draws) in every scene · ghost display type naming each tool · tabular Space Grotesk numbers as the recurring "data" voice · white rounded-2xl cards with soft shadow.

## Negative

No dark canvas, no extra accent hues, no full-screen linear gradients (banding), no web-scale 1px borders or sub-24px focal text, no grunge.
