import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Flame, Timer } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
// import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Link } from "react-router-dom";
import type { User } from "firebase/auth";
import trainPaceHeroImage from "@/assets/trainPaceHeroImage.png";
import trainPaceHeroMobile from "@/assets/trainPaceHeroMobile.png";

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // useEffect(() => {
  //   const auth = getAuth();
  //   const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  //     setUser(firebaseUser);
  //   });
  //   return () => unsubscribe();
  // }, []);

  // const handleSignOut = () => {
  //   const auth = getAuth();
  //   signOut(auth);
  //   setMenuOpen(false);
  // };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // const handleSignOut = () => {
  //   signOut(auth);
  //   setMenuOpen(false);
  // };
  return (
    <div className="bg-white text-gray-900 min-h-screen relative">
      {/* Hero */}
      <section className="px-0 pt-0 pb-24 text-center">
        {/* Mobile image */}
        <img
          src={trainPaceHeroMobile}
          alt="TrainPace Mobile Hero"
          className="w-full h-[500px] object-cover object-top md:hidden"
        />

        {/* Desktop image */}
        <img
          src={trainPaceHeroImage}
          alt="TrainPace Desktop Hero"
          className="hidden md:block w-full h-[600px] object-cover object-left-top"
        />

        <div className="px-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 p-4">
            Smarter Fueling & Pacing for Runners
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            TrainPace helps you plan your races, dial in nutrition, and track
            training without burnout. Built for hybrid athletes.
          </p>
          <Link to={user ? "/dashboard" : "/calculator"}>
            <Button size="lg" className="text-lg px-6 py-3">
              {user ? "View Dashboard" : "Try the Calculator"}
            </Button>
          </Link>
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
        <Link to={user ? "/dashboard" : "/calculator"}>
          <Button size="lg" className="text-lg px-6 py-3">
            {user ? "View Dashboard" : "Get Started Free"}
          </Button>
        </Link>
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
