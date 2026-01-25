/**
 * SEO Validation & Safeguards
 *
 * Quality assurance utilities for programmatic SEO at scale:
 * - Content quality validation
 * - Duplicate detection
 * - Thin content warnings
 * - Keyword cannibalization checks
 * - Link integrity validation
 * - Schema validation
 */

import type {
  SeoPageConfig,
  SeoValidationError,
  SeoValidationWarning,
} from './types';
import { validateInternalLinks } from './internal-linking';
import { validateContentUniqueness, detectCannibalization } from './content-generators';
import { validateMetaTags, generateMetaTags } from './meta-generators';

// =============================================================================
// Validation Thresholds
// =============================================================================

export const SEO_THRESHOLDS = {
  // Title
  minTitleLength: 30,
  maxTitleLength: 60,
  warnTitleLength: 55,

  // Description
  minDescriptionLength: 70,
  maxDescriptionLength: 160,
  warnDescriptionLength: 150,

  // Content
  minIntroLength: 50,
  minBullets: 2,
  maxBullets: 6,

  // FAQ
  minFaqItems: 2,
  maxFaqItems: 10,
  minFaqAnswerLength: 30,

  // Similarity
  maxContentSimilarity: 0.7,
} as const;

// =============================================================================
// Individual Page Validation
// =============================================================================

export interface PageValidationResult {
  pageId: string;
  isValid: boolean;
  score: number; // 0-100
  errors: SeoValidationError[];
  warnings: SeoValidationWarning[];
}

/**
 * Validate a single page's SEO quality
 */
