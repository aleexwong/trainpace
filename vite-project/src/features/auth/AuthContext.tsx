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
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (prevUidRef.current && prevUidRef.current !== user.uid) {
          posthog.reset();
        }

        posthog.identify(user.uid, {
          email: user.email ?? undefined,
          name: user.displayName ?? undefined,
        });
        prevUidRef.current = user.uid;
      } else if (prevUidRef.current) {
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
