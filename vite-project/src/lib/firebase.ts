import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// App + Auth only. Auth is needed on every page (nav, AuthContext), so it ships
// in the entry chunk. Firestore and Storage are much larger and live in their own
// modules (./firestore, ./storage) so only the pages that read data pay for them —
// don't re-export them from here, or they get pulled back into the entry chunk.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export { app };
