/**
 * CSRF Protection Utilities
 *
 * Client-side CSRF token management for API requests.
 * Works in conjunction with Firebase Auth tokens for security.
 *
 * Features:
 * - Token generation and storage
 * - Automatic header injection
 * - Token rotation on sensitive actions
 * - Double-submit cookie pattern support
 */

import { generateSecureToken } from './sanitize';

const CSRF_STORAGE_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const TOKEN_EXPIRY_MS = 3600000; // 1 hour

interface CSRFTokenData {
  token: string;
  createdAt: number;
}

class CSRFProtection {
  private tokenData: CSRFTokenData | null = null;

  constructor() {
    this.loadToken();
  }

  /**
   * Load token from storage
   */
  private loadToken(): void {
    try {
      const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as CSRFTokenData;
        // Check if token is still valid
        if (Date.now() - data.createdAt < TOKEN_EXPIRY_MS) {
          this.tokenData = data;
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Generate new token
    this.rotateToken();
  }

  /**
   * Save token to storage
   */
  private saveToken(): void {
    if (!this.tokenData) return;

    try {
      sessionStorage.setItem(CSRF_STORAGE_KEY, JSON.stringify(this.tokenData));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Generate new CSRF token
   */
  rotateToken(): string {
    this.tokenData = {
      token: generateSecureToken(),
      createdAt: Date.now(),
    };
    this.saveToken();
    return this.tokenData.token;
  }

  /**
   * Get current CSRF token
   */
  getToken(): string {
    if (!this.tokenData || Date.now() - this.tokenData.createdAt >= TOKEN_EXPIRY_MS) {
      this.rotateToken();
    }
    return this.tokenData!.token;
  }

  /**
   * Add CSRF token to fetch headers
   */
  getHeaders(): Record<string, string> {
    return {
      [CSRF_HEADER_NAME]: this.getToken(),
    };
  }

  /**
   * Create fetch wrapper with CSRF protection
   */
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set(CSRF_HEADER_NAME, this.getToken());

    return fetch(input, {
      ...init,
      headers,
      credentials: 'same-origin', // Include cookies for double-submit
    });
  }

  /**
   * Validate token from response (for server echo)
   */
  validateToken(responseToken: string): boolean {
    return this.tokenData?.token === responseToken;
  }

  /**
   * Clear token (on logout)
   */
  clear(): void {
    this.tokenData = null;
    try {
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

// Singleton instance
export const csrfProtection = new CSRFProtection();

/**
 * React hook for CSRF token
 */
export function useCSRFToken(): {
  token: string;
  headers: Record<string, string>;
  rotate: () => void;
} {
  return {
    get token() {
      return csrfProtection.getToken();
    },
    get headers() {
      return csrfProtection.getHeaders();
    },
    rotate: () => csrfProtection.rotateToken(),
  };
}
