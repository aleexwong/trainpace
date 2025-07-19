import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { LoginButton } from "@/features/auth/LoginButton";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (user) {
      navigate("/dashboard"); // or wherever you want them to go
    }
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Signed in",
        description: `Welcome back, ${
          result.user.displayName || result.user.email || "runner"
        }!`,
      });
      // Don't manually navigate here - let the useEffect handle it
    } catch (err: any) {
      const code = err.code;
      if (code === "auth/user-not-found") {
        setError("No account found with that email.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError("Something went wrong.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is being determined
  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center w-full px-4">
      <h1 className="text-2xl font-bold mb-4">Welcome back</h1>
      <p className="text-gray-600 mb-6">
        Sign in with Google or email to get started.
      </p>

      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <form onSubmit={handleEmailLogin} className="w-full space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        <Link
          to="/reset-password"
          className="text-sm text-blue-500 hover:underline"
        >
          Forgot password?
        </Link>

        <div className="text-sm text-gray-500">or</div>

        <Link to="/register" className="text-blue-500 hover:underline">
          Register here
        </Link>

        <LoginButton />
      </div>
    </div>
  );
}
