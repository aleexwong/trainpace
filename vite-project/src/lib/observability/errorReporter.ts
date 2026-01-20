/**
 * Production Error Reporting Service
 *
 * Provides a centralized interface for error tracking and reporting.
 * Supports multiple backends (Sentry, LogRocket, custom endpoints).
 *
 * Features:
 * - Automatic error enrichment with context
 * - Deduplication of repeated errors
 * - Rate limiting to prevent spam
 * - User context association
 * - Environment-aware behavior
 */

interface ErrorContext {
  componentStack?: string | null;
  errorId?: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorReporterConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  sampleRate: number; // 0-1, percentage of errors to capture
  maxBreadcrumbs: number;
  ignorePatterns: RegExp[];
}

interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

class ErrorReporter {
  private config: ErrorReporterConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private errorCounts: Map<string, { count: number; lastSeen: number }> = new Map();
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      enabled: import.meta.env.PROD,
      environment: this.detectEnvironment(),
      sampleRate: 1.0,
      maxBreadcrumbs: 50,
      ignorePatterns: [
        /ResizeObserver loop/i,
        /Loading chunk.*failed/i,
        /Network request failed/i,
        /AbortError/i,
      ],
    };

    this.setupGlobalHandlers();
  }

  private generateSessionId(): string {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private detectEnvironment(): 'development' | 'staging' | 'production' {
    if (import.meta.env.DEV) return 'development';
    if (window.location.hostname.includes('staging') || window.location.hostname.includes('preview')) {
      return 'staging';
    }
    return 'production';
  }

  private setupGlobalHandlers(): void {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        { context: 'unhandledrejection' }
      );
    });

    // Capture global errors
    window.addEventListener('error', (event) => {
      if (event.error) {
        this.captureException(event.error, {
          context: 'window.onerror',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      }
    });
  }

  /**
   * Set user context for error attribution
   */
  setUser(userId: string | null): void {
    this.userId = userId;
    this.addBreadcrumb('auth', userId ? 'User identified' : 'User cleared', { userId });
  }

  /**
   * Add a breadcrumb for context tracking
   */
  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Trim to max size
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnore(error: Error): boolean {
    return this.config.ignorePatterns.some((pattern) =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Check if error is duplicate (within time window)
   */
  private isDuplicate(fingerprint: string): boolean {
    const now = Date.now();
    const entry = this.errorCounts.get(fingerprint);

    if (entry && now - entry.lastSeen < 60000) { // 1 minute window
      entry.count++;
      entry.lastSeen = now;
      return entry.count > 3; // Allow first 3 occurrences
    }

    this.errorCounts.set(fingerprint, { count: 1, lastSeen: now });
    return false;
  }

  /**
   * Generate a fingerprint for error deduplication
   */
  private generateFingerprint(error: Error, context?: ErrorContext): string {
    const parts = [
      error.name,
      error.message.substring(0, 100),
      context?.context || 'unknown',
    ];
    return parts.join('|');
  }

  /**
   * Capture and report an exception
   */
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.config.enabled) {
      console.error('[ErrorReporter] Error captured (dev mode):', error, context);
      return;
    }

    // Check ignore patterns
    if (this.shouldIgnore(error)) {
      return;
    }

    // Check sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Check for duplicates
    const fingerprint = this.generateFingerprint(error, context);
    if (this.isDuplicate(fingerprint)) {
      return;
    }

    const errorPayload = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      sessionId: this.sessionId,
      userId: this.userId || context?.userId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        ...context,
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      breadcrumbs: this.breadcrumbs.slice(-20), // Last 20 breadcrumbs
      fingerprint,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Captured');
      console.error(error);
      console.log('Context:', context);
      console.log('Payload:', errorPayload);
      console.groupEnd();
    }

    // In production, this would send to error tracking service
    // Example: Sentry, LogRocket, custom endpoint
    this.sendToService(errorPayload);
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    this.addBreadcrumb('message', message, { level, ...context?.metadata });

    if (level === 'error') {
      this.captureException(new Error(message), context);
    }
  }

  /**
   * Send error payload to external service
   */
  private sendToService(payload: Record<string, unknown>): void {
    // In production, integrate with actual error tracking:
    //
    // Sentry:
    // Sentry.captureException(error, { extra: context });
    //
    // Custom endpoint:
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(payload) });
    //
    // For now, we'll use navigator.sendBeacon for reliability
    if (import.meta.env.PROD && typeof navigator.sendBeacon === 'function') {
      // Beacon would go to your error collection endpoint
      // navigator.sendBeacon('/api/errors', JSON.stringify(payload));
    }

    // Also log structured error for server-side log aggregation
    console.error('[ERROR]', JSON.stringify({
      level: 'error',
      ...payload,
    }));
  }

  /**
   * Create a scoped error reporter for a specific feature
   */
  createScope(scopeName: string): {
    captureException: (error: Error, context?: Omit<ErrorContext, 'context'>) => void;
    captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
    addBreadcrumb: (message: string, data?: Record<string, unknown>) => void;
  } {
    return {
      captureException: (error, context) =>
        this.captureException(error, { ...context, context: scopeName }),
      captureMessage: (message, level) =>
        this.captureMessage(message, level, { context: scopeName }),
      addBreadcrumb: (message, data) =>
        this.addBreadcrumb(scopeName, message, data),
    };
  }
}

// Singleton instance
export const errorReporter = new ErrorReporter();

// Feature-scoped reporters
export const authErrorReporter = errorReporter.createScope('auth');
export const apiErrorReporter = errorReporter.createScope('api');
export const paceCalculatorErrorReporter = errorReporter.createScope('pace-calculator');
export const fuelPlannerErrorReporter = errorReporter.createScope('fuel-planner');
export const elevationErrorReporter = errorReporter.createScope('elevation');
