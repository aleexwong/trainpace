# Apple Health import

`/import` turns an Apple Health export into TrainPace numbers and into a summary
small enough to paste into an AI chat. Everything happens in the browser.

Code lives in `src/features/health-import/`; the page is
`src/pages/HealthImportPage.tsx`.

## The problem this solves

Apple gives you your data, but not in a usable shape. **Health → profile →
Export All Health Data** produces `export.zip`, which contains:

```
apple_health_export/
  export.xml            # everything, often 100 MB–1 GB uncompressed
  export_cda.xml        # clinical-document copy of some of it
  workout-routes/
    route_2026-08-16_8.00am.gpx   # one per outdoor workout
```

`export.xml` is mostly `<Record>` elements — one per heart-rate sample, step
count, and so on — running to tens of millions of elements. You cannot paste it
into a chat, and you cannot hand it to `DOMParser` on a phone without crashing
the tab.

So the import does three things: read the archive without loading it, keep only
the running parts, and hand the result to whatever the runner wants next.

## How the parsing works

**`zip.ts`** is a minimal ZIP reader — about the smallest thing that can open one
entry of a real archive:

1. Read the tail of the file and find the End Of Central Directory record.
2. Parse the central directory to list entries (with ZIP64 for big archives).
3. Read the one entry's local header, `Blob.slice()` its compressed bytes, and
   pipe them through `DecompressionStream("deflate-raw")`.

`Blob.slice()` is lazy, so steps 1–3 read kilobytes, not gigabytes, and the
decompressed bytes arrive as a stream. There is no zip dependency in
`package.json` and there does not need to be.

**`parseHealthExport.ts`** walks that stream. It never builds a document: it
keeps a small carry buffer, pulls whole `<Workout>…</Workout>` elements out of
it, regex-matches three `<Record>` types, and discards everything else as it goes
past. Peak memory stays in the low megabytes for any size of export.

**`summarize.ts`** is pure functions over the parsed workouts: weekly volume,
best efforts, VDOT (via `features/vdot-calculator/vdot-math`), and the Markdown
handed to Claude.

### Format quirks worth knowing

- **iOS 16 moved the workout totals.** Older exports put them on the element
  (`totalDistance="8.2" totalDistanceUnit="km"`); newer ones use
  `<WorkoutStatistics type="…" sum="8.2" unit="km"/>` children. Both are parsed;
  the attribute form wins when both are present.
- **Dates are not ISO.** Apple writes `2026-03-14 07:31:02 -0700`, which browsers
  parse inconsistently. `parseAppleDate()` rewrites it to ISO 8601 first.
- **Units vary by device and locale** — `km`, `mi`, `m`, `yd`, `ft` all appear.
  Everything is normalised to metres on the way in.
- **Route references don't match zip entry names.**
  `<FileReference path="/workout-routes/route_x.gpx"/>` is relative to the export
  root, while the zip entry is `apple_health_export/workout-routes/route_x.gpx`.
  References are resolved against the entry list by basename after the scan.
- **Attribute values carry XML entities** (`Apple Watch &amp; friends`), so they
  are decoded rather than used raw.

## Deliberate choices

- **Nothing is uploaded, stored, or persisted.** No `fetch`, no Firestore write,
  no `localStorage`. An Apple Health export contains a person's whole health
  record; the only defensible way to handle it is not to take it. Reloading the
  page means importing again, and that is the right trade.
- **Treadmill runs count toward volume but never toward a best effort.** Their
  distance is only as good as the machine's calibration.
- **Best efforts are labelled as efforts, not races.** A run is matched to 5K,
  10K, half or marathon if it is within −0.5%/+10% of the distance; the fastest
  qualifying run wins. Most are training runs, so the derived VDOT is a floor on
  fitness, not a measurement of it. The UI says so.
- **The weekly average divides by the weeks the data covers**, not by the 90-day
  window. An athlete with three weeks of runs in the export should not be told
  they average a quarter of what they run.
- **The window re-anchors on the last workout** when a stale export has nothing
  in the last 90 days, so an old file still says something useful.

## Browser support

Needs `DecompressionStream` (Safari 16.4+, Chrome 103+, Firefox 113+) and
`Blob.stream()`. Older browsers get an explicit message, not a silent failure.

## Testing

`e2e/health-import.spec.ts` drives the real page. `e2e/fixtures/appleHealthExport.ts`
builds a synthetic `export.zip` in memory at test time — both workout layouts, a
mile-unit workout, an indoor workout, a non-running workout, route references,
and enough `<Record>` noise that the parser has to stream. A real export is
personal health data and is never committed.

