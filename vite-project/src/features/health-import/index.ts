/**
 * Apple Health import — public API.
 *
 * The parser and summariser are intentionally not re-exported here: they are
 * pure modules with no React dependency, and deep-importing them keeps them out
 * of any chunk that only needs the components.
 */

export * from "./components";
export { useHealthImport } from "./hooks/useHealthImport";
export type { ImportStatus, UseHealthImportReturn } from "./hooks/useHealthImport";
export type {
  BestEffort,
  HealthExportData,
  HealthMetricSample,
  HealthSummary,
  HealthWorkout,
  ParseProgress,
  WeeklyVolume,
} from "./types";
