import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { LoginButton } from "@/features/auth/LoginButton";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Security-conscious error messages that don't reveal account existence
const getLoginErrorMessage = (code: string): string => {
  switch (code) {
    // Group these together to prevent account enumeration
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/invalid-email":
      return "Invalid email or password. Please try again.";
    
    case "auth/user-disabled":
      return "This account has been disabled. Contact support for help.";
    
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later or reset your password.";
    
    default:
      return "Unable to sign in. Please try again.";
  }
};

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
      navigate("/dashboard");
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
      console.error("Login error:", err.code || err);
      
      const errorMessage = err.code 
        ? getLoginErrorMessage(err.code)
        : "Unable to sign in. Please try again.";
      
      setError(errorMessage);
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
        {/* Google Login - moved to top */}
        <LoginButton />

        <div className="flex items-center w-full my-2">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

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
          {error && <p className="text-red-500 text-sm text-left">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
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

        <Link to="/register" className="text-blue-500 hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}
