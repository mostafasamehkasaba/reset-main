import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from "./constant";
import type { AuthUser } from "../types";

type SessionShape = {
  token: string;
  user: AuthUser | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getNestedValue = (source: unknown, path: string[]): unknown => {
  let current: unknown = source;

  for (const key of path) {
    const record = asRecord(current);
    if (!record || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return current;
};

const getFirstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getFirstNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
};

const normalizeUser = (input: unknown): AuthUser | null => {
  const record = asRecord(input);
  if (!record) return null;

  const id = getFirstNumber(record.id, record.user_id);
  const name = getFirstText(record.name, record.full_name, record.username);
  const email = getFirstText(record.email, record.mail);
  const role = getFirstText(record.role, record.role_name, record.user_type);

  if (!name && !email && !role && typeof id === "undefined") {
    return null;
  }

  return {
    ...(typeof id === "number" ? { id } : {}),
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(role ? { role } : {}),
  };
};

export const extractAuthToken = (payload: unknown): string => {
  return getFirstText(
    getNestedValue(payload, ["token"]),
    getNestedValue(payload, ["access_token"]),
    getNestedValue(payload, ["auth_token"]),
    getNestedValue(payload, ["api_token"]),
    getNestedValue(payload, ["data", "token"]),
    getNestedValue(payload, ["data", "access_token"]),
    getNestedValue(payload, ["authorisation", "token"]),
    getNestedValue(payload, ["authorization", "token"])
  );
};

export const extractAuthUser = (payload: unknown): AuthUser | null => {
  const candidates = [
    getNestedValue(payload, ["user"]),
    getNestedValue(payload, ["data", "user"]),
    getNestedValue(payload, ["account"]),
    getNestedValue(payload, ["admin"]),
    payload,
  ];

  for (const candidate of candidates) {
    const user = normalizeUser(candidate);
    if (user) return user;
  }

  return null;
};

const writeCookie = (token: string) => {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
};

const clearCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const storeAuthSession = (session: SessionShape) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);

  if (session.user) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  } else {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  writeCookie(session.token);
};

export const clearAuthSession = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  clearCookie();
};

export const getStoredAuthToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
};

export const getStoredAuthUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
};
