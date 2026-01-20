/**
 * Production API Client
 *
 * Robust HTTP client with production-grade features.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern for failure isolation
 * - Request/response interceptors
 * - Timeout handling
 * - Request deduplication
 * - Automatic error classification
 */

import { logger, apiLogger } from '../observability';
import { apiCache } from '../performance';
import { csrfProtection } from '../security';

// ============================================================================
// Types
// ============================================================================

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  signal?: AbortSignal;
}

interface APIResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
  duration: number;
}

interface APIError extends Error {
  status?: number;
  code: string;
  retryable: boolean;
  response?: unknown;
}

type RequestInterceptor = (config: RequestConfig & { url: string }) => RequestConfig & { url: string };
type ResponseInterceptor = <T>(response: APIResponse<T>) => APIResponse<T>;
type ErrorInterceptor = (error: APIError) => APIError;

// ============================================================================
// Circuit Breaker
// ============================================================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  };

  private readonly config = {
    failureThreshold: 5,      // Failures before opening
    resetTimeout: 30000,      // Time before trying again (30s)
    halfOpenRequests: 3,      // Requests to try in half-open
  };

  private halfOpenAttempts = 0;

  isOpen(): boolean {
    if (this.state.state === 'closed') {
      return false;
    }

    if (this.state.state === 'open') {
      // Check if we should try half-open
      const timeSinceFailure = Date.now() - this.state.lastFailure;
      if (timeSinceFailure >= this.config.resetTimeout) {
        this.state.state = 'half-open';
        this.halfOpenAttempts = 0;
        return false;
      }
      return true;
    }

    // Half-open: allow limited requests
    return this.halfOpenAttempts >= this.config.halfOpenRequests;
  }

  recordSuccess(): void {
    if (this.state.state === 'half-open') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.config.halfOpenRequests) {
        // Reset to closed
        this.state = { failures: 0, lastFailure: 0, state: 'closed' };
      }
    } else {
      this.state.failures = 0;
    }
  }

  recordFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'open';
      apiLogger.warn('Circuit breaker opened', {
        failures: this.state.failures,
      });
    }
  }

  getState(): string {
    return this.state.state;
  }
}

// ============================================================================
// API Client
// ============================================================================

