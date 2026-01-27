/**
 * Marathon Data Validation
 *
 * Validates marathon course data for:
 * - Required fields
 * - Data integrity (elevation, distance, coordinates)
 * - Content quality (descriptions, FAQs)
 * - SEO readiness
 */

import type {
  MarathonCourseData,
  CoursePoint,
  PaceStrategy,
  RaceFaq,
} from './types';

// =============================================================================
// Validation Result Types
// =============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// =============================================================================
// Field Validators
// =============================================================================

/**
 * Validate route points
 */
function validateRoutePoints(
  points: CoursePoint[] | undefined,
  fieldName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!points || points.length === 0) {
    issues.push({
      field: fieldName,
      message: `${fieldName} is empty or missing`,
      severity: 'warning',
      suggestion: 'Add at least 10-15 points for basic course representation',
    });
    return issues;
  }

  // Check minimum points
  if (points.length < 10) {
    issues.push({
      field: fieldName,
      message: `${fieldName} has only ${points.length} points`,
      severity: 'warning',
      suggestion: 'Consider adding more points for better course representation',
    });
  }

  // Check for valid coordinates
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Validate latitude
    if (point.lat < -90 || point.lat > 90) {
      issues.push({
        field: `${fieldName}[${i}].lat`,
        message: `Invalid latitude: ${point.lat}`,
        severity: 'error',
      });
    }

    // Validate longitude
    if (point.lng < -180 || point.lng > 180) {
      issues.push({
        field: `${fieldName}[${i}].lng`,
        message: `Invalid longitude: ${point.lng}`,
        severity: 'error',
      });
    }

    // Check for elevation if present
    if (point.ele !== undefined && (point.ele < -500 || point.ele > 9000)) {
      issues.push({
        field: `${fieldName}[${i}].ele`,
        message: `Suspicious elevation value: ${point.ele}m`,
        severity: 'warning',
      });
    }

    // Check for distance progression
    if (i > 0 && point.dist !== undefined && points[i - 1].dist !== undefined) {
      if (point.dist! <= points[i - 1].dist!) {
        issues.push({
          field: `${fieldName}[${i}].dist`,
          message: `Distance not increasing: ${point.dist} <= ${points[i - 1].dist}`,
          severity: 'warning',
        });
      }
    }
  }

  return issues;
}

/**
 * Validate elevation data
 */
function validateElevation(data: MarathonCourseData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { elevation } = data;

  // Check for reasonable values
  if (elevation.gain < 0) {
    issues.push({
      field: 'elevation.gain',
      message: `Elevation gain cannot be negative: ${elevation.gain}`,
      severity: 'error',
    });
  }

  if (elevation.loss < 0) {
    issues.push({
      field: 'elevation.loss',
      message: `Elevation loss cannot be negative: ${elevation.loss}`,
      severity: 'error',
    });
  }

  // Check for extreme values (unlikely for road marathons)
  if (elevation.gain > 2000) {
    issues.push({
      field: 'elevation.gain',
      message: `Very high elevation gain: ${elevation.gain}m`,
      severity: 'warning',
      suggestion: 'Verify this is correct for a road marathon',
    });
  }

  // Check net change consistency
  const calculatedNetChange = elevation.startElevation - elevation.endElevation;
  if (Math.abs(calculatedNetChange - elevation.netChange) > 1) {
    issues.push({
      field: 'elevation.netChange',
      message: `Net change inconsistent: stated ${elevation.netChange}m vs calculated ${calculatedNetChange}m`,
      severity: 'warning',
    });
  }

  return issues;
}

/**
 * Validate pace strategy
 */
function validatePaceStrategy(strategy: PaceStrategy | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!strategy) {
    issues.push({
      field: 'paceStrategy',
      message: 'No pace strategy defined',
      severity: 'info',
      suggestion: 'Adding a pace strategy improves content value',
    });
    return issues;
  }

  // Check summary length
  if (strategy.summary.length < 50) {
    issues.push({
      field: 'paceStrategy.summary',
      message: 'Pace strategy summary is too short',
      severity: 'warning',
      suggestion: 'Add more detail to the strategy summary (50+ characters)',
    });
  }

  // Check segments
  if (!strategy.segments || strategy.segments.length === 0) {
    issues.push({
      field: 'paceStrategy.segments',
      message: 'No pace segments defined',
      severity: 'warning',
    });
  } else if (strategy.segments.length < 4) {
    issues.push({
      field: 'paceStrategy.segments',
      message: `Only ${strategy.segments.length} pace segments`,
      severity: 'info',
      suggestion: 'Consider adding more segments for detailed guidance',
    });
  }

  return issues;
}

