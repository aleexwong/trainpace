// src/components/LoginButton.tsx
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function LoginButton() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    console.log("User signed in");
  };

  return (
    <button
      onClick={handleLogin}
      className="p-2 bg-blue-500 text-white rounded"
    >
      Sign in with Google
    </button>
  );
}