## If you extend this

The obvious next inputs are third-party exporters (Health Auto Export and
similar) that emit JSON on a schedule, and Strava/Garmin, which is already on the
roadmap. Add a new source that produces `HealthWorkout[]` and everything
downstream — summary, calculators, Claude handoff — works unchanged.

## Why there is no Shortcut, Strava or auto-export path (yet)

Asked for repeatedly, so the reasoning is recorded here rather than re-derived.

**Apple Shortcuts cannot read workouts.** The `Find Health Samples` action
offers quantity types — Walking + Running Distance, resting heart rate, VO2 max,
body mass — and can group them by day or week and run on a schedule. It does not
offer "Workout" or "Run" as a type. So a Shortcut can report weekly volume in one
tap, but never per-run duration, and therefore never pace, fastest efforts or
VDOT. A volume-only Shortcut is a real option for someone tracking mileage; it is
not a replacement for the export, and the page says so rather than letting people
find out after building one.

**Auto-export apps work but cost money.** Health Auto Export and similar read
HealthKit directly and POST full workout JSON on a schedule. That is the only
zero-effort path that keeps per-run detail. If support is added, the parser
should accept their JSON alongside `export.zip` — anything producing
`HealthWorkout[]` reuses the whole downstream pipeline.

**Strava/Garmin is the cleanest fix and the biggest job.** One OAuth grant, then
activities flow in forever with full pace data. It needs a token exchange, so it
belongs in the `api.trainpace.com` backend, not in this repo. It is already on
the roadmap under "Next".

The trade-off table lives in `components/OtherWaysCard.tsx` and is mirrored into
the prerendered page and Markdown via `importBlocks()` in
`src/lib/llm/page-docs.ts`. Keep the two in step.

## The MCP server (`mcp/health-server.ts`)

The import page hands Claude a *summary*. The MCP server hands it the *data*:
point it at an `export.zip` and Claude gets tools to query the runs inside —
`export_status`, `training_summary`, `list_runs`, `weekly_volume`,
`best_efforts`, `compare_periods`. Same parser as the web page, so the numbers
cannot drift between the two.

```bash
claude mcp add trainpace-health \
  --env TRAINPACE_HEALTH_EXPORT=$HOME/Downloads/export.zip \
  -- npm --prefix /path/to/trainpace/vite-project run --silent mcp:health
```

For a client that takes JSON config (Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "trainpace-health": {
      "command": "npm",
      "args": ["--prefix", "/abs/path/trainpace/vite-project", "run", "--silent", "mcp:health"],
      "env": { "TRAINPACE_HEALTH_EXPORT": "/abs/path/export.zip" }
    }
  }
}
```

`--export <path>` on the command line overrides the environment variable.

### Things that will bite you

- **`--silent` is load-bearing.** Without it npm writes `> vite-project@2.0.0
  mcp:health` to *stdout*, and stdout is the JSON-RPC channel. The client sees a
  parse error and the connection dies. Measured: 2 non-JSON lines without it,
  0 with it.
- **Never `console.log` in this server.** Same reason. Diagnostics go to
  `process.stderr`, which is why the load messages use `process.stderr.write`.
- **The export is read lazily.** `fs.openAsBlob()` returns a `Blob` backed by
  the file rather than its contents, so `parseHealthExport` streams it exactly
  as the browser does. Do not swap in `readFile` — that pulls a
  multi-hundred-megabyte XML into memory to save one line.
- **A `Blob` has no name.** The browser passes a `File`, which names itself;
  Node's `openAsBlob` does not, so the server passes `fileName` explicitly.
  That is what the `fileName` option on `ParseOptions` exists for.
- **Schemas are JSON Schema, not zod.** `@modelcontextprotocol/server` wants a
  Standard Schema that can emit JSON Schema; the app's zod 3.25 predates that
  contract, so tool inputs go through the package's own `fromJsonSchema`. This
  also decouples the server from the app's zod version — a zod upgrade for the
  forms cannot break the MCP tools. JSON Schema `default` is advisory, so each
  handler applies its own fallback.
- **`toClaudeMarkdown` takes `includeHandoff: false` here.** Its footer tells
  the reader to connect the TrainPace MCP server, which is right for the
  clipboard and nonsense inside a tool result from a server the client is
  already talking to.

### Verifying a change

There is no test harness for MCP in this repo. Drive it the way a client does:
spawn the server, send `initialize`, then `tools/list` and `tools/call` over
stdin, and assert **every** stdout line parses as JSON. That last check is the
one that catches the whole class of "works until something prints" bugs.
