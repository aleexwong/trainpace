/**
 * Production Security Utilities
 *
 * Input sanitization and XSS prevention utilities.
 * Protects against injection attacks and data corruption.
 *
 * Features:
 * - HTML entity encoding
 * - URL sanitization
 * - File name sanitization
 * - SQL/NoSQL injection prevention
 * - Content Security Policy helpers
 */

// ============================================================================
// HTML Sanitization
// ============================================================================

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input for safe display
 * Removes dangerous content while preserving text
 */
export function sanitizeText(input: string, options?: {
  maxLength?: number;
  allowNewlines?: boolean;
  trim?: boolean;
}): string {
  const { maxLength = 10000, allowNewlines = true, trim = true } = options || {};

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize Unicode
  sanitized = sanitized.normalize('NFC');

  // Remove control characters (except newlines if allowed)
  if (allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ' ');
  }

  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Truncate if exceeds max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize for safe JSON storage
 */
export function sanitizeForJson(input: string): string {
  return sanitizeText(input)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

// ============================================================================
// URL Sanitization
// ============================================================================

const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!SAFE_URL_PROTOCOLS.includes(parsed.protocol)) {
      return null;
    }

    // Prevent javascript: protocol obfuscation
    if (parsed.protocol.includes('javascript')) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate internal/relative URL
 */
export function sanitizeInternalUrl(path: string): string {
  // Remove protocol if present
  let sanitized = path.replace(/^[a-z]+:/i, '');

  // Ensure starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }

  // Remove double slashes
  sanitized = sanitized.replace(/\/+/g, '/');

  // Prevent directory traversal
  sanitized = sanitized.replace(/\.\./g, '');

  return sanitized;
}

// ============================================================================
// File Name Sanitization
// ============================================================================

const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
];

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(name: string, options?: {
  maxLength?: number;
  replacement?: string;
}): string {
  const { maxLength = 255, replacement = '_' } = options || {};

  let sanitized = name;

  // Remove unsafe characters
  sanitized = sanitized.replace(UNSAFE_FILENAME_CHARS, replacement);

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  // Check for reserved names (Windows)
  const nameWithoutExt = sanitized.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExt)) {
    sanitized = replacement + sanitized;
  }

  // Truncate if too long
  if (sanitized.length > maxLength) {
    const ext = sanitized.includes('.')
      ? sanitized.substring(sanitized.lastIndexOf('.'))
      : '';
    const base = sanitized.substring(0, maxLength - ext.length);
    sanitized = base + ext;
  }

  // Fallback for empty result
  if (!sanitized) {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

// ============================================================================
// Query/Injection Prevention
// ============================================================================

/**
 * Sanitize string for use in database queries
 * Prevents NoSQL injection in Firestore
 */
export function sanitizeQueryValue(value: string): string {
  // Remove characters that could affect Firestore queries
  return value
    .replace(/\$/g, '') // Remove $ (MongoDB operator prefix)
    .replace(/\./g, '') // Remove dots (field path separator)
    .replace(/\//g, '') // Remove slashes (path separator)
    .replace(/[\[\]{}]/g, '') // Remove brackets
    .trim();
}

/**
 * Validate that value is safe primitive type
 */
export function isSafePrimitive(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Deep sanitize object for database storage
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: { maxDepth?: number }
): T {
  const { maxDepth = 5 } = options || {};

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      return null;
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return sanitizeText(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Sanitize key names
        const sanitizedKey = sanitizeQueryValue(key);
        if (sanitizedKey) {
          result[sanitizedKey] = sanitizeValue(val, depth + 1);
        }
      }
      return result;
    }

    return null;
  }

  return sanitizeValue(obj, 0) as T;
}

// ============================================================================
// Content Security Policy
// ============================================================================

/**
 * Generate nonce for inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Create CSP meta tag content
 */
export function generateCSPContent(options: {
  nonce?: string;
  reportUri?: string;
}): string {
  const { nonce, reportUri } = options;

  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ''} https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.mapbox.com https://api.trainpace.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

// ============================================================================
// Secure Random
// ============================================================================

/**
 * Generate cryptographically secure random string
 */
export function secureRandomString(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((byte) => charset[byte % charset.length])
    .join('');
}

/**
 * Generate secure token for CSRF or session
 */
export function generateSecureToken(): string {
  return secureRandomString(48);
}
