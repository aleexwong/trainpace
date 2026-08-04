import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if ((!posthogKey || !posthogHost) && import.meta.env.DEV) {
  throw new Error(
    `${!posthogKey ? "VITE_PUBLIC_POSTHOG_KEY" : "VITE_PUBLIC_POSTHOG_HOST"} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${!posthogKey ? "VITE_PUBLIC_POSTHOG_KEY" : "VITE_PUBLIC_POSTHOG_HOST"} is configured`
  );
}

const app = (
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);

createRoot(document.getElementById("root")!).render(
  posthogKey && posthogHost ? (
    <PostHogProvider
      apiKey={posthogKey}
      options={{
        api_host: posthogHost,
        capture_exceptions: true,
      }}
    >
      <PostHogErrorBoundary>{app}</PostHogErrorBoundary>
    </PostHogProvider>
  ) : (
    app
  )
);