export function validatePage(page: SeoPageConfig): PageValidationResult {
  const errors: SeoValidationError[] = [];
  const warnings: SeoValidationWarning[] = [];
  let score = 100;

  // Required fields
  if (!page.id) {
    errors.push({ field: 'id', message: 'Page ID is required', pageId: page.id });
    score -= 20;
  }
  if (!page.slug) {
    errors.push({ field: 'slug', message: 'Slug is required', pageId: page.id });
    score -= 20;
  }
  if (!page.path) {
    errors.push({ field: 'path', message: 'Path is required', pageId: page.id });
    score -= 20;
  }

  // Title validation
  if (!page.title) {
    errors.push({ field: 'title', message: 'Title is required', pageId: page.id });
    score -= 20;
  } else {
    if (page.title.length < SEO_THRESHOLDS.minTitleLength) {
      warnings.push({
        field: 'title',
        message: `Title is too short (${page.title.length} chars, min ${SEO_THRESHOLDS.minTitleLength})`,
        suggestion: 'Add more descriptive keywords to the title',
        pageId: page.id,
      });
      score -= 5;
    }
    if (page.title.length > SEO_THRESHOLDS.maxTitleLength) {
      warnings.push({
        field: 'title',
        message: `Title may be truncated (${page.title.length} chars, max ${SEO_THRESHOLDS.maxTitleLength})`,
        suggestion: 'Shorten the title to prevent truncation in search results',
        pageId: page.id,
      });
      score -= 5;
    }
    if (!page.title.includes('|') && !page.title.includes('-')) {
      warnings.push({
        field: 'title',
        message: 'Title lacks brand separator',
        suggestion: 'Consider adding "| TrainPace" to the title',
        pageId: page.id,
      });
    }
  }

  // Description validation
  if (!page.description) {
    errors.push({ field: 'description', message: 'Description is required', pageId: page.id });
    score -= 20;
  } else {
    if (page.description.length < SEO_THRESHOLDS.minDescriptionLength) {
      warnings.push({
        field: 'description',
        message: `Description is too short (${page.description.length} chars, min ${SEO_THRESHOLDS.minDescriptionLength})`,
        suggestion: 'Add more detail to improve click-through rate',
        pageId: page.id,
      });
      score -= 5;
    }
    if (page.description.length > SEO_THRESHOLDS.maxDescriptionLength) {
      warnings.push({
        field: 'description',
        message: `Description may be truncated (${page.description.length} chars, max ${SEO_THRESHOLDS.maxDescriptionLength})`,
        suggestion: 'Shorten to prevent truncation',
        pageId: page.id,
      });
      score -= 3;
    }
  }

  // H1 validation
  if (!page.h1) {
    errors.push({ field: 'h1', message: 'H1 heading is required', pageId: page.id });
    score -= 15;
  } else if (page.h1.length > 70) {
    warnings.push({
      field: 'h1',
      message: `H1 is long (${page.h1.length} chars)`,
      suggestion: 'Consider a more concise heading',
      pageId: page.id,
    });
    score -= 2;
  }

  // Intro validation
  if (!page.intro) {
    errors.push({ field: 'intro', message: 'Intro paragraph is required', pageId: page.id });
    score -= 10;
  } else if (page.intro.length < SEO_THRESHOLDS.minIntroLength) {
    warnings.push({
      field: 'intro',
      message: `Intro is thin (${page.intro.length} chars)`,
      suggestion: 'Expand the introduction for better content depth',
      pageId: page.id,
    });
    score -= 5;
  }

  // Bullets validation
  if (!page.bullets || page.bullets.length < SEO_THRESHOLDS.minBullets) {
    warnings.push({
      field: 'bullets',
      message: `Few bullet points (${page.bullets?.length || 0})`,
      suggestion: 'Add more benefit-focused bullet points',
      pageId: page.id,
    });
    score -= 3;
  }
  if (page.bullets && page.bullets.length > SEO_THRESHOLDS.maxBullets) {
    warnings.push({
      field: 'bullets',
      message: `Many bullet points (${page.bullets.length})`,
      suggestion: 'Consider condensing into fewer, more impactful points',
      pageId: page.id,
    });
  }

  // CTA validation
  if (!page.cta || !page.cta.href || !page.cta.label) {
    errors.push({ field: 'cta', message: 'CTA with href and label is required', pageId: page.id });
    score -= 10;
  }

  // FAQ validation (bonus points)
  if (page.faq && page.faq.length >= SEO_THRESHOLDS.minFaqItems) {
    // Check FAQ quality
    const shortAnswers = page.faq.filter(
      (f) => f.answer.length < SEO_THRESHOLDS.minFaqAnswerLength
    );
    if (shortAnswers.length > 0) {
      warnings.push({
        field: 'faq',
        message: `${shortAnswers.length} FAQ answer(s) are too short`,
        suggestion: 'Expand FAQ answers to provide more value',
        pageId: page.id,
      });
      score -= 2;
    }
  } else if (!page.faq || page.faq.length === 0) {
    warnings.push({
      field: 'faq',
      message: 'No FAQ items',
      suggestion: 'Add FAQs to improve SEO and enable rich snippets',
      pageId: page.id,
    });
    score -= 5;
  }

  // HowTo validation (bonus points)
  if (!page.howTo) {
    warnings.push({
      field: 'howTo',
      message: 'No HowTo schema',
      suggestion: 'Add HowTo content for featured snippet eligibility',
      pageId: page.id,
    });
    score -= 3;
  }

  return {
    pageId: page.id,
    isValid: errors.length === 0,
    score: Math.max(0, score),
    errors,
    warnings,
  };
}

// =============================================================================
// Batch Validation
// =============================================================================

export interface BatchValidationResult {
  totalPages: number;
  validPages: number;
  invalidPages: number;
  averageScore: number;
  errorsByField: Record<string, number>;
  warningsByField: Record<string, number>;
  pageResults: PageValidationResult[];
  duplicateIssues: ReturnType<typeof validateContentUniqueness>;
  cannibalizationIssues: ReturnType<typeof detectCannibalization>;
  linkingIssues: ReturnType<typeof validateInternalLinks>;
}

/**
 * Validate all pages in a batch
 */
export function validateAllPages(pages: SeoPageConfig[]): BatchValidationResult {
  const pageResults: PageValidationResult[] = [];
  const errorsByField: Record<string, number> = {};
  const warningsByField: Record<string, number> = {};

  let totalScore = 0;
  let validCount = 0;

  for (const page of pages) {
    const result = validatePage(page);
    pageResults.push(result);
    totalScore += result.score;

    if (result.isValid) {
      validCount++;
    }

    for (const error of result.errors) {
      errorsByField[error.field] = (errorsByField[error.field] || 0) + 1;
    }
    for (const warning of result.warnings) {
      warningsByField[warning.field] = (warningsByField[warning.field] || 0) + 1;
    }
  }

  // Run cross-page validations
  const duplicateIssues = validateContentUniqueness(pages, SEO_THRESHOLDS.maxContentSimilarity);
  const cannibalizationIssues = detectCannibalization(pages);
  const linkingIssues = validateInternalLinks(pages);

  return {
    totalPages: pages.length,
    validPages: validCount,
    invalidPages: pages.length - validCount,
    averageScore: Math.round(totalScore / pages.length),
    errorsByField,
    warningsByField,
    pageResults,
    duplicateIssues,
    cannibalizationIssues,
    linkingIssues,
  };
}