/**
 * Validate FAQs
 */
function validateFaqs(faqs: RaceFaq[] | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!faqs || faqs.length === 0) {
    issues.push({
      field: 'faq',
      message: 'No FAQs defined',
      severity: 'warning',
      suggestion: 'Add 3-5 FAQs for SEO and user value',
    });
    return issues;
  }

  if (faqs.length < 3) {
    issues.push({
      field: 'faq',
      message: `Only ${faqs.length} FAQs`,
      severity: 'info',
      suggestion: 'Consider adding more FAQs (3-5 recommended)',
    });
  }

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];

    // Check question length
    if (faq.question.length < 20) {
      issues.push({
        field: `faq[${i}].question`,
        message: 'FAQ question is too short',
        severity: 'warning',
      });
    }

    // Check answer length
    if (faq.answer.length < 50) {
      issues.push({
        field: `faq[${i}].answer`,
        message: 'FAQ answer is too short',
        severity: 'warning',
        suggestion: 'Expand answers to 50+ characters for better SEO',
      });
    }

    // Check for duplicate questions
    for (let j = i + 1; j < faqs.length; j++) {
      if (faq.question.toLowerCase() === faqs[j].question.toLowerCase()) {
        issues.push({
          field: `faq[${i}].question`,
          message: 'Duplicate FAQ question',
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

/**
 * Validate description
 */
function validateDescription(description: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!description) {
    issues.push({
      field: 'description',
      message: 'Description is missing',
      severity: 'error',
    });
    return issues;
  }

  if (description.length < 100) {
    issues.push({
      field: 'description',
      message: `Description is too short: ${description.length} characters`,
      severity: 'warning',
      suggestion: 'Expand description to 100-300 characters',
    });
  }

  if (description.length > 500) {
    issues.push({
      field: 'description',
      message: 'Description may be too long for SEO',
      severity: 'info',
      suggestion: 'Consider trimming to under 300 characters for meta description',
    });
  }

  return issues;
}

/**
 * Validate event info
 */
function validateEventInfo(data: MarathonCourseData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { event } = data;

  if (!event.name) {
    issues.push({
      field: 'event.name',
      message: 'Event name is missing',
      severity: 'error',
    });
  }

  if (!event.city) {
    issues.push({
      field: 'event.city',
      message: 'City is missing',
      severity: 'error',
    });
  }

  if (!event.country) {
    issues.push({
      field: 'event.country',
      message: 'Country is missing',
      severity: 'error',
    });
  }

  if (!event.website) {
    issues.push({
      field: 'event.website',
      message: 'Official website URL is missing',
      severity: 'warning',
    });
  } else if (!event.website.startsWith('http')) {
    issues.push({
      field: 'event.website',
      message: 'Website URL should start with http:// or https://',
      severity: 'error',
    });
  }

  if (!event.raceDate) {
    issues.push({
      field: 'event.raceDate',
      message: 'Race date is missing',
      severity: 'warning',
    });
  }

  return issues;
}

/**
 * Validate distance
 */
function validateDistance(data: MarathonCourseData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (data.distance <= 0) {
    issues.push({
      field: 'distance',
      message: `Invalid distance: ${data.distance}`,
      severity: 'error',
    });
    return issues;
  }

  // Check for standard distances
  const standardDistances = [5, 10, 21.0975, 42.195, 50, 100];
  const tolerance = 0.5;

  const isStandard = standardDistances.some(
    (d) => Math.abs(data.distance - d) < tolerance
  );

  if (!isStandard && data.distance < 100) {
    issues.push({
      field: 'distance',
      message: `Non-standard distance: ${data.distance}km`,
      severity: 'info',
      suggestion: 'Verify this is the correct distance',
    });
  }

  return issues;
}

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validate a complete marathon course data object
 */
export function validateMarathonData(data: MarathonCourseData): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Required field validation
  if (!data.id) {
    issues.push({ field: 'id', message: 'ID is missing', severity: 'error' });
  }
  if (!data.slug) {
    issues.push({ field: 'slug', message: 'Slug is missing', severity: 'error' });
  }
  if (!data.routeKey) {
    issues.push({ field: 'routeKey', message: 'Route key is missing', severity: 'error' });
  }

  // Component validation
  issues.push(...validateEventInfo(data));
  issues.push(...validateDistance(data));
  issues.push(...validateElevation(data));
  issues.push(...validateDescription(data.description));
  issues.push(...validateRoutePoints(data.route?.thumbnailPoints, 'route.thumbnailPoints'));
  issues.push(...validatePaceStrategy(data.paceStrategy));
  issues.push(...validateFaqs(data.faq));

  // Tips validation
  if (!data.tips || (Array.isArray(data.tips) && data.tips.length === 0)) {
    issues.push({
      field: 'tips',
      message: 'No tips defined',
      severity: 'info',
      suggestion: 'Add 3-5 tips for better user experience',
    });
  }

  // Separate errors and warnings
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  // Calculate score
  let score = 100;
  score -= errors.length * 20;
  score -= warnings.length * 5;
  score -= issues.filter((i) => i.severity === 'info').length * 1;
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: errors.length === 0,
    score,
    issues,
    errors,
    warnings,
  };
}

/**
 * Validate multiple marathon data objects
 */
export function validateBatch(
  dataArray: MarathonCourseData[]
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const data of dataArray) {
    results.set(data.routeKey, validateMarathonData(data));
  }

  return results;
}

