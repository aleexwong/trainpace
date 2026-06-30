import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import posthog from "posthog-js";
import { auth } from "@/lib/firebase";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.uid !== prevUidRef.current) {
          try {
            posthog.identify(user.uid, {
              email: user.email ?? undefined,
              name: user.displayName ?? undefined,
            });
          } catch (_err) {
            // PostHog may be blocked by ad-blockers; don't prevent auth state from updating
          }
        }
        prevUidRef.current = user.uid;
      } else if (prevUidRef.current) {
        try { posthog.reset(); } catch (_err) {}
        prevUidRef.current = null;
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
