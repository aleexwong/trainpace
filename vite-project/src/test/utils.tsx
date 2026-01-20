/**
 * Test Utilities
 *
 * Shared utilities for testing React components and hooks.
 * Provides wrappers, factories, and assertion helpers.
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// Custom Render
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

/**
 * Custom render with providers
 */
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { route = '/', ...renderOptions } = options || {};

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  const AllProviders = ({ children }: { children: ReactNode }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
}

export { customRender as render };

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create mock pace inputs
 */
export function createPaceInputs(overrides?: Partial<{
  distance: number;
  units: 'km' | 'mi';
  hours: number;
  minutes: number;
  seconds: number;
}>) {
  return {
    distance: 42.195,
    units: 'km' as const,
    hours: 3,
    minutes: 30,
    seconds: 0,
    ...overrides,
  };
}

/**
 * Create mock pace results
 */
export function createPaceResults(overrides?: Partial<{
  race: string;
  easy: string;
  tempo: string;
  interval: string;
  maximum: string;
  speed: string;
  xlong: string;
  yasso: string;
}>) {
  return {
    race: '4:58/km',
    easy: '5:58/km',
    tempo: '4:40/km',
    interval: '4:20/km',
    maximum: '4:00/km',
    speed: '3:45/km',
    xlong: '6:30/km',
    yasso: '3:30',
    ...overrides,
  };
}

/**
 * Create mock fuel plan inputs
 */
export function createFuelPlanInputs(overrides?: Partial<{
  raceType: '10K' | 'Half' | 'Full' | 'Ultra';
  weight: number;
  timeHours: number;
  timeMinutes: number;
  carbsPerHour: number;
}>) {
  return {
    raceType: 'Full' as const,
    weight: 70,
    timeHours: 3,
    timeMinutes: 30,
    carbsPerHour: 60,
    ...overrides,
  };
}

/**
 * Create mock fuel plan result
 */
export function createFuelPlanResult(overrides?: Partial<{
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
}>) {
  return {
    carbsPerHour: 60,
    totalCarbs: 210,
    totalCalories: 840,
    gelsNeeded: 7,
    fuelStops: [
      { time: '0:30', distance: '10km', carbs: 30, item: 'Energy Gel' },
      { time: '1:00', distance: '20km', carbs: 30, item: 'Energy Gel' },
    ],
    ...overrides,
  };
}

/**
 * Create mock user
 */
export function createMockUser(overrides?: Partial<{
  uid: string;
  email: string;
  displayName: string;
}>) {
  return {
    uid: 'test-user-id-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    photoURL: null,
    ...overrides,
  };
}

/**
 * Create mock elevation segment
 */
export function createElevationSegment(overrides?: Partial<{
  startDistance: number;
  endDistance: number;
  length: number;
  startElevation: number;
  endElevation: number;
  grade: number;
  type: string;
  challengeRating: number;
  estimatedTimeMultiplier: number;
}>) {
  return {
    startDistance: 0,
    endDistance: 1000,
    length: 1000,
    startElevation: 100,
    endElevation: 120,
    grade: 2,
    type: 'gradual_uphill',
    challengeRating: 3,
    estimatedTimeMultiplier: 1.1,
    ...overrides,
  };
}

// ============================================================================
// Mock Response Helpers
// ============================================================================

/**
 * Create mock fetch response
 */
export function createMockResponse(
  data: unknown,
  options?: {
    status?: number;
    headers?: Record<string, string>;
    ok?: boolean;
  }
): Response {
  const { status = 200, headers = {}, ok = true } = options || {};

  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    clone: () => createMockResponse(data, options),
  } as Response;
}

/**
 * Create mock API error response
 */
export function createMockErrorResponse(
  status: number,
  message: string = 'Error'
): Response {
  return createMockResponse(
    { error: message },
    { status, ok: false }
  );
}

// ============================================================================
// Async Helpers
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for element to appear
 */
export async function waitForElement(
  selector: string,
  container: Element = document.body,
  timeout: number = 5000
): Promise<Element> {
  return waitForCondition(
    () => container.querySelector(selector) !== null,
    timeout
  ).then(() => container.querySelector(selector)!);
}

// ============================================================================
// Event Helpers
// ============================================================================

/**
 * Fire resize event
 */
export function fireResize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Fire visibility change event
 */
export function fireVisibilityChange(hidden: boolean): void {
  Object.defineProperty(document, 'visibilityState', {
    value: hidden ? 'hidden' : 'visible',
    writable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}
