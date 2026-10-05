import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./fonts.css";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";
import { installLinkPrefetch, preloadRoute } from "./routes";

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <PostHogProvider
            apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY || ""}
            options={{
              api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
              capture_exceptions: true,
            }}
          >
            <PostHogErrorBoundary>
              <App />
            </PostHogErrorBoundary>
          </PostHogProvider>
        </BrowserRouter>
      </AuthProvider>
    </StrictMode>
  );
}

// Load the current page's chunk before the first render. Until then the
// prerendered HTML stays on screen; rendering earlier would replace it with
// the layout plus a Suspense spinner, then swap again when the chunk arrives.
// A failed load still renders, so React's lazy path can retry and report it.
preloadRoute(window.location.pathname)
  .catch(() => {})
  .then(render);

installLinkPrefetch();
