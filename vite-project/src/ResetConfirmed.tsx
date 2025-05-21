// src/pages/ResetConfirmed.tsx
import { Link } from "react-router-dom";

export default function ResetConfirmed() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Password Reset</h1>
      <p className="text-green-600 mb-6">
        ✅ Your password has been reset successfully.
      </p>
      <Link to="/login" className="text-blue-500 hover:underline">
        Back to Login
      </Link>
    </div>
  );
}
