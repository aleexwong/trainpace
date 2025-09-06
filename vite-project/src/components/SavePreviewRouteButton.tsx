// SavePreviewRouteButton.tsx (updated for route keys)
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";
import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "../hooks/use-toast";

type Size = "sm" | "md" | "lg";

interface SavePreviewRouteButtonProps {
  routeKey: string;
  routeName: string;
  className?: string;
  size?: Size;
  routeSlug: string;
  routeData?: {
    city?: string;
    country?: string;
    distance?: number;
    elevationGain?: number;
    elevationLoss?: number;
    raceDate?: string;
    website?: string;
    thumbnailPoints?: Array<{
      lat: number;
      lng: number;
      ele: number;
      dist?: number;
    }>;
    description?: string;
    tips?: string[];
  };
}

export function SavePreviewRouteButton({
  routeName,
  className = "",
  size = "md",
  routeSlug,
  routeData,
}: SavePreviewRouteButtonProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Use routeKey, but fall back to routeSlug for backwards compatibility
  const keyToUse = routeSlug;
  const docId = user ? `${user.uid}__preview__${keyToUse}` : null; // deterministic

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !keyToUse) {
        setChecking(false);
        return;
      }
      try {
        const ref = doc(db, "user_bookmarks", docId!);
        const snap = await getDoc(ref);
        if (!cancelled) setIsSaved(snap.exists());
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, keyToUse, docId]);

  const toggle = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save routes to your dashboard.",
        variant: "destructive",
      });
      return;
    }

    if (!keyToUse) {
      toast({
        title: "Error",
        description: "Invalid route identifier.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const ref = doc(db, "user_bookmarks", docId!);
      if (isSaved) {
        await deleteDoc(ref);
        setIsSaved(false);
        toast({
          title: "Route Removed",
          description: `${routeName} removed from your dashboard.`,
        });
      } else {
        await setDoc(ref, {
          userId: user.uid,
          type: "preview_route",
          routeKey: keyToUse, // Store the route key (new format)
          routeSlug: keyToUse, // Also store as routeSlug for backwards compatibility
          routeName: routeName,
          savedAt: serverTimestamp(),
          // Add version tracking for future migrations
          schemaVersion: 2, // Increment this when data structure changes
          // Save the actual route data
          previewData: routeData || null,
        });
        setIsSaved(true);
        toast({
          title: "Route Saved!",
          description: `${routeName} bookmarked to your dashboard.`,
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message ?? "Failed to update bookmark.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  } as const;
  const iconSizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" } as const;

  if (checking) {
    return (
      <div
        className={`inline-flex items-center space-x-2 rounded-lg border border-gray-300 ${sizeClasses[size]} ${className}`}
      >
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center space-x-2 font-medium transition-all duration-200 rounded-lg
        ${sizeClasses[size]}
        ${loading ? "opacity-75 cursor-not-allowed" : ""}
        ${
          isSaved
            ? "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        }
        ${className}`}
      title={isSaved ? "Remove from dashboard" : "Save to dashboard"}
    >
      {loading ? (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
          <span>{isSaved ? "Removing..." : "Saving..."}</span>
        </>
      ) : isSaved ? (
        <>
          <BookmarkCheck className={iconSizes[size]} />
          <span>Saved</span>
        </>
      ) : (
        <>
          <BookmarkPlus className={iconSizes[size]} />
          <span>Save to Dashboard</span>
        </>
      )}
    </button>
  );
}
