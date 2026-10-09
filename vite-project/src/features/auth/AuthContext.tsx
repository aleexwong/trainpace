import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import posthog from "posthog-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks the previously-identified uid so we only reset() on a real logout
  // transition, not on every anonymous page load (which would fragment
  // anonymous distinct_ids).
  const prevUidRef = useRef<string | null>(null);

  // Firebase is imported dynamically, not at module scope. AuthProvider wraps
  // the whole app, so a static import pulled the Auth + Firestore SDK (~114KB
  // gzip) onto the critical path of every page — including the 80+ prerendered
  // SEO pages, where nobody is ever signed in. Loading it here keeps it off
  // first paint and out of those pages entirely.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ onAuthStateChanged }, { auth }] = await Promise.all([
        import("firebase/auth"),
        import("@/lib/firebase"),
      ]);
      // The component may have unmounted while the SDK was in flight.
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // Stitch the anonymous journey to this user and unlock
          // signup-conversion + cross-session tracking in PostHog.
          posthog.identify(user.uid, {
            email: user.email ?? undefined,
            name: user.displayName ?? undefined,
          });
          prevUidRef.current = user.uid;
        } else if (prevUidRef.current) {
          // Logout: clear identity so the next visitor isn't merged into this one.
          posthog.reset();
          prevUidRef.current = null;
        }
        setUser(user);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
