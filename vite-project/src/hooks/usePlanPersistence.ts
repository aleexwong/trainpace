/**
 * Generic Plan Persistence Hook
 * Handles saving/loading from Firebase and session storage for any plan type.
 */

import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";

interface PlanPersistenceConfig<T> {
  /** Firestore collection name (e.g. "user_pace_plans") */
  collectionName: string;
  /** Session storage key for guest redirect (e.g. "pending_pace_plan") */
  sessionStorageKey: string;
  /** Return-to path after guest redirect (e.g. "/pace-calculator") */
  returnToPath: string;
  /** Google Analytics category (e.g. "Pace Calculator") */
  gaCategory: string;
  /** Build the data object to store in sessionStorage for guest redirect */
  buildSessionData: (params: T) => Record<string, unknown>;
  /** Build the Firestore document fields (userId and createdAt are added automatically) */
  buildFirestoreDoc: (params: T) => Record<string, unknown>;
  /** Build the GA event label */
  buildGaLabel: (params: T) => string;
  /** Toast description shown on successful save */
  successDescription?: string;
}

interface UsePlanPersistenceReturn<T> {
  isSaving: boolean;
  isSaved: boolean;
  saveToDashboard: (params: T) => Promise<void>;
  saveForGuestRedirect: (params: T) => void;
  resetSaveState: () => void;
}

export function usePlanPersistence<T>(
  config: PlanPersistenceConfig<T>
): UsePlanPersistenceReturn<T> {
  const {
    collectionName,
    sessionStorageKey,
    returnToPath,
    gaCategory,
    buildSessionData,
    buildFirestoreDoc,
    buildGaLabel,
    successDescription,
  } = config;

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveForGuestRedirect = useCallback(
    (params: T) => {
      sessionStorage.setItem(
        sessionStorageKey,
        JSON.stringify(buildSessionData(params))
      );

      ReactGA.event({
        category: gaCategory,
        action: "Guest Save Redirect",
        label: buildGaLabel(params),
      });

      const searchParams = new URLSearchParams({
        returnTo: returnToPath,
        savePlan: "true",
      });

      navigate(`/register?${searchParams.toString()}`);
    },
    [navigate, sessionStorageKey, buildSessionData, gaCategory, buildGaLabel, returnToPath]
  );

  const saveToDashboard = useCallback(
    async (params: T) => {
      if (!user) {
        saveForGuestRedirect(params);
        return;
      }

      setIsSaving(true);

      try {
        await addDoc(collection(db, collectionName), {
          userId: user.uid,
          ...buildFirestoreDoc(params),
          createdAt: serverTimestamp(),
        });

        setIsSaved(true);

        toast({
          title: "Saved to Dashboard! 🎉",
          description:
            successDescription ||
            "Your plan is now in your dashboard.",
        });

        ReactGA.event({
          category: gaCategory,
          action: "Saved Plan to Dashboard",
          label: buildGaLabel(params),
        });
      } catch (error) {
        console.error(`Failed to save to ${collectionName}:`, error);
        toast({
          title: "Failed to save",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user, saveForGuestRedirect, toast, collectionName, buildFirestoreDoc, gaCategory, buildGaLabel, successDescription]
  );

  const resetSaveState = useCallback(() => {
    setIsSaved(false);
  }, []);

  return {
    isSaving,
    isSaved,
    saveToDashboard,
    saveForGuestRedirect,
    resetSaveState,
  };
}
