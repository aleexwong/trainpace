# TrainPace Frontend & UI Skills

Guidelines for how the TrainPace UI should look, feel, and behave. Follow these when building or modifying any page or component.

---

## Design Language

### Typography

| Role | Font | Usage |
|------|------|-------|
| Body / UI | **DM Sans** | All prose, labels, form fields, navigation |
| Headings / Hero | **Space Grotesk** (`font-display`) | H1s, hero text, feature names, card titles |

- Base size: 16px, line-height 1.5
- Headings: tight line-height (1.1–1.2), heavier weight (600–700)
- Never mix display and body fonts in the same text node

### Color System

Primary palette centers on **blue-600 (`#2563eb`)** with supporting neutrals.

```
Primary CTA:      bg-blue-600 text-white   hover:bg-blue-700
Secondary/ghost:  bg-blue-100 text-blue-800
Muted text:       text-slate-500
Card backgrounds: bg-white or bg-slate-50
Borders:          border-slate-200
Destructive:      hsl(var(--destructive))
```

- Dark mode is **disabled** — `color-scheme: light` only. Do not add dark mode variants.
- Accent gradients use `from-blue-600 to-indigo-600` or `from-blue-50 to-indigo-50`.
- Avoid red/orange outside of error/destructive states.

### Spacing & Layout

- **Mobile-first**: design for 375 px width, scale up. The majority of users are on phones.
- Use Tailwind spacing scale consistently: 4 → 8 → 12 → 16 → 24 → 32 px increments.
- Section padding: `py-16 md:py-24` for full-width sections.
- Card inner padding: `p-6` default, `p-4` on mobile.
- Max content width: `max-w-5xl` or `max-w-6xl` centered with `mx-auto px-4`.

### Border Radius

Controlled via CSS variables (`--radius`). Always use Tailwind aliases:
- `rounded-lg` — cards, modals, inputs
- `rounded-full` — pills, badges, avatar circles
- `rounded-md` — buttons, small chips

---

## Component Patterns

### Buttons

```tsx
// Primary action
<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold
                   px-6 py-3 rounded-lg transition-colors">
  Get Started
</button>

// Secondary / ghost
<button className="border border-slate-200 hover:bg-slate-50 text-slate-700
                   font-medium px-5 py-2.5 rounded-lg transition-colors">
  Learn More
</button>
```

- Always use `transition-colors` or `transition-all` for hover states.
- Minimum touch target: 44×44 px (use `min-h-[44px]`).
- Loading state: replace label with a spinner SVG, disable the button.
- Destructive actions: confirm before executing, use `variant="destructive"` from shadcn.

### Cards

```tsx
<div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6
                hover:shadow-md transition-shadow">
  ...
</div>
```

- Prefer `shadow-sm` at rest, `shadow-md` on hover.
- Use `rounded-xl` (not `rounded-lg`) for prominent feature cards.
- Card grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.

### Forms & Inputs

- Use **React Hook Form + Zod** for all form validation.
- Show inline errors below the field, not in a toast.
- Label above the input, never placeholder-only.
- On mobile, use appropriate `inputmode` attributes (`inputmode="decimal"` for numbers).
- Auto-advance on fill (e.g., the VDOT time H→M→S fields).

### Toasts / Notifications

Use the `use-toast` hook + shadcn `Toast` component:

```tsx
toast({ title: "Plan saved!" });
toast({ title: "Error", description: "...", variant: "destructive" });
```

- Success: default variant (no icon needed for brief messages).
- Error: `variant: "destructive"`.
- Duration: 4 s default; keep messages ≤ 10 words.
- Never use `alert()` or `confirm()` — use shadcn `Dialog` for confirmations.

---

## Animation & Motion

### Fade-Up on Scroll

Apply to any section that should reveal on scroll:

```tsx
// In component
useFadeUp(); // calls IntersectionObserver

// In JSX
<div className="fade-up stagger-1">...</div>
<div className="fade-up stagger-2">...</div>
```

CSS utilities (defined in `index.css`):
- `.fade-up` — opacity 0, translateY(24px)
- `.fade-up.visible` — opacity 1, translateY(0)
- `.stagger-1` through `.stagger-4` — 50 ms increments

### Available Tailwind Animations

| Class | Use |
|-------|-----|
| `animate-blob` | Organic background shape movement |
| `animate-float` | Gentle 4 s up/down float |
| `animate-bounce-slow` | 3 s subtle bounce |
| `animate-marquee-slow` | 60 s horizontal ticker |
| `animate-marquee-fast` | 20 s horizontal ticker |

