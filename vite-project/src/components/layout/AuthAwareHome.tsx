/**
 * AuthAwareHome
 * Redirects authenticated users to dashboard, shows landing page for guests
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import Landing from "./Landing";

export function AuthAwareHome() {
  const { user, loading } = useAuth();

  // While checking auth status, show nothing (or could show a spinner)
  // This prevents flash of landing page before redirect
  if (loading) {
    return null;
  }

  // Authenticated users go straight to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Guests see the landing page
  return <Landing />;
}
