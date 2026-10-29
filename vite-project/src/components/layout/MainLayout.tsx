import { Outlet, useNavigate } from "react-router-dom";
import { Suspense, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import SiteNav from "./SiteNav";
import Footer from "./Footer";

export default function MainLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col dark:bg-slate-950 dark:text-slate-100">
      <SiteNav user={user} authLoading={loading} onLogout={handleLogout} />

      {/* pt-16 matches SiteNav's fixed h-16 bar. */}
      <main className="pt-16 flex-grow">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400"
                role="status"
                aria-label="Loading"
              />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