// =============================================================================
// Quality Report Generation
// =============================================================================

export interface QualityReport {
  summary: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    totalPages: number;
    issues: {
      critical: number;
      major: number;
      minor: number;
    };
  };
  sections: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    details: string[];
  }>;
  recommendations: string[];
}

/**
 * Generate a quality report from validation results
 */
export function generateQualityReport(
  validationResult: BatchValidationResult
): QualityReport {
  const {
    totalPages,
    validPages,
    averageScore,
    errorsByField,
    warningsByField,
    duplicateIssues,
    cannibalizationIssues,
    linkingIssues,
  } = validationResult;

  // Calculate grade
  let grade: QualityReport['summary']['grade'];
  if (averageScore >= 90) grade = 'A';
  else if (averageScore >= 80) grade = 'B';
  else if (averageScore >= 70) grade = 'C';
  else if (averageScore >= 60) grade = 'D';
  else grade = 'F';

  // Count issues by severity
  const criticalCount = Object.values(errorsByField).reduce((a, b) => a + b, 0);
  const majorCount = duplicateIssues.duplicates.length + cannibalizationIssues.conflicts.length;
  const minorCount = Object.values(warningsByField).reduce((a, b) => a + b, 0);

  // Build sections
  const sections: QualityReport['sections'] = [];

  // Content Quality Section
  sections.push({
    name: 'Content Quality',
    status: validPages === totalPages ? 'pass' : validPages > totalPages * 0.9 ? 'warn' : 'fail',
    details: [
      `${validPages}/${totalPages} pages pass validation`,
      `Average quality score: ${averageScore}/100`,
      Object.entries(errorsByField)
        .map(([field, count]) => `${count} ${field} errors`)
        .join(', ') || 'No critical errors',
    ],
  });

  // Uniqueness Section
  sections.push({
    name: 'Content Uniqueness',
    status: duplicateIssues.isUnique ? 'pass' : duplicateIssues.duplicates.length > 5 ? 'fail' : 'warn',
    details: [
      duplicateIssues.isUnique
        ? 'All content is unique'
        : `${duplicateIssues.duplicates.length} duplicate issues found`,
      `${duplicateIssues.similarContent.length} pairs with high similarity`,
    ],
  });

  // Keyword Targeting Section
  sections.push({
    name: 'Keyword Targeting',
    status: cannibalizationIssues.hasIssues ? 'warn' : 'pass',
    details: [
      cannibalizationIssues.hasIssues
        ? `${cannibalizationIssues.conflicts.length} potential cannibalization issues`
        : 'No keyword cannibalization detected',
    ],
  });

  // Internal Linking Section
  sections.push({
    name: 'Internal Linking',
    status: linkingIssues.isValid ? 'pass' : linkingIssues.brokenLinks.length > 0 ? 'fail' : 'warn',
    details: [
      linkingIssues.isValid
        ? 'All internal links are valid'
        : `${linkingIssues.brokenLinks.length} broken links`,
      `${linkingIssues.orphanPages.length} orphan pages (no incoming links)`,
    ],
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (averageScore < 80) {
    recommendations.push('Improve content quality by ensuring all pages have FAQs and HowTo schemas');
  }
  if (!duplicateIssues.isUnique) {
    recommendations.push('Review duplicate content and add more variation to titles and descriptions');
  }
  if (cannibalizationIssues.hasIssues) {
    recommendations.push('Differentiate page titles to avoid competing for the same keywords');
  }
  if (linkingIssues.orphanPages.length > 0) {
    recommendations.push('Add internal links to orphan pages to improve discoverability');
  }
  if (errorsByField['title']) {
    recommendations.push('Fix missing or malformed titles on affected pages');
  }
  if (errorsByField['description']) {
    recommendations.push('Add meta descriptions to all pages');
  }

  return {
    summary: {
      grade,
      score: averageScore,
      totalPages,
      issues: {
        critical: criticalCount,
        major: majorCount,
        minor: minorCount,
      },
    },
    sections,
    recommendations,
  };
}

// =============================================================================
// Pre-publish Checks
// =============================================================================

export interface PrePublishCheckResult {
  canPublish: boolean;
  blockers: string[];
  warnings: string[];
}

/**
 * Run pre-publish checks to ensure pages are ready for production
 */
export function runPrePublishChecks(pages: SeoPageConfig[]): PrePublishCheckResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // Check for required fields on all pages
  const missingRequired = pages.filter(
    (p) => !p.id || !p.slug || !p.path || !p.title || !p.description
  );
  if (missingRequired.length > 0) {
    blockers.push(`${missingRequired.length} pages missing required fields`);
  }

  // Check for duplicate paths
  const pathCounts = new Map<string, number>();
  for (const page of pages) {
    pathCounts.set(page.path, (pathCounts.get(page.path) || 0) + 1);
  }
  const duplicatePaths = [...pathCounts.entries()].filter(([_, count]) => count > 1);
  if (duplicatePaths.length > 0) {
    blockers.push(`${duplicatePaths.length} duplicate paths detected`);
  }

  // Check for empty content
  const emptyContent = pages.filter(
    (p) => !p.intro || p.intro.length < 20 || !p.bullets || p.bullets.length === 0
  );
  if (emptyContent.length > 0) {
    if (emptyContent.length > pages.length * 0.1) {
      blockers.push(`${emptyContent.length} pages have thin/empty content`);
    } else {
      warnings.push(`${emptyContent.length} pages have thin content`);
    }
  }

  // Check for invalid URLs in paths
  const invalidPaths = pages.filter((p) => {
    return !/^\/[a-z0-9\-\/]+$/.test(p.path);
  });
  if (invalidPaths.length > 0) {
    warnings.push(`${invalidPaths.length} pages have potentially invalid URL paths`);
  }

  // Validate meta tags
  const metaIssues = pages.filter((p) => {
    const result = validateMetaTags(generateMetaTags(p));
    return !result.isValid;
  });
  if (metaIssues.length > 0) {
    warnings.push(`${metaIssues.length} pages have meta tag issues`);
  }

  return {
    canPublish: blockers.length === 0,
    blockers,
    warnings,
  };
}

// =============================================================================
// CI/CD Integration
// =============================================================================

/**
 * Format validation results for CI output
 */
export function formatForCI(result: BatchValidationResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('SEO VALIDATION REPORT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Total Pages: ${result.totalPages}`);
  lines.push(`Valid Pages: ${result.validPages}`);
  lines.push(`Average Score: ${result.averageScore}/100`);
  lines.push('');

  if (Object.keys(result.errorsByField).length > 0) {
    lines.push('ERRORS:');
    for (const [field, count] of Object.entries(result.errorsByField)) {
      lines.push(`  - ${field}: ${count} issues`);
    }
    lines.push('');
  }

  if (Object.keys(result.warningsByField).length > 0) {
    lines.push('WARNINGS:');
    for (const [field, count] of Object.entries(result.warningsByField)) {
      lines.push(`  - ${field}: ${count} issues`);
    }
    lines.push('');
  }

  if (!result.duplicateIssues.isUnique) {
    lines.push('DUPLICATE CONTENT:');
    lines.push(`  - ${result.duplicateIssues.duplicates.length} duplicate issues`);
    lines.push('');
  }

  if (result.cannibalizationIssues.hasIssues) {
    lines.push('KEYWORD CANNIBALIZATION:');
    lines.push(`  - ${result.cannibalizationIssues.conflicts.length} conflicts`);
    lines.push('');
  }

  if (!result.linkingIssues.isValid) {
    lines.push('LINKING ISSUES:');
    lines.push(`  - ${result.linkingIssues.brokenLinks.length} broken links`);
    lines.push(`  - ${result.linkingIssues.orphanPages.length} orphan pages`);
    lines.push('');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Exit code for CI based on validation results
 */
export function getCIExitCode(result: BatchValidationResult): number {
  // Fail if any critical errors
  if (result.invalidPages > 0) return 1;
  // Fail if many duplicates
  if (result.duplicateIssues.duplicates.length > 10) return 1;
  // Fail if broken links
  if (result.linkingIssues.brokenLinks.length > 0) return 1;
  // Pass
  return 0;
}
