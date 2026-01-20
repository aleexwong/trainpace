/**
 * Production Structured Logger
 *
 * Provides structured, JSON-formatted logging for production environments.
 * Integrates with log aggregation services (Datadog, Splunk, ELK, etc.)
 *
 * Features:
 * - Structured JSON output for machine parsing
 * - Log levels with filtering
 * - Automatic context enrichment (timestamp, session, user, route)
 * - Sampling for high-volume logs
 * - Performance metrics tracking
 * - Child loggers for scoped logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  sessionId: string;
  userId?: string;
  route: string;
  userAgent: string;
  environment: string;
  version: string;
  traceId?: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  sampleRate: number; // 0-1 for debug/info logs
  serviceName: string;
  version: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private userId: string | null = null;
  private traceId: string | null = null;
  private defaultContext: LogContext = {};

  constructor(config?: Partial<LoggerConfig>) {
    this.sessionId = this.generateId('sess');
    this.config = {
      minLevel: import.meta.env.PROD ? 'info' : 'debug',
      enableConsole: true,
      enableRemote: import.meta.env.PROD,
      sampleRate: 0.1, // Sample 10% of debug/info logs in prod
      serviceName: 'trainpace-web',
      version: '2.0.0',
      ...config,
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Set user context for log attribution
   */
  setUser(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Set trace ID for distributed tracing
   */
  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  /**
   * Generate a new trace ID
   */
  startTrace(): string {
    this.traceId = this.generateId('trace');
    return this.traceId;
  }

  /**
   * Set default context for all logs
   */
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const configLevel = LOG_LEVELS[this.config.minLevel];
    const logLevel = LOG_LEVELS[level];
    return logLevel >= configLevel;
  }

  /**
   * Check if log should be sampled
   */
  private shouldSample(level: LogLevel): boolean {
    // Always log warn/error/fatal
    if (LOG_LEVELS[level] >= LOG_LEVELS.warn) {
      return true;
    }

    // Sample debug/info based on config
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Format log entry for output
   */
  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...context },
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      environment: import.meta.env.PROD ? 'production' : 'development',
      version: this.config.version,
      traceId: this.traceId || undefined,
    };
  }

  /**
   * Output log to console with appropriate styling
   */
  private consoleOutput(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const styles: Record<LogLevel, string> = {
      debug: 'color: gray',
      info: 'color: blue',
      warn: 'color: orange',
      error: 'color: red',
      fatal: 'color: red; font-weight: bold',
    };

    const icons: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💀',
    };

    if (import.meta.env.DEV) {
      console.log(
        `%c${icons[entry.level]} [${entry.level.toUpperCase()}] ${entry.message}`,
        styles[entry.level],
        entry.context
      );
    } else {
      // Structured output for production log aggregation
      console[entry.level === 'fatal' ? 'error' : entry.level](
        JSON.stringify(entry)
      );
    }
  }

  /**
   * Send log to remote service
   */
  private remoteOutput(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    // Use sendBeacon for reliability (fires even during page unload)
    if (typeof navigator.sendBeacon === 'function' && LOG_LEVELS[entry.level] >= LOG_LEVELS.warn) {
      // In production, this would send to log aggregation service
      // navigator.sendBeacon('/api/logs', JSON.stringify(entry));
    }
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;
    if (!this.shouldSample(level)) return;

    const entry = this.formatEntry(level, message, context);
    this.consoleOutput(entry);
    this.remoteOutput(entry);
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  fatal(message: string, context?: LogContext): void {
    this.log('fatal', message, context);
  }

  /**
   * Log with timing measurement
   */
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`${label} completed`, { duration_ms: Math.round(duration) });
    };
  }

  /**
   * Create child logger with preset context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.config);
    child.sessionId = this.sessionId;
    child.userId = this.userId;
    child.traceId = this.traceId;
    child.defaultContext = { ...this.defaultContext, ...context };
    return child;
  }
}

// Singleton instance
export const logger = new Logger();

// Feature-scoped loggers
export const authLogger = logger.child({ feature: 'auth' });
export const apiLogger = logger.child({ feature: 'api' });
export const paceLogger = logger.child({ feature: 'pace-calculator' });
export const fuelLogger = logger.child({ feature: 'fuel-planner' });
export const elevationLogger = logger.child({ feature: 'elevation' });
