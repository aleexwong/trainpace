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
        // Stitch the anonymous journey to this user and unlock signup-conversion
        // + cross-session tracking in PostHog.
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
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
