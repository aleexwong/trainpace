import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorReporter } from '../observability/errorReporter';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Production-grade React Error Boundary
 *
 * Features:
 * - Catches render errors in component tree
 * - Reports errors to external monitoring service
 * - Generates unique error IDs for support tickets
 * - Provides graceful fallback UI
 * - Supports error recovery via resetKeys
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    const { errorId } = this.state;

    // Report to error tracking service
    errorReporter.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorId: errorId || undefined,
      context: 'ErrorBoundary',
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We've been notified of this issue and are working to fix it.
              </p>
            </div>

            {errorId && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Error Reference
                </p>
                <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {errorId}
                </code>
              </div>
            )}

            {import.meta.env.DEV && error && (
              <details className="text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-200">
                  Developer Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto text-red-700 dark:text-red-300 whitespace-pre-wrap">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
