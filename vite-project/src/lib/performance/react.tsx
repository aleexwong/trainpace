/**
 * React Performance Utilities
 *
 * HOCs and hooks for optimizing React component performance.
 *
 * Features:
 * - Optimized memoization HOC
 * - Debounced state updates
 * - Lazy loading utilities
 * - Render count tracking (dev)
 * - Stable callback refs
 */

import React, {
  ComponentType,
  lazy,
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';

// ============================================================================
// Memoization HOC
// ============================================================================

/**
 * Enhanced React.memo with deep comparison option
 */
export function withMemo<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  options?: {
    displayName?: string;
    propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean;
    debug?: boolean;
  }
): React.MemoExoticComponent<ComponentType<P>> {
  const { displayName, propsAreEqual, debug } = options || {};

  const compareProps = propsAreEqual || ((prev: Readonly<P>, next: Readonly<P>) => {
    // Default shallow comparison with array/object check
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every((key) => {
      const prevVal = prev[key];
      const nextVal = next[key];

      // Reference equality
      if (prevVal === nextVal) return true;

      // Shallow array comparison
      if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
        return prevVal.length === nextVal.length &&
          prevVal.every((v, i) => v === nextVal[i]);
      }

      return false;
    });
  });

  const MemoizedComponent = memo(Component, (prev, next) => {
    const areEqual = compareProps(prev, next);

    if (debug && import.meta.env.DEV) {
      console.log(`[Memo] ${displayName || Component.displayName}:`, {
        areEqual,
        prev,
        next,
      });
    }

    return areEqual;
  });

  MemoizedComponent.displayName = displayName || Component.displayName || Component.name;

  return MemoizedComponent;
}

// ============================================================================
// Lazy Loading
// ============================================================================

interface LazyComponentOptions {
  fallback?: ReactNode;
  preload?: boolean;
}

/**
 * Create lazy-loaded component with fallback
 */
export function createLazyComponent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options?: LazyComponentOptions
): React.FC<{ fallback?: ReactNode } & Record<string, unknown>> {
  const LazyComponent = lazy(importFn);

  // Preload if requested
  if (options?.preload) {
    importFn();
  }

  const WrappedComponent: React.FC<{ fallback?: ReactNode } & Record<string, unknown>> = (props) => {
    const { fallback: propFallback, ...componentProps } = props;
    const fallbackUI = propFallback || options?.fallback || null;

    return (
      <Suspense fallback={fallbackUI}>
        <LazyComponent {...componentProps} />
      </Suspense>
    );
  };

  return WrappedComponent;
}

/**
 * Preload a lazy component (for route prefetching)
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void {
  importFn().catch(() => {
    // Silently ignore preload failures
  });
}

// ============================================================================
// Debounce Hooks
// ============================================================================

/**
 * Debounced value hook
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: unknown[]) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const callbackRef = useRef(callback);
  const lastRunRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      const elapsed = now - lastRunRef.current;

      if (elapsed >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - elapsed);
      }
    }) as T,
    [delay]
  );
}

// ============================================================================
// Stable Refs
// ============================================================================

/**
 * Stable callback ref (never changes identity)
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: unknown[]) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// Render Tracking (Development Only)
// ============================================================================

/**
 * Track component renders in development
 */
export function useRenderCount(componentName: string): void {
  const countRef = useRef(0);
  countRef.current++;

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[Render] ${componentName}: ${countRef.current}`);
    }
  });
}

/**
 * Log when props change in development
 */
export function useWhyDidUpdate<P extends object>(
  componentName: string,
  props: P
): void {
  const previousProps = useRef<P>();

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    if (previousProps.current) {
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      Object.keys({ ...previousProps.current, ...props }).forEach((key) => {
        const prevVal = (previousProps.current as Record<string, unknown>)?.[key];
        const nextVal = (props as Record<string, unknown>)[key];

        if (prevVal !== nextVal) {
          changedProps[key] = { from: prevVal, to: nextVal };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidUpdate] ${componentName}:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// ============================================================================
// Intersection Observer Hook
// ============================================================================

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useInView(options?: UseInViewOptions): {
  ref: React.RefObject<HTMLElement | null>;
  inView: boolean;
} {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options || {};

  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);

        if (isIntersecting && triggerOnce && observerRef.current) {
          observerRef.current.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, inView };
}

// ============================================================================
// Deferred Value Polyfill (for older React versions)
// ============================================================================

/**
 * Deferred value hook (similar to React 18's useDeferredValue)
 */
export function useDeferredValue<T>(value: T, delay: number = 100): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useMemo(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
    }, delay);
  }, [value, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return deferredValue;
}
