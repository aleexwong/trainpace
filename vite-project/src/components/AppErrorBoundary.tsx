import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@/lib/analytics";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last-resort boundary so a render crash shows a message instead of a blank
 * page. React swallows render errors before PostHog's global handlers see
 * them, so they are reported here through the deferred analytics queue.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    captureException(error, { componentStack: info.componentStack });
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
