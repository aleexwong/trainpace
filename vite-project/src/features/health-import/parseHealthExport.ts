/**
 * Apple Health export parser.
 *
 * Reads an `export.zip` (or a bare `export.xml`) **entirely in the browser**.
 * The file never leaves the device — there is no upload, no fetch and no
 * Firestore write anywhere in this module, and that is the point of the feature.
 *
 * The XML is scanned as a stream rather than parsed as a document. A real
 * export is mostly `<Record>` elements — one per heart-rate reading, step count
 * and so on — which can run to hundreds of megabytes and tens of millions of
 * elements. `DOMParser` on that would hang or crash a phone. Instead the stream
 * is walked chunk by chunk, `<Workout>` elements are pulled out whole, a handful
 * of `<Record>` types are matched by regex, and everything else is discarded as
 * it goes past, so memory stays flat.
 *
 * Two element layouts are supported, because iOS 16 changed the format:
 *   - older exports put totals on the element (`totalDistance="8.2"`),
 *   - newer ones use `<WorkoutStatistics type="…" sum="8.2" unit="km"/>`.
 */

import { openZipEntry, readZipEntries, type ZipEntry } from "./zip";
import type {
  HealthExportData,
  HealthMetricSample,
  HealthWorkout,
  ParseProgress,
} from "./types";

export interface ParseOptions {
  onProgress?: (progress: ParseProgress) => void;
  signal?: AbortSignal;
}

const METERS_PER_MILE = 1609.344;
const METERS_PER_YARD = 0.9144;
const METERS_PER_FOOT = 0.3048;

/** Buffer ceiling for a region with no line break — guards against a one-line file. */
const MAX_CARRY_CHARS = 4 * 1024 * 1024;

const RECORD_TYPES: Record<string, HealthMetricSample["type"]> = {
  HKQuantityTypeIdentifierVO2Max: "vo2Max",
  HKQuantityTypeIdentifierRestingHeartRate: "restingHeartRate",
  HKQuantityTypeIdentifierBodyMass: "bodyMass",
};

const RECORD_RE =
  /<Record\s+type="(HKQuantityTypeIdentifierVO2Max|HKQuantityTypeIdentifierRestingHeartRate|HKQuantityTypeIdentifierBodyMass)"([^>]*)>/g;

const ATTR_RE = /([A-Za-z0-9_:]+)="([^"]*)"/g;
const WORKOUT_STATISTICS_RE = /<WorkoutStatistics\s+([^>]*?)\/?>/g;
const METADATA_RE = /<MetadataEntry\s+([^>]*?)\/?>/g;
const FILE_REFERENCE_RE = /<FileReference\s+([^>]*?)\/?>/g;

export class HealthExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HealthExportError";
  }
}

// ── Attribute helpers ──────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(value: string): string {
  if (!value.includes("&")) return value;
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[body] ?? match;
  });
}

function readAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(source)) !== null) {
    attrs[match[1]] = decodeEntities(match[2]);
  }
  return attrs;
}

/**
 * Apple writes dates as "2026-03-14 07:31:02 -0700", which `new Date()` parses
 * inconsistently across browsers. Rewrite to ISO 8601 first.
 */
