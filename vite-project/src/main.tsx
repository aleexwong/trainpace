import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { preloadRoute } from "./routes";
import AppErrorFallback from "./components/layout/AppErrorFallback";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";

// After a deploy, an open tab still asks for the old hashed chunks, which no
// longer exist. Reload once to pick up the new build; the timestamp stops a
// reload loop if the chunk is missing for some other reason.
const RELOAD_KEY = "trainpace:chunk-reload-at";
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

const root = document.getElementById("root")!;

function render() {
  createRoot(root).render(
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
}

// Prerendered pages arrive with real content in #root. Rendering before the
// page's chunk is loaded would swap that content for a loading spinner, so
// keep it on screen until the chunk is ready. The app shell has an empty
// #root and has nothing to keep, so it renders straight away.
if (root.hasChildNodes()) {
  preloadRoute(window.location.pathname).then(render, render);
} else {
  render();
}
