import { ApiError } from "./fetcher";

export const loadStoredValue = <T>(
  key: string,
  fallback: T,
  normalize: (value: unknown) => T
): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return normalize(JSON.parse(raw));
  } catch {
    return fallback;
  }
};

export const saveStoredValue = <T>(key: string, value: T) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getNextNumericId = <T>(items: T[], getId: (item: T) => number) => {
  return items.reduce((maxId, item) => Math.max(maxId, getId(item)), 0) + 1;
};

export const mergeUniqueByKey = <T>(
  primaryItems: T[],
  secondaryItems: T[],
  getKey: (item: T) => string
) => {
  const merged: T[] = [];
  const seen = new Set<string>();

  for (const item of [...primaryItems, ...secondaryItems]) {
    const key = getKey(item).trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(item);
  }

  return merged;
};

export const upsertByKey = <T>(items: T[], nextItem: T, getKey: (item: T) => string) => {
  const nextKey = getKey(nextItem).trim().toLowerCase();
  return [nextItem, ...items.filter((item) => getKey(item).trim().toLowerCase() !== nextKey)];
};

export const isRecoverableApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    // 5xx (Server error), 404 (Missing endpoint), 405 (Method not allowed), 422 (Validation/SQL error)
    return error.status >= 500 || [404, 405, 422].includes(error.status);
  }

  return error instanceof Error;
};
