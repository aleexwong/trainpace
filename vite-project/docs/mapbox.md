# Mapbox: how map rendering is metered

TrainPace renders course maps with Mapbox. The token that pays for them is a
public token shipped in the bundle (`VITE_MAPBOX_TOKEN`), so anything that
mounts a map spends real money, and a visitor holding down F5 spends it fast.

Everything that touches Mapbox goes through `src/lib/mapbox/`. Do not call
`api.mapbox.com` or construct a `mapboxgl.Map` outside it.

## Two kinds of request, priced differently

| | What it is | Component | Mapbox charges |
|---|---|---|---|
| `static-image` | One PNG from the Static Images API | `StaticRouteMap` | one API request |
| `gl-session` | A live GL JS map | `MapboxRoutePreview` | one **map load** |

A map load is the expensive unit. Prefer `StaticRouteMap` — it is a plain
`<img>`, so it also gets real alt text and costs nothing to re-render. Reach
for `MapboxRoutePreview` only when the map must pan, zoom, or track a marker
(the elevation dashboard's chart↔map hover link is the case that needs it).

## Why a reload is free

`StaticRouteMap` measures its container, builds a Static Images URL, and then:

1. **IndexedDB cache** (`imageCache.ts`) — keyed by the URL minus the token,
   7-day TTL, LRU-evicted at 60 entries / 12 MB. A hit renders immediately and
   makes zero network requests. This is deliberately not the HTTP cache: a hard
   refresh bypasses that one, and this survives it.
2. **In-flight dedupe** — two components showing the same course share one
   fetch, and joining a fetch already in flight does not spend budget.
3. **Budget check** (`budget.ts`) — see below.
4. **Fetch, cache, render.**

Measured dimensions are quantized to 40px buckets (`quantizeDimension`), so a
scrollbar appearing or a window nudge reuses the cached image instead of buying
a differently-sized one.

Verified in a browser: 13 consecutive loads of `/race/boston-marathon` make
**one** Mapbox request; the other 12 are served from IndexedDB.

## The budget

`budget.ts` keeps a rolling log of request timestamps in `localStorage` and
applies two windows per kind:

| Kind | Burst | Sustained |
|---|---|---|
| `static-image` | 12 / 30s | 120 / hour |
| `gl-session` | 4 / 30s | 40 / hour |

Both must pass. A denied caller is told why and when a slot frees up, and is
**not** logged — being denied never pushes your own retry further away.

When storage is unavailable (prerender, private browsing) the log falls back to
an in-memory one: per-tab rather than per-browser, but the cap still applies.

### What this is and is not

It is a **spend cap on ordinary browsers**, including one being refreshed in a
loop. It is not a security boundary — anyone can clear their own localStorage.

The actual security boundary is the **URL restriction on the token in the
Mapbox dashboard**. Set that to the production hostnames; without it, a copied
token can be spent from anywhere and no client-side code can stop it. Pair it
with a spend alert on the account.

## When there is nothing to show

Every failure path — budget spent, request failed, no token configured,
prerendering — renders `RouteSketch`: the course drawn from its own
coordinates as an inline SVG, with no tiles and no network. A rate-limited
visitor still sees the shape of the course, plus a line saying why the map is
paused.

`RouteSketch` projects with Web Mercator on **both** axes (longitude in
radians, not degrees). Getting that wrong squashes every route into a
horizontal line, and it looks plausible enough to ship — check a north–south
course like NYC after touching it.

## Prerendering

The prerenderer never emits a Mapbox URL into the HTML. Static maps are
fetched after mount, on the client only. That keeps the token out of ~245
prerendered pages and means crawlers cannot drive Mapbox spend by crawling the
site — the prerendered HTML carries the SVG sketch instead.
