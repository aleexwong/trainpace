/**
 * Vitest Test Setup
 *
 * Global setup file for test environment configuration.
 * Runs before all tests to set up mocks and environment.
 */

import { afterEach, beforeAll, vi } from 'vitest';

// ============================================================================
// Environment Mocks
// ============================================================================

// Mock import.meta.env
vi.stubGlobal('import.meta.env', {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abc123',
  VITE_MAPBOX_TOKEN: 'test-mapbox-token',
  VITE_GPX_API_URL: 'https://api.test.com',
  DEV: true,
  PROD: false,
  MODE: 'test',
});

// ============================================================================
// Browser API Mocks
// ============================================================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Mock IntersectionObserver
class MockIntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  // Helper to trigger intersection
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this);
  }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
  },
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  value: vi.fn(() => true),
  writable: true,
});

// ============================================================================
// Performance API Mocks
// ============================================================================

const performanceMarks = new Map<string, PerformanceMark>();
const performanceMeasures: PerformanceMeasure[] = [];

Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn((name: string) => {
      const mark = { name, startTime: Date.now() } as PerformanceMark;
      performanceMarks.set(name, mark);
      return mark;
    }),
    measure: vi.fn((name: string, startMark: string) => {
      const start = performanceMarks.get(startMark);
      const measure = {
        name,
        startTime: start?.startTime || 0,
        duration: Math.random() * 100,
      } as PerformanceMeasure;
      performanceMeasures.push(measure);
      return measure;
    }),
    getEntriesByName: vi.fn((name: string) =>
      performanceMeasures.filter((m) => m.name === name)
    ),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn((name?: string) => {
      if (name) {
        performanceMarks.delete(name);
      } else {
        performanceMarks.clear();
      }
    }),
    clearMeasures: vi.fn(),
  },
  writable: true,
});

// ============================================================================
// Cleanup
// ============================================================================

beforeAll(() => {
  // Clear console during tests (optional)
  // vi.spyOn(console, 'log').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
  // vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Clear storage between tests
  sessionStorageMock.clear();
  localStorageMock.clear();

  // Clear performance data
  performanceMarks.clear();
  performanceMeasures.length = 0;

  // Reset all mocks
  vi.clearAllMocks();
});

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flush all pending promises
 */
export const flushPromises = () => new Promise(setImmediate);
