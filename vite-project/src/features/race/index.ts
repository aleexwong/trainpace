/**
 * Race Feature - Public API
 * 
 * Export all public-facing types, components, and hooks
 */

// Types
export type {
  RacePlan,
  RacePlanInputs,
  RaceType,
  RaceStatus,
  RouteSource,
  PaceStrategy,
  PaceSplit,
  FuelPlanSummary,
  FuelScheduleItem,
  ElevationInsightsSummary,
  WeatherConditions,
  PublicRoute,
  RouteMetadata,
} from './types';

export {
  RACE_TYPE_DISTANCES,
  RACE_TYPE_LABELS,
  DEFAULT_PACE_STRATEGY,
  DEFAULT_FUEL_PLAN,
} from './types';

// Components
export { RacePlanCard } from './components/RacePlanCard';

// Hooks
export { useRacePlans } from './hooks/useRacePlans';
