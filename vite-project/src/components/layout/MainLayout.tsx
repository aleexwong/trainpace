import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";

export default function MainLayout() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="bg-white text-gray-900 min-h-screen relative">
        <header className="flex justify-between items-center px-4 py-4 border-b border-gray-200 relative z-30">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 z-30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Go to homepage"
          >
            TrainPace
          </Link>{" "}
          <nav className="hidden md:flex space-x-4">
            {location.pathname === "/" && (
              <a href="#features" className="text-gray-700 hover:text-blue-600">
                Features
              </a>
            )}
            <Link
              to="/calculator"
              className="text-gray-700 hover:text-blue-600"
            >
              Calculator
            </Link>
            <Link to="/fuel" className="text-gray-700 hover:text-blue-600">
              Fuel Planner
            </Link>
            {user ? (
              <>
                <Link
                  to="/elevation-finder"
                  className="text-gray-700 hover:text-blue-600"
                >
                  ElevationFinder
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-blue-600">
                Login
              </Link>
            )}
          </nav>
        </header>
        <Outlet />
      </div>
    </>
  );
}
