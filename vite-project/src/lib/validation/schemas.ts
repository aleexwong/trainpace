/**
 * Production Validation Schemas
 *
 * Comprehensive Zod schemas for all data models in the application.
 * Provides runtime type safety and validation at system boundaries.
 *
 * Features:
 * - Strict validation with meaningful error messages
 * - Reusable schema components
 * - Type inference for TypeScript
 * - Transformation and sanitization
 * - Custom validation rules
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Non-empty string with trimming
 */
export const nonEmptyString = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`);

/**
 * Positive number validation
 */
export const positiveNumber = (fieldName: string) =>
  z.number().positive(`${fieldName} must be positive`);

/**
 * Non-negative number validation
 */
export const nonNegativeNumber = (fieldName: string) =>
  z.number().nonnegative(`${fieldName} must be non-negative`);

/**
 * Firebase user ID format
 */
export const userIdSchema = z.string().min(20).max(128);

/**
 * ISO date string
 */
export const isoDateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

/**
 * Future date validation
 */
export const futureDateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  },
  { message: 'Date must be in the future' }
);

// ============================================================================
// Pace Calculator Schemas
// ============================================================================

export const distanceUnitSchema = z.enum(['km', 'mi']);

export const paceTypeSchema = z.enum(['race', 'easy', 'tempo', 'interval']);

export const paceInputsSchema = z.object({
  distance: z.number()
    .positive('Distance must be positive')
    .max(1000, 'Distance cannot exceed 1000'),
  units: distanceUnitSchema,
  hours: z.number()
    .int('Hours must be a whole number')
    .nonnegative('Hours cannot be negative')
    .max(24, 'Hours cannot exceed 24'),
  minutes: z.number()
    .int('Minutes must be a whole number')
    .nonnegative('Minutes cannot be negative')
    .max(59, 'Minutes cannot exceed 59'),
  seconds: z.number()
    .int('Seconds must be a whole number')
    .nonnegative('Seconds cannot be negative')
    .max(59, 'Seconds cannot exceed 59'),
  paceType: paceTypeSchema.optional(),
  age: z.number()
    .int('Age must be a whole number')
    .min(10, 'Age must be at least 10')
    .max(120, 'Age cannot exceed 120')
    .optional(),
  elevation: z.number()
    .min(-1000, 'Elevation cannot be less than -1000')
    .max(10000, 'Elevation cannot exceed 10000')
    .optional(),
  temperature: z.number()
    .min(-50, 'Temperature cannot be less than -50')
    .max(60, 'Temperature cannot exceed 60')
    .optional(),
}).refine(
  (data) => data.hours > 0 || data.minutes > 0 || data.seconds > 0,
  { message: 'Time must be greater than 0' }
);

export const heartRateZonesSchema = z.object({
  maxHR: positiveNumber('Max heart rate'),
  easyZone: z.tuple([positiveNumber('Easy zone min'), positiveNumber('Easy zone max')]),
  tempoZone: z.tuple([positiveNumber('Tempo zone min'), positiveNumber('Tempo zone max')]),
  intervalZone: z.tuple([positiveNumber('Interval zone min'), positiveNumber('Interval zone max')]),
  maximumZone: z.tuple([positiveNumber('Maximum zone min'), positiveNumber('Maximum zone max')]),
});

export const paceResultsSchema = z.object({
  race: nonEmptyString('Race pace'),
  easy: nonEmptyString('Easy pace'),
  tempo: nonEmptyString('Tempo pace'),
  interval: nonEmptyString('Interval pace'),
  maximum: nonEmptyString('Maximum pace'),
  speed: nonEmptyString('Speed'),
  xlong: nonEmptyString('Long run pace'),
  yasso: nonEmptyString('Yasso pace'),
  heartRateZones: heartRateZonesSchema.optional(),
  adjustments: z.record(z.string()).optional(),
});

export const pacePlanSchema = z.object({
  id: z.string().optional(),
  userId: userIdSchema,
  name: z.string().max(100, 'Plan name cannot exceed 100 characters'),
  distance: positiveNumber('Distance'),
  units: distanceUnitSchema,
  hours: nonNegativeNumber('Hours'),
  minutes: nonNegativeNumber('Minutes'),
  seconds: nonNegativeNumber('Seconds'),
  results: paceResultsSchema,
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

// ============================================================================
// Fuel Planner Schemas
// ============================================================================

export const raceTypeSchema = z.enum(['10K', 'Half', 'Full', 'Ultra']);

export const fuelPlanInputsSchema = z.object({
  raceType: raceTypeSchema,
  weight: z.number()
    .positive('Weight must be positive')
    .max(500, 'Weight cannot exceed 500'),
  weightUnit: z.enum(['kg', 'lbs']).default('kg'),
  timeHours: z.number()
    .int('Hours must be a whole number')
    .nonnegative('Hours cannot be negative')
    .max(48, 'Hours cannot exceed 48'),
  timeMinutes: z.number()
    .int('Minutes must be a whole number')
    .nonnegative('Minutes cannot be negative')
    .max(59, 'Minutes cannot exceed 59'),
  carbsPerHour: z.number()
    .positive('Carbs per hour must be positive')
    .max(120, 'Carbs per hour cannot exceed 120')
    .optional(),
  userContext: z.string()
    .max(2000, 'User context cannot exceed 2000 characters')
    .optional(),
});

export const fuelStopSchema = z.object({
  time: nonEmptyString('Time'),
  distance: nonEmptyString('Distance'),
  carbs: positiveNumber('Carbs'),
  item: nonEmptyString('Item'),
});

export const fuelPlanResultSchema = z.object({
  carbsPerHour: positiveNumber('Carbs per hour'),
  totalCarbs: positiveNumber('Total carbs'),
  totalCalories: positiveNumber('Total calories'),
  gelsNeeded: nonNegativeNumber('Gels needed'),
  fuelStops: z.array(fuelStopSchema),
});

export const aiRecommendationSchema = z.object({
  headline: z.string().max(200, 'Headline cannot exceed 200 characters'),
  detail: z.string().max(2000, 'Detail cannot exceed 2000 characters'),
});

export const fuelPlanDocumentSchema = z.object({
  id: z.string().optional(),
  userId: userIdSchema,
  name: z.string().max(100, 'Plan name cannot exceed 100 characters'),
  inputs: fuelPlanInputsSchema,
  result: fuelPlanResultSchema,
  aiRecommendation: aiRecommendationSchema.optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

// ============================================================================
// Elevation / GPX Schemas
// ============================================================================

export const coordinateSchema = z.tuple([
  z.number().min(-180).max(180), // longitude
  z.number().min(-90).max(90),   // latitude
]);

export const gpxPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  ele: z.number().optional(),
  time: z.string().optional(),
});

export const segmentTypeSchema = z.enum([
  'flat',
  'gradual_uphill',
  'moderate_uphill',
  'steep_uphill',
  'gradual_downhill',
  'moderate_downhill',
  'steep_downhill',
]);

export const elevationSegmentSchema = z.object({
  startDistance: nonNegativeNumber('Start distance'),
  endDistance: positiveNumber('End distance'),
  length: positiveNumber('Length'),
  startElevation: z.number(),
  endElevation: z.number(),
  grade: z.number().min(-100).max(100),
  type: segmentTypeSchema,
  challengeRating: z.number().min(0).max(10),
  estimatedTimeMultiplier: z.number().positive(),
});

export const gpxAnalysisResponseSchema = z.object({
  totalDistance: positiveNumber('Total distance'),
  totalElevationGain: nonNegativeNumber('Total elevation gain'),
  totalElevationLoss: nonNegativeNumber('Total elevation loss'),
  maxElevation: z.number(),
  minElevation: z.number(),
  segments: z.array(elevationSegmentSchema),
  elevationProfile: z.array(z.object({
    distance: nonNegativeNumber('Distance'),
    elevation: z.number(),
  })),
});

export const gpxUploadDocumentSchema = z.object({
  id: z.string().optional(),
  userId: userIdSchema,
  fileName: nonEmptyString('File name'),
  fileSize: positiveNumber('File size'),
  analysis: gpxAnalysisResponseSchema.optional(),
  createdAt: z.union([z.date(), z.string()]),
  deleted: z.boolean().default(false),
  deletedAt: z.number().optional(),
});

// ============================================================================
// Authentication Schemas
// ============================================================================

export const emailSchema = z.string()
  .trim()
  .email('Invalid email address')
  .max(254, 'Email cannot exceed 254 characters');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  );

export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// API Request/Response Schemas
// ============================================================================

export const refineFuelPlanRequestSchema = z.object({
  raceType: raceTypeSchema,
  weight: positiveNumber('Weight'),
  timeHours: nonNegativeNumber('Hours'),
  timeMinutes: nonNegativeNumber('Minutes'),
  carbsPerHour: positiveNumber('Carbs per hour'),
  userContext: z.string()
    .max(2000, 'Context cannot exceed 2000 characters')
    .transform((val) => val.trim())
    .optional(),
});

export const refineFuelPlanResponseSchema = z.object({
  recommendation: aiRecommendationSchema,
  responseId: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type PaceInputs = z.infer<typeof paceInputsSchema>;
export type PaceResults = z.infer<typeof paceResultsSchema>;
export type PacePlan = z.infer<typeof pacePlanSchema>;
export type FuelPlanInputs = z.infer<typeof fuelPlanInputsSchema>;
export type FuelPlanResult = z.infer<typeof fuelPlanResultSchema>;
export type AIRecommendation = z.infer<typeof aiRecommendationSchema>;
export type FuelPlanDocument = z.infer<typeof fuelPlanDocumentSchema>;
export type ElevationSegment = z.infer<typeof elevationSegmentSchema>;
export type GPXAnalysisResponse = z.infer<typeof gpxAnalysisResponseSchema>;
export type GPXUploadDocument = z.infer<typeof gpxUploadDocumentSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Safe parse with logging
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(`Validation failed${context ? ` in ${context}` : ''}:`, {
        errors: result.error.issues,
        data,
      });
    }
    return { success: false, errors: result.error.issues };
  }

  return { success: true, data: result.data };
}

/**
 * Validate or throw with formatted error
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message).join(', ');
    throw new Error(errorMessage || `Validation failed: ${issues}`);
  }

  return result.data;
}
