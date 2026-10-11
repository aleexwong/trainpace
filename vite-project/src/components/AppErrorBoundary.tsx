import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last-resort boundary so a render crash shows a message instead of a blank
 * page. Exceptions are reported by PostHog's `capture_exceptions` global
 * handlers, so nothing analytics-related is imported here.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-8 text-left">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2">
            Please{" "}
            <button
              type="button"
              className="underline"
              onClick={() => window.location.reload()}
            >
              reload the page
            </button>{" "}
            and try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