class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private circuitBreaker = new CircuitBreaker();
  private pendingRequests = new Map<string, Promise<APIResponse<unknown>>>();

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  // ============================================================================
  // Interceptors
  // ============================================================================

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // ============================================================================
  // Error Classification
  // ============================================================================

  private classifyError(status: number, error?: unknown): APIError {
    const apiError: APIError = new Error() as APIError;

    // Determine error code and message
    if (status === 0) {
      apiError.code = 'NETWORK_ERROR';
      apiError.message = 'Network connection failed';
      apiError.retryable = true;
    } else if (status === 401) {
      apiError.code = 'UNAUTHORIZED';
      apiError.message = 'Authentication required';
      apiError.retryable = false;
    } else if (status === 403) {
      apiError.code = 'FORBIDDEN';
      apiError.message = 'Access denied';
      apiError.retryable = false;
    } else if (status === 404) {
      apiError.code = 'NOT_FOUND';
      apiError.message = 'Resource not found';
      apiError.retryable = false;
    } else if (status === 429) {
      apiError.code = 'RATE_LIMITED';
      apiError.message = 'Too many requests. Please try again later.';
      apiError.retryable = true;
    } else if (status >= 400 && status < 500) {
      apiError.code = 'CLIENT_ERROR';
      apiError.message = 'Invalid request';
      apiError.retryable = false;
    } else if (status >= 500) {
      apiError.code = 'SERVER_ERROR';
      apiError.message = 'Server error. Please try again.';
      apiError.retryable = true;
    } else {
      apiError.code = 'UNKNOWN_ERROR';
      apiError.message = 'An unexpected error occurred';
      apiError.retryable = false;
    }

    apiError.status = status;
    apiError.response = error;

    return apiError;
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number, baseDelay: number): number {
    // Exponential backoff with jitter
    const exponential = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * exponential * 0.1;
    return Math.min(exponential + jitter, 30000); // Max 30 seconds
  }

  // ============================================================================
  // Core Request Method
  // ============================================================================

  async request<T>(url: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      cache = method === 'GET',
      cacheTTL = 60000,
      signal,
    } = config;

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      const error = this.classifyError(503);
      error.message = 'Service temporarily unavailable (circuit breaker open)';
      error.code = 'CIRCUIT_OPEN';
      throw error;
    }

    // Build full URL
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // Check cache for GET requests
    const cacheKey = `${method}:${fullURL}:${JSON.stringify(body)}`;
    if (cache && method === 'GET') {
      const cached = apiCache.get(cacheKey) as APIResponse<T> | undefined;
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // Deduplicate concurrent requests
    const pendingKey = cacheKey;
    const pending = this.pendingRequests.get(pendingKey);
    if (pending && method === 'GET') {
      return pending as Promise<APIResponse<T>>;
    }

    // Apply request interceptors
    let requestConfig: RequestConfig & { url: string } = { url: fullURL, method, headers, body };
    for (const interceptor of this.requestInterceptors) {
      requestConfig = interceptor(requestConfig);
    }

    // Merge headers
    const mergedHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...csrfProtection.getHeaders(),
      ...requestConfig.headers,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine with external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const startTime = performance.now();
    let lastError: APIError | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(fullURL, {
          method,
          headers: mergedHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          credentials: 'same-origin',
        });

        clearTimeout(timeoutId);

        const duration = performance.now() - startTime;

        if (!response.ok) {
          let errorBody: unknown;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = await response.text();
          }

          const error = this.classifyError(response.status, errorBody);

          // Don't retry non-retryable errors
          if (!error.retryable || attempt === retries) {
            this.circuitBreaker.recordFailure();
            throw error;
          }

          lastError = error;
          const backoff = this.calculateBackoff(attempt, retryDelay);
          apiLogger.warn(`Request failed, retrying in ${backoff}ms`, {
            url: fullURL,
            attempt,
            status: response.status,
          });
          await this.sleep(backoff);
          continue;
        }

        // Parse response
        let data: T;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        this.circuitBreaker.recordSuccess();

        // Build response object
        let apiResponse: APIResponse<T> = {
          data,
          status: response.status,
          headers: response.headers,
          cached: false,
          duration,
        };

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          apiResponse = interceptor(apiResponse);
        }

        // Cache successful GET responses
        if (cache && method === 'GET') {
          apiCache.set(cacheKey, apiResponse, cacheTTL);
        }

        // Log successful request
        apiLogger.debug('API request completed', {
          url: fullURL,
          method,
          status: response.status,
          duration,
        });

        return apiResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if ((error as Error).name === 'AbortError') {
          const timeoutError = this.classifyError(0);
          timeoutError.code = 'TIMEOUT';
          timeoutError.message = 'Request timed out';
          this.circuitBreaker.recordFailure();
          throw timeoutError;
        }

        // Network error
        if (!(error as APIError).status) {
          lastError = this.classifyError(0);

          if (attempt < retries) {
            const backoff = this.calculateBackoff(attempt, retryDelay);
            apiLogger.warn(`Network error, retrying in ${backoff}ms`, {
              url: fullURL,
              attempt,
            });
            await this.sleep(backoff);
            continue;
          }
        }

        throw error;
      } finally {
        this.pendingRequests.delete(pendingKey);
      }
    }

    // Should not reach here, but just in case
    throw lastError || this.classifyError(0);
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  async get<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  async put<T>(url: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  async patch<T>(url: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  async delete<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  // ============================================================================
  // Status Methods
  // ============================================================================

  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  getCacheStats() {
    return apiCache.getStats();
  }
}

// ============================================================================
// Default Client Instance
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_GPX_API_URL || '';

export const apiClient = new APIClient(API_BASE_URL);

// Add default request interceptor for logging
apiClient.addRequestInterceptor((config) => {
  logger.debug('API Request', {
    url: config.url,
    method: config.method,
  });
  return config;
});

// Add auth token interceptor (example)
apiClient.addRequestInterceptor((config) => {
  // Add Firebase auth token if available
  // const token = await auth.currentUser?.getIdToken();
  // config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  return config;
});

export { APIClient };
export type { RequestConfig, APIResponse, APIError };