/**
 * Get batch validation summary
 */
export function getBatchValidationSummary(
  results: Map<string, ValidationResult>
): {
  totalRaces: number;
  validRaces: number;
  invalidRaces: number;
  averageScore: number;
  totalErrors: number;
  totalWarnings: number;
  commonIssues: Array<{ field: string; count: number }>;
} {
  const resultsArray = Array.from(results.values());

  const validRaces = resultsArray.filter((r) => r.isValid).length;
  const totalScores = resultsArray.reduce((sum, r) => sum + r.score, 0);
  const totalErrors = resultsArray.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = resultsArray.reduce((sum, r) => sum + r.warnings.length, 0);

  // Count common issues by field
  const fieldCounts = new Map<string, number>();
  for (const result of resultsArray) {
    for (const issue of result.issues) {
      // Normalize field names (remove array indices)
      const normalizedField = issue.field.replace(/\[\d+\]/g, '[]');
      fieldCounts.set(normalizedField, (fieldCounts.get(normalizedField) || 0) + 1);
    }
  }

  const commonIssues = Array.from(fieldCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([field, count]) => ({ field, count }));

  return {
    totalRaces: results.size,
    validRaces,
    invalidRaces: results.size - validRaces,
    averageScore: results.size > 0 ? totalScores / results.size : 0,
    totalErrors,
    totalWarnings,
    commonIssues,
  };
}

// =============================================================================
// SEO Readiness Check
// =============================================================================

export interface SeoReadinessResult {
  isReady: boolean;
  score: number;
  requirements: Array<{
    requirement: string;
    met: boolean;
    details?: string;
  }>;
}

/**
 * Check if marathon data is ready for SEO page generation
 */
export function checkSeoReadiness(data: MarathonCourseData): SeoReadinessResult {
  const requirements: SeoReadinessResult['requirements'] = [];

  // Required for SEO
  requirements.push({
    requirement: 'Has event name',
    met: !!data.event.name && data.event.name.length > 0,
  });

  requirements.push({
    requirement: 'Has description (100+ chars)',
    met: data.description.length >= 100,
    details: `Current: ${data.description.length} characters`,
  });

  requirements.push({
    requirement: 'Has valid route key',
    met: !!data.routeKey && data.routeKey.length > 0,
  });

  requirements.push({
    requirement: 'Has elevation data',
    met: data.elevation.gain >= 0 && data.elevation.loss >= 0,
  });

  requirements.push({
    requirement: 'Has thumbnail points for map',
    met: (data.route?.thumbnailPoints?.length || 0) >= 10,
    details: `Current: ${data.route?.thumbnailPoints?.length || 0} points`,
  });

  // Recommended for SEO
  requirements.push({
    requirement: 'Has 3+ FAQs',
    met: (data.faq?.length || 0) >= 3,
    details: `Current: ${data.faq?.length || 0} FAQs`,
  });

  requirements.push({
    requirement: 'Has pace strategy',
    met: !!data.paceStrategy,
  });

  requirements.push({
    requirement: 'Has tips',
    met: Array.isArray(data.tips) ? data.tips.length > 0 : !!data.tips,
  });

  requirements.push({
    requirement: 'Has official website URL',
    met: !!data.event.website && data.event.website.startsWith('http'),
  });

  requirements.push({
    requirement: 'Has race date',
    met: !!data.event.raceDate,
  });

  const metCount = requirements.filter((r) => r.met).length;
  const score = Math.round((metCount / requirements.length) * 100);

  // Must have all critical requirements (first 5)
  const criticalRequirements = requirements.slice(0, 5);
  const isReady = criticalRequirements.every((r) => r.met);

  return {
    isReady,
    score,
    requirements,
  };
}
