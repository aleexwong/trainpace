import { useState } from "react";
import { useAuth } from "./features/auth/AuthContext";
import { LoginButton } from "./features/auth/LoginButton";
import { LogoutButton } from "./features/auth/LogoutButton";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setError("");

      if (!result.user.emailVerified) {
        setUnverified(true);
        toast({
          title: "Email not verified",
          description: "Check your inbox or resend the verification email.",
          variant: "destructive",
        });
      } else {
        setUnverified(false);
      }
    } catch (err: any) {
      setError("Invalid email or password.");
      console.error(err);
    }
  };

  const handleResendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification email sent",
        description: "Check your inbox for the confirmation link.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center w-full px-4">
      <h1 className="text-2xl font-bold mb-4">
        {user ? "You're signed in" : "Welcome back"}
      </h1>

      <p className="text-gray-600 mb-6">
        {user
          ? `Logged in as ${user.displayName || user.email}`
          : "Sign in with Google or email to get started."}
      </p>

      {user ? (
        <>
          {/* <LogoutButton />
          {unverified && (
            <div className="mt-4 text-sm text-red-600">
              Your email is not verified.
              <button
                onClick={handleResendVerification}
                className="ml-2 underline text-blue-500"
              >
                Resend email
              </button>
            </div>
          )} */}
        </>
      ) : (
        <div className="w-full max-w-xs flex flex-col items-center gap-4">
          <form onSubmit={handleEmailLogin} className="w-full space-y-3">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Sign in with Email
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
      )}
    </div>
  );
}
