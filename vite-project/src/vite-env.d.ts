/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  posthog?: {
    capture: (eventName: string, properties?: Record<string, unknown>) => void;
  };
}
