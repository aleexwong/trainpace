import { ReactNode } from "react";
import { useAuth } from "./AuthContext"; // adjust to your auth hook

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user } = useAuth(); // your hook returning user object

  if (!user) {
    return fallback || null;
  }

  return <>{children}</>;
}
