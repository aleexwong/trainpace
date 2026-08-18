# Mapbox: how map rendering is metered

TrainPace renders course maps with Mapbox. The token that pays for them is a
public token shipped in the bundle (`VITE_MAPBOX_TOKEN`), so anything that
mounts a map spends real money, and a visitor holding down F5 spends it fast.

Everything that touches Mapbox goes through `src/lib/mapbox/`. Do not call
`api.mapbox.com` or construct a `mapboxgl.Map` outside it — usage that skips
this module is unmetered, and nothing will tell you it is happening.

## Three kinds of request, priced differently

| Kind | What it is | Where | Mapbox charges |
|---|---|---|---|
| `static-image` | One PNG from the Static Images API | `StaticRouteMap` | one API request |
| `gl-session` | A live GL JS map | `MapboxRoutePreview`, poster `useMapbox` | one **map load** |
| `geocoding` | One reverse lookup | `utils/geocoding.ts` | one lookup |

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
   `fetchStaticMap` registers its promise synchronously and nothing awaits
   between the `inFlight` check and that call, so the second mount always
   observes the first. Keep it that way if you touch `useStaticRouteMap`.
3. **Budget check** (`budget.ts`) — see below.
4. **Fetch, cache, render.**

Measured dimensions are quantized to 40px buckets (`quantizeDimension`), so a
scrollbar appearing or a window nudge reuses the cached image instead of buying
a differently-sized one.

Verified in a browser: 13 consecutive loads of `/race/boston-marathon` make
**one** Mapbox request; the other 12 are served from IndexedDB.

### Geometry that arrives late

Race pages render bundled `thumbnailPoints` immediately, then replace them with
the fuller Firestore track. Left alone that is *two* images per page view — the
fingerprint changes, so the second geometry misses the cache.

Pass `awaitingPoints` while the better geometry is still in flight
(`PreviewRoute` uses its `loadingPoints`, `RaceSeoLanding` its `pointsPending`).
The request is held until the geometry settles; `RouteSketch` covers the wait,
so nothing looks empty. Any new call site that swaps its points after mount
needs this, or it quietly doubles its own cost.

## The budget

`budget.ts` keeps a rolling log of request timestamps in `localStorage` and
applies two windows per kind:

| Kind | Burst | Sustained |
|---|---|---|
| `static-image` | 12 / 30s | 120 / hour |
| `gl-session` | 4 / 30s | 40 / hour |
| `geocoding` | 6 / 30s | 60 / hour |

Both windows must pass. A denied caller is told why and when a slot frees up,
and is **not** logged — being denied never pushes your own retry further away.

A *failed write* latches the fallback permanently. It has to: if reads kept
coming from Web Storage while writes went to memory, every recorded request
would be dropped and the cap would silently stop applying — the one failure
mode this module must not have.

### Where the log lives, and what happens when it can't

`localStorage` → `sessionStorage` → in-memory, first writable wins.
`sessionStorage` is tried on its own because browsers that block `localStorage`
in private mode do not always block both, and anything surviving a reload keeps
the cap meaningful against the case it exists for.

Measured, 15 distinct courses navigated back to back against a 12/30s cap:

| Storage | Requests | Cap holds |
|---|---|---|
| `localStorage` | 12 | yes |
| `localStorage` blocked, `sessionStorage` writable | 12 | yes |
| both blocked | 15 | **no** |

With no persistent store the log dies with the page, so it is per *page load*,
not per tab, and the windows only constrain a single page view. Be precise
about what that does and does not expose:

- **Reloading one route is still free** — the IndexedDB image cache serves it
  with no request at all. Measured: 12 reloads, 0 requests, `localStorage`
  blocked. The F5 case this module exists for stays covered.
- **Rapid navigation across many distinct routes is uncapped** in that mode.
  Each one is a legitimately new image, and there is no persistent place to
  count them. Accepted.

### Recovering from a block

A block is temporary and the UI says so. `StaticRouteMap` and
`MapboxRoutePreview` both count the window down and surface a **Load map**
control the moment a slot is actually free; `no-token` is excluded, since
retrying cannot fix a missing token.

`MapboxRoutePreview` keeps its map container mounted underneath the fallback
sketch for this reason. If you move the container into the non-blocked render
branch, the ref is null on every later effect run and a map that hit the cap
once can never come back for the rest of the session.

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

## Two traps in the GL path

**Not every GL `error` is fatal.** GL JS fires it for a 404 tile or a missing
sprite, which a loaded map recovers from on its own. Treat only a failure
*before* first load as fatal — and when you do, call `.remove()`. A map left
behind on a hidden node holds a WebGL context and keeps fetching tiles you are
still paying for.

**Spend the budget at map construction, not at effect start.** React
StrictMode double-invokes effects in dev, and a fast unmount can tear one down
before GL even loads. Charging up front bills for maps that never existed.

## Prerendering

The prerenderer never emits a Mapbox URL into the HTML. Static maps are
fetched after mount, on the client only. That keeps the token out of ~245
prerendered pages and means crawlers cannot drive Mapbox spend by crawling the
site — the prerendered HTML carries the SVG sketch instead.
