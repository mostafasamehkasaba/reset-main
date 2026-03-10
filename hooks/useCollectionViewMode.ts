"use client";

import { useEffect, useState } from "react";

export type CollectionViewMode = "table" | "cards";

export function useCollectionViewMode(
  storageKey: string,
  defaultMode: CollectionViewMode = "table"
) {
  const [viewMode, setViewMode] = useState<CollectionViewMode>(defaultMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === "table" || storedValue === "cards") {
      setViewMode(storedValue);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, viewMode);
  }, [storageKey, viewMode]);

  return {
    viewMode,
    setViewMode,
    isTableView: viewMode === "table",
    isCardsView: viewMode === "cards",
  };
}
