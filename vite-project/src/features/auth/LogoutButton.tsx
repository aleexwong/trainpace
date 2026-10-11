import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-app";

export function LogoutButton() {
  return <button onClick={() => signOut(auth)}>Logout</button>;
}
