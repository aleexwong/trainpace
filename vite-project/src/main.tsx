import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import { PostHogProvider } from "posthog-js/react";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <PostHogProvider
            apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
            options={{
              api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            }}
          >
            <App />
          </PostHogProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
