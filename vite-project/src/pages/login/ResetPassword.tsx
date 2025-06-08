import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>

      {sent ? (
        <p className="text-green-600">
          ✅ If your email exists, a reset link has been sent.
          <br />
          Check your inbox and spam folder.
        </p>
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Send Reset Email
            </button>
          </form>
        </>
      )}
    </div>
  );
}
