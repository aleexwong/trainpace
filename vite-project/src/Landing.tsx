import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Flame, Timer, Menu, X } from "lucide-react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth);
    setMenuOpen(false);
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen relative">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200 relative z-30">
        <h1 className="text-xl font-bold z-30">TrainPace</h1>
        <div className="md:hidden z-30">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        <nav className="hidden md:flex space-x-4">
          <a href="#features" className="text-gray-700 hover:text-blue-600">
            Features
          </a>
          <a href="/calculator" className="text-gray-700 hover:text-blue-600">
            Calculator
          </a>
          {user ? (
            <>
              <a
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600"
              >
                Dashboard
              </a>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-blue-600"
              >
                Sign Out
              </button>
            </>
          ) : (
            <a href="/login" className="text-gray-700 hover:text-blue-600">
              Login
            </a>
          )}
        </nav>
      </header>

      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <div
        className={`fixed top-4 right-4 w-fit max-w-xs bg-white border border-gray-200 shadow-xl rounded-xl transform transition-transform duration-300 ease-in-out z-20 md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 space-y-4">
          <a
            href="#features"
            className="block text-gray-700 hover:text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="/calculator"
            className="block text-gray-700 hover:text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Calculator
          </a>
          {user ? (
            <>
              <a
                href="/dashboard"
                className="block text-gray-700 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </a>
              <button
                onClick={handleSignOut}
                className="block text-left text-gray-700 hover:text-blue-600 w-full"
              >
                Sign Out
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="block text-gray-700 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </a>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="px-0 pt-0 pb-24 text-center">
        <img
          src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=80"
          alt="Runner"
          className="w-full h-[400px] md:h-[500px] object-cover mb-12"
        />
        <div className="px-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Smarter Fueling & Pacing for Runners
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            TrainPace helps you plan your races, dial in nutrition, and track
            training without burnout. Built for hybrid athletes.
          </p>
          <Button size="lg" className="text-lg px-6 py-3">
            {user ? "View Dashboard" : "Try the Calculator"}
          </Button>
        </div>
      </section>

      {/* Feature Highlights */}
      <section
        id="features"
        className="py-20 px-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center"
      >
        <Feature
          icon={<Timer className="w-8 h-8 mx-auto mb-2 text-blue-600" />}
          title="Race Predictor"
          desc="Estimate your race day times with smarter pace projection using real run data."
        />
        <Feature
          icon={<Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />}
          title="Fuel Planner"
          desc="Plan fueling based on distance, body weight, and intensity. Never crash again."
        />
        <Feature
          icon={<CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />}
          title="Training History"
          desc="Track your past runs and get better over time with smart insights."
        />
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 text-center bg-blue-50">
        <h2 className="text-3xl font-bold mb-4">Start Training Smarter</h2>
        <p className="text-gray-700 mb-6">
          Join runners who are training injury-free and fueling with purpose.
        </p>
        <Button size="lg" className="text-lg px-6 py-3">
          {user ? "View Dashboard" : "Get Started Free"}
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-sm text-gray-500">
        Built by a runner, for runners. © {new Date().getFullYear()} TrainPace
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-4">
      {icon}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}
