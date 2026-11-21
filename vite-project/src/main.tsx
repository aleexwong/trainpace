import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import AppErrorFallback from "./components/layout/AppErrorFallback";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";

// After a deploy, an open tab still asks for the old hashed chunks, which no
// longer exist. Retry each entry bundle once per tab, even on slow networks.
const RELOAD_KEY = "trainpace:chunk-reload-entry";
window.addEventListener("vite:preloadError", (event) => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === import.meta.url) return;
    sessionStorage.setItem(RELOAD_KEY, import.meta.url);
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

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
          <PostHogErrorBoundary fallback={<AppErrorFallback />}>
            <App />
          </PostHogErrorBoundary>
        </PostHogProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
