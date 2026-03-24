/**
 * Generic Firestore Collection Hook
 * Loads documents from a Firestore collection filtered by userId,
 * with optional client-side sorting.
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseFirestoreCollectionOptions<T> {
  /** Optional client-side sort applied after fetching */
  sortFn?: (a: T, b: T) => number;
}

interface UseFirestoreCollectionReturn<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
}

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  userId: string | undefined,
  options?: UseFirestoreCollectionOptions<T>
): UseFirestoreCollectionReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, collectionName),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      if (options?.sortFn) {
        results.sort(options.sortFn);
      }

      setItems(results);
      setError(null);
    } catch (err) {
      console.error(`Error loading ${collectionName}:`, err);
      setError(`Failed to load ${collectionName}`);
    } finally {
      setLoading(false);
    }
  }, [userId, collectionName, options?.sortFn]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadItems();
  }, [userId, loadItems]);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return {
    items,
    loading,
    error,
    reload: loadItems,
    removeItem,
    updateItem,
  };
}
