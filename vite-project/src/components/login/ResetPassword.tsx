import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Helper to get friendly error messages
const getResetErrorMessage = (code: string): string => {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many requests. Please wait a moment and try again.";
    default:
      return "Failed to send reset email. Please try again.";
  }
};

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      const errorMessage = err.code 
        ? getResetErrorMessage(err.code)
        : "Something went wrong. Please try again.";
      
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>

      {sent ? (
        <div className="space-y-3">
          <p className="text-green-600">
            ✅ Password reset email sent!
          </p>
          <p className="text-sm text-gray-600">
            Check your inbox and spam folder for the reset link.
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6">
            Enter your email to receive reset instructions.
          </p>

          <form onSubmit={handleReset} className="w-full max-w-xs space-y-3">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && (
              <p className="text-red-500 text-sm text-left">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Send Reset Email
            </button>
          </form>
        </>
      )}
    </div>
  );
}