### Motion Principles

- Prefer **subtle** animations: opacity + translate, not scale explosions.
- Duration sweet spot: 200–400 ms for micro-interactions, 600 ms for section reveals.
- Use `transition-all duration-200 ease-in-out` as the default transition.
- Respect `prefers-reduced-motion` — wrap decorative animations in a media query check when feasible.
- Never animate layout-triggering properties (`width`, `height`) — use `opacity` + `transform` only.

---

## Page Structure

### Landing / Hero Sections

Pattern used on the home page:

```
┌─────────────────────────────────┐
│  Badge pill (e.g. "Science-Backed")
│  H1  (font-display, 3xl–5xl)    │
│  Subheadline (text-slate-600)    │
│  CTA buttons (primary + ghost)   │
│  Social proof / stat row         │
│  Hero visual / mockup            │
└─────────────────────────────────┘
```

- Badge pill: `bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full`.
- H1: `font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900`.
- Subheadline: `text-lg md:text-xl text-slate-600 max-w-2xl`.
- Always have a **primary CTA** and an optional **secondary ghost CTA** side by side.

### Feature / Tool Pages

```
┌─────────────────────────────────┐
│  Page header (h1 + breadcrumb)  │
│  Input / control panel (card)   │
│  Results (below input or side)  │
│  FAQ accordion                  │
└─────────────────────────────────┘
```

- Results appear **below** the input on mobile, **beside** on desktop (`md:grid-cols-2`).
- Show a skeleton or spinner while computing — never a blank gap.
- FAQ at the bottom of every tool page (aids SEO and reduces support questions).

### Dashboard

- Card grid layout, grouped by data type (routes, plans).
- Each card: title, metadata row, action buttons (view, delete).
- Empty states: friendly illustration + descriptive text + primary CTA to create something.

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `sm` (640px) | Single-column → slight layout adjustments |
| `md` (768px) | Side-by-side layouts unlock, nav collapses |
| `lg` (1024px) | Full desktop layout, wider content grids |

- Default to `flex-col`; add `md:flex-row` when side-by-side is appropriate.
- Tables: wrap in a horizontal scroll container (`overflow-x-auto`) on mobile, or switch to a card stack view (see `RacePredictionsTable` for reference).
- Font sizes: don't go below `text-sm` for body copy; `text-xs` only for meta/labels.

---

## Accessibility

- Every interactive element must be keyboard-reachable (shadcn/Radix handles this automatically).
- All `<img>` tags need descriptive `alt` text; decorative SVGs get `aria-hidden="true"`.
- Color alone must not convey meaning — pair color with an icon or text label.
- Focus rings: never remove `:focus-visible` outlines. Tailwind's `ring` utilities are fine.
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, `<h1>`–`<h6>` in order.

---

## Imagery & Icons

- **No npm icon libraries** — inline SVG components only (see the pattern in `Landing.tsx`).
- SVG props: `viewBox`, `fill="none"`, `stroke="currentColor"`, `strokeWidth`, `strokeLinecap="round"`, `strokeLinejoin="round"`.
- Icon size tokens: `w-4 h-4` (small), `w-5 h-5` (default), `w-6 h-6` (large).
- Cover / hero images: always `object-cover`, explicit `width` + `height` to avoid CLS.

---

## Performance & UX Hygiene

- **Optimistic UI**: update state immediately on user action, roll back on error.
- **Loading skeletons** over spinners for content-heavy sections.
- **Debounce** search inputs and expensive recalculations (300 ms).
- Never block the main thread with synchronous heavy computation — use `useMemo` or move to a worker.
- Lazy-load below-the-fold sections with `React.lazy` + `Suspense`.
- Keep initial bundle small: avoid importing full libraries when a single function is needed.

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|-----------|
| Hard-coded pixel values in JSX | Tailwind spacing tokens |
| `style={{ color: "#2563eb" }}` | `text-blue-600` / `bg-blue-600` |
| `alert()` / `confirm()` | shadcn Dialog |
| Animated `width`/`height` | Animate `opacity` + `transform` |
| Dark mode variants | Light mode only (`color-scheme: light`) |
| npm icon packages | Inline SVG components |
| 500+ line component files | Extract to hooks + sub-components |
| Placeholder-only form labels | Visible `<label>` above the input |
| Inline business logic | Custom hooks + pure utils |