export function parseAppleDate(value: string | undefined): string | null {
  if (!value) return null;
  const match =
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\s*([+-])(\d{2}):?(\d{2}))?/.exec(value);
  if (!match) return null;
  const [, date, time, sign, hours, minutes] = match;
  const offset = sign ? `${sign}${hours}:${minutes}` : "Z";
  const iso = `${date}T${time}${offset}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/** Convert a HealthKit length to metres. Returns null for units we don't know. */
export function toMeters(value: number, unit: string | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  switch ((unit ?? "").toLowerCase()) {
    case "km":
      return value * 1000;
    case "m":
      return value;
    case "mi":
      return value * METERS_PER_MILE;
    case "yd":
      return value * METERS_PER_YARD;
    case "ft":
      return value * METERS_PER_FOOT;
    default:
      return null;
  }
}

/** Convert a HealthKit energy value to kilocalories. */
function toKilocalories(value: number, unit: string | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  switch ((unit ?? "kcal").toLowerCase()) {
    case "kcal":
    case "cal": // HealthKit's "Cal" is the food calorie, i.e. a kilocalorie.
      return value;
    case "kj":
      return value / 4.184;
    default:
      return null;
  }
}

function toSeconds(value: number, unit: string | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  switch ((unit ?? "").toLowerCase()) {
    case "min":
      return value * 60;
    case "s":
    case "sec":
      return value;
    case "hr":
    case "h":
      return value * 3600;
    default:
      return null;
  }
}

// ── Element parsing ────────────────────────────────────────────────────────

/**
 * Index of the `>` that closes the tag starting at `start`, skipping any `>`
 * inside a quoted attribute value. XML allows an unescaped `>` there, and a
 * plain `indexOf` would cut the tag in half and drop every attribute after it.
 */
function findTagEnd(source: string, start: number): number {
  let quote: string | null = null;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return i;
    }
  }
  return -1;
}

/** Turn one complete `<Workout>…</Workout>` element into a normalised record. */
export function parseWorkoutElement(element: string): HealthWorkout | null {
  const openEnd = findTagEnd(element, 0);
  if (openEnd === -1) return null;
  const attrs = readAttributes(element.slice(0, openEnd));

  const start = parseAppleDate(attrs.startDate);
  const end = parseAppleDate(attrs.endDate);
  if (!start) return null;

  const activityType = (attrs.workoutActivityType ?? "")
    .replace(/^HKWorkoutActivityType/, "")
    .trim();

  // Duration: prefer the stated duration, fall back to the timestamps.
  let durationSeconds =
    toSeconds(parseFloat(attrs.duration), attrs.durationUnit) ?? 0;
  if (durationSeconds <= 0 && end) {
    durationSeconds = Math.max(0, (Date.parse(end) - Date.parse(start)) / 1000);
  }

  // Pre-iOS-16 layout: totals as attributes on the element.
  let distanceMeters = attrs.totalDistance
    ? toMeters(parseFloat(attrs.totalDistance), attrs.totalDistanceUnit)
    : null;
  let energyKcal = attrs.totalEnergyBurned
    ? toKilocalories(
        parseFloat(attrs.totalEnergyBurned),
        attrs.totalEnergyBurnedUnit
      )
    : null;
  let avgHeartRate: number | null = null;
  let maxHeartRate: number | null = null;

  // iOS 16+ layout: totals as <WorkoutStatistics> children.
  WORKOUT_STATISTICS_RE.lastIndex = 0;
  let statistic: RegExpExecArray | null;
  while ((statistic = WORKOUT_STATISTICS_RE.exec(element)) !== null) {
    const stat = readAttributes(statistic[1]);
    switch (stat.type) {
      case "HKQuantityTypeIdentifierDistanceWalkingRunning":
      case "HKQuantityTypeIdentifierDistanceCycling":
      case "HKQuantityTypeIdentifierDistanceSwimming":
        if (distanceMeters == null) {
          distanceMeters = toMeters(parseFloat(stat.sum), stat.unit);
        }
        break;
      case "HKQuantityTypeIdentifierActiveEnergyBurned":
        if (energyKcal == null) {
          energyKcal = toKilocalories(parseFloat(stat.sum), stat.unit);
        }
        break;
      case "HKQuantityTypeIdentifierHeartRate": {
        const average = parseFloat(stat.average);
        const maximum = parseFloat(stat.maximum);
        if (Number.isFinite(average)) avgHeartRate = Math.round(average);
        if (Number.isFinite(maximum)) maxHeartRate = Math.round(maximum);
        break;
      }
      default:
        break;
    }
  }

  let indoor = false;
  METADATA_RE.lastIndex = 0;
  let metadata: RegExpExecArray | null;
  while ((metadata = METADATA_RE.exec(element)) !== null) {
    const entry = readAttributes(metadata[1]);
    if (entry.key === "HKIndoorWorkout") {
      indoor = entry.value === "1" || entry.value?.toLowerCase() === "true";
    }
  }

  // A workout recorded outdoors carries a route file reference.
  let routeFile: string | null = null;
  FILE_REFERENCE_RE.lastIndex = 0;
  let reference: RegExpExecArray | null;
  while ((reference = FILE_REFERENCE_RE.exec(element)) !== null) {
    const path = readAttributes(reference[1]).path;
    if (path && /\.gpx$/i.test(path)) {
      routeFile = path.replace(/^\/+/, "");
      break;
    }
  }

  return {
    activityType: activityType || "Other",
    start,
    end: end ?? start,
    durationSeconds,
    distanceMeters:
      distanceMeters != null && distanceMeters > 0 ? distanceMeters : null,
    energyKcal: energyKcal != null && energyKcal > 0 ? energyKcal : null,
    avgHeartRate,
    maxHeartRate,
    indoor,
    source: attrs.sourceName ?? null,
    routeFile,
  };
}

function collectMetrics(region: string, into: HealthMetricSample[]): void {
  // indexOf is far cheaper than the regex, and the vast majority of regions
  // contain none of these three types.
  if (
    region.indexOf("VO2Max") === -1 &&
    region.indexOf("RestingHeartRate") === -1 &&
    region.indexOf("BodyMass") === -1
  ) {
    return;
  }

  RECORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RECORD_RE.exec(region)) !== null) {
    const type = RECORD_TYPES[match[1]];
    const attrs = readAttributes(match[2]);
    const value = parseFloat(attrs.value);
    const date = parseAppleDate(attrs.startDate ?? attrs.creationDate);
    if (!type || !Number.isFinite(value) || !date) continue;
    into.push({ type, value, unit: attrs.unit ?? "", date });
  }
}

// ── Streaming scanner ──────────────────────────────────────────────────────

interface ScanResult {
  workouts: HealthWorkout[];
  metrics: HealthMetricSample[];
  bytesScanned: number;
}

/**
 * Walk the XML stream, keeping only workouts and the three scalar metrics.
 *
 * The carry buffer holds at most one partial line, or one partial `<Workout>`
 * element, so peak memory is a few hundred kilobytes regardless of file size.
 */
async function scanExportXml(
  stream: ReadableStream<Uint8Array>,
  totalBytes: number,
  options: ParseOptions
): Promise<ScanResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  const workouts: HealthWorkout[] = [];
  const metrics: HealthMetricSample[] = [];

  let carry = "";
  let bytesScanned = 0;
  let lastProgressAt = 0;
  let lastYieldAt = Date.now();

  const report = (force = false) => {
    if (!options.onProgress) return;
    const now = Date.now();
    if (!force && now - lastProgressAt < 120) return;
    lastProgressAt = now;
    options.onProgress({
      bytesScanned,
      totalBytes,
      workoutsFound: workouts.length,
    });
  };

  try {
    for (;;) {
      if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const { done, value } = await reader.read();
      if (done) break;

      bytesScanned += value.byteLength;
      carry += decoder.decode(value, { stream: true });
      carry = drain(carry, workouts, metrics, false);
      report();

      // Yield to the event loop now and then so the progress bar actually
      // paints. Yielding on every chunk would add seconds to a large export.
      if (Date.now() - lastYieldAt > 60) {
        lastYieldAt = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    carry += decoder.decode();
    drain(carry, workouts, metrics, true);
    report(true);
  } finally {
    reader.releaseLock();
  }

  return { workouts, metrics, bytesScanned };
}

/**
 * Consume everything in `buffer` that can be interpreted now, and return the
 * unconsumed tail. `final` means no more input is coming, so a trailing partial
 * element can be dropped rather than kept.
 */
function drain(
  buffer: string,
  workouts: HealthWorkout[],
  metrics: HealthMetricSample[],
  final: boolean
): string {
  let pos = 0;

  for (;;) {
    const workoutStart = buffer.indexOf("<Workout ", pos);

    if (workoutStart === -1) {
      // No workout ahead: harvest whole lines and keep the partial last one, so
      // a `<Record>` split across a chunk boundary is never half-matched.
      const region = buffer.slice(pos);
      const cut = final ? region.length : region.lastIndexOf("\n") + 1;
      if (cut > 0) {
        collectMetrics(region.slice(0, cut), metrics);
      }
      const tail = region.slice(cut);
      // A file with no line breaks at all would otherwise grow without bound.
      if (!final && tail.length > MAX_CARRY_CHARS) {
        collectMetrics(tail, metrics);
        return "";
      }
      return final ? "" : tail;
    }

    collectMetrics(buffer.slice(pos, workoutStart), metrics);

    const workoutEnd = findWorkoutEnd(buffer, workoutStart);
    if (workoutEnd === -1) {
      // Element is still arriving — keep it and wait for the next chunk.
      return final ? "" : buffer.slice(workoutStart);
    }

    const workout = parseWorkoutElement(buffer.slice(workoutStart, workoutEnd));
    if (workout) workouts.push(workout);
    pos = workoutEnd;
  }
}

/** Index just past the end of the `<Workout>` element starting at `start`, or -1. */
function findWorkoutEnd(buffer: string, start: number): number {
  const openEnd = findTagEnd(buffer, start);
  if (openEnd === -1) return -1;
  if (buffer[openEnd - 1] === "/") return openEnd + 1;
  const close = buffer.indexOf("</Workout>", openEnd);
  return close === -1 ? -1 : close + "</Workout>".length;
}

// ── Entry point ────────────────────────────────────────────────────────────

/** What the picked file turned out to be, plus the entry list for GPX reads. */
export interface HealthExportHandle extends HealthExportData {
  /** Zip entries, so route GPX files can be read on demand. Empty for a bare .xml. */
  entries: ZipEntry[];
}

function findExportXml(entries: ZipEntry[]): ZipEntry {
  const candidates = entries.filter(
    (entry) =>
      /(^|\/)export\.xml$/i.test(entry.name) && !entry.name.startsWith("__MACOSX/")
  );
  if (candidates.length === 0) {
    const looksLikeHealth = entries.some((e) => /export_cda\.xml$/i.test(e.name));
    throw new HealthExportError(
      looksLikeHealth
        ? "This archive has no export.xml. Re-export from Health with 'Export All Health Data'."
        : "No export.xml inside this zip. Pick the export.zip that Health created, not another archive."
    );
  }
  // Prefer the canonical apple_health_export/export.xml if several match.
  return (
    candidates.find((entry) => entry.name === "apple_health_export/export.xml") ??
    candidates[0]
  );
}

async function openSource(file: File): Promise<{
  stream: ReadableStream<Uint8Array>;
  totalBytes: number;
  routeFiles: string[];
  entries: ZipEntry[];
}> {
  const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip";

  if (!isZip) {
    if (!/\.xml$/i.test(file.name)) {
      throw new HealthExportError(
        "Pick the export.zip from Health (or the export.xml inside it)."
      );
    }
    return {
      stream: file.stream(),
      totalBytes: file.size,
      routeFiles: [],
      entries: [],
    };
  }

  const entries = await readZipEntries(file);
  const xmlEntry = findExportXml(entries);
  const routeFiles = entries
    .filter((entry) => /workout-routes\/.+\.gpx$/i.test(entry.name))
    .map((entry) => entry.name);

  return {
    stream: await openZipEntry(file, xmlEntry),
    totalBytes: xmlEntry.uncompressedSize,
    routeFiles,
    entries,
  };
}

/**
 * Parse an Apple Health export into workouts, a few scalar metrics, and the
 * list of GPX route files the archive carries.
 */
export async function parseHealthExport(
  file: File,
  options: ParseOptions = {}
): Promise<HealthExportHandle> {
  const source = await openSource(file);
  const { workouts, metrics, bytesScanned } = await scanExportXml(
    source.stream,
    source.totalBytes,
    options
  );

  // `<FileReference path="/workout-routes/route_x.gpx">` is relative to the
  // export root, while zip entries are prefixed with "apple_health_export/".
  // Rewrite each reference to the real entry name so route files can be read.
  if (source.routeFiles.length > 0) {
    const byBasename = new Map<string, string>();
    for (const name of source.routeFiles) {
      byBasename.set(name.split("/").pop() ?? name, name);
    }
    for (const workout of workouts) {
      if (!workout.routeFile) continue;
      const basename = workout.routeFile.split("/").pop() ?? workout.routeFile;
      workout.routeFile = byBasename.get(basename) ?? null;
    }
  }

  if (workouts.length === 0 && metrics.length === 0) {
    throw new HealthExportError(
      "No workouts found in this export. It parsed fine, but Health had nothing to give — check you exported from the right device."
    );
  }

  return {
    workouts,
    metrics,
    routeFiles: source.routeFiles,
    bytesScanned,
    entries: source.entries,
  };
}
