/**
 * Web Vitals Performance Monitoring
 *
 * Tracks Core Web Vitals and custom performance metrics.
 * Essential for production performance monitoring and optimization.
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness
 */

import { logger } from './logger';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceThresholds {
  good: number;
  needsImprovement: number;
}

const THRESHOLDS: Record<string, PerformanceThresholds> = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

/**
 * Calculate rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics/monitoring
 */
function reportMetric(metric: WebVitalMetric): void {
  const logContext = {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_rating: metric.rating,
    metric_delta: metric.delta,
    navigation_type: metric.navigationType,
  };

  // Log based on rating
  if (metric.rating === 'poor') {
    logger.warn(`Performance: ${metric.name} is poor`, logContext);
  } else if (metric.rating === 'needs-improvement') {
    logger.info(`Performance: ${metric.name} needs improvement`, logContext);
  } else {
    logger.debug(`Performance: ${metric.name} is good`, logContext);
  }

  // In production, send to analytics
  if (import.meta.env.PROD) {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as { gtag: (...args: unknown[]) => void }).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Could also send to custom endpoint
    // navigator.sendBeacon('/api/metrics', JSON.stringify(metric));
  }
}

/**
 * Initialize Web Vitals monitoring
 *
 * Uses the web-vitals library if available, otherwise uses
 * Performance Observer API directly.
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import for code splitting
    const { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');

    const handleMetric = (metric: { name: string; value: number; delta: number; id: string; navigationType: string }) => {
      reportMetric({
        ...metric,
        rating: getRating(metric.name, metric.value),
      });
    };

    // Register all metric handlers
    onCLS(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);

    logger.debug('Web Vitals monitoring initialized');
  } catch {
    // Fallback to basic Performance Observer
    initFallbackMetrics();
  }
}

/**
 * Fallback Performance Observer implementation
 */
function initFallbackMetrics(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  // LCP Observer
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        reportMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
          delta: lastEntry.startTime,
          id: `lcp-${Date.now()}`,
          navigationType: 'navigate',
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // LCP not supported
  }

  // FCP Observer
  try {
    const paintObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          reportMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: `fcp-${Date.now()}`,
            navigationType: 'navigate',
          });
        }
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // Paint timing not supported
  }

  // CLS Observer
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Report final CLS on page hide
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportMetric({
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          delta: clsValue,
          id: `cls-${Date.now()}`,
          navigationType: 'navigate',
        });
      }
    });
  } catch {
    // Layout shift not supported
  }

  logger.debug('Fallback performance metrics initialized');
}

/**
 * Custom performance marker utilities
 */
export const performanceMarker = {
  /**
   * Start a performance measurement
   */
  start(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  },

  /**
   * End a performance measurement and report
   */
  end(name: string): number | null {
    if (typeof performance === 'undefined') return null;

    performance.mark(`${name}-end`);
    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const entries = performance.getEntriesByName(name, 'measure');
      const duration = entries[entries.length - 1]?.duration ?? 0;

      logger.debug(`Performance: ${name}`, { duration_ms: Math.round(duration) });

      // Cleanup
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);

      return duration;
    } catch {
      return null;
    }
  },

  /**
   * Measure async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  },
};

/**
 * Resource timing utilities
 */
export function getResourceTimings(): {
  scripts: number;
  styles: number;
  images: number;
  fonts: number;
  total: number;
} {
  if (typeof performance === 'undefined') {
    return { scripts: 0, styles: 0, images: 0, fonts: 0, total: 0 };
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const categorize = (type: string) =>
    resources
      .filter((r) => r.initiatorType === type)
      .reduce((sum, r) => sum + r.duration, 0);

  return {
    scripts: Math.round(categorize('script')),
    styles: Math.round(categorize('link')),
    images: Math.round(categorize('img')),
    fonts: Math.round(categorize('css')),
    total: Math.round(resources.reduce((sum, r) => sum + r.duration, 0)),
  };
}
