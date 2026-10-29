import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { ThemeProvider } from "./features/theme";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider>
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
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
