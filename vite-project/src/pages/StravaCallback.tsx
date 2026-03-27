import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { exchangeCodeForTokens } from "@/features/strava/services/strava";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "exchanging" | "success" | "error";

export default function StravaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("exchanging");
  const [errorMsg, setErrorMsg] = useState("");
  const attempted = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invoke
    if (attempted.current) return;
    attempted.current = true;

    const code = searchParams.get("code");
    const stravaError = searchParams.get("error");

    if (stravaError || !code) {
      setErrorMsg(stravaError === "access_denied" ? "You denied access to Strava." : "No authorization code received.");
      setStatus("error");
      return;
    }

    if (!user) {
      setErrorMsg("You must be logged in to connect Strava.");
      setStatus("error");
      return;
    }

    exchangeCodeForTokens(code)
      .then(async ({ access_token, refresh_token, expires_at, athlete }) => {
        await setDoc(doc(db, "users", user.uid, "integrations", "strava"), {
          access_token,
          refresh_token,
          expires_at,
          athlete_id: athlete.id,
          athlete_name: `${athlete.firstname} ${athlete.lastname}`,
          athlete_avatar: athlete.profile_medium ?? null,
          connected_at: serverTimestamp(),
        });
        setStatus("success");
        setTimeout(() => navigate("/dashboard?tab=strava"), 1500);
      })
      .catch((err: unknown) => {
        console.error("Strava callback error:", err);
        setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
        setStatus("error");
      });
  }, [searchParams, user, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      {status === "exchanging" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Connecting your Strava account…</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="text-4xl">🎉</div>
          <h1 className="text-xl font-semibold">Strava connected!</h1>
          <p className="text-muted-foreground text-sm">Redirecting to your dashboard…</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold">Connection failed</h1>
          <p className="text-muted-foreground text-sm max-w-sm">{errorMsg}</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </>
      )}
    </div>
  );
}
