import {
  clearAuthSession,
  extractAuthToken,
  extractAuthUser,
  getStoredAuthToken,
  storeAuthSession,
} from "../lib/auth-session";
import { apiRequest } from "../lib/fetcher";
import type { AuthUser } from "../types";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type AuthResult = {
  token: string;
  user: AuthUser | null;
  raw: unknown;
};

const persistSessionFromPayload = (payload: unknown): AuthResult => {
  const token = extractAuthToken(payload);
  const user = extractAuthUser(payload);

  if (token) {
    storeAuthSession({ token, user });
  }

  return {
    token,
    user,
    raw: payload,
  };
};

export const login = async (credentials: LoginPayload) => {
  const payload = await apiRequest<unknown>("/api/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  const result = persistSessionFromPayload(payload);
  if (!result.token) {
    throw new Error("تم تسجيل الدخول لكن الاستجابة لا تحتوي على token صالح.");
  }

  return result;
};

export const register = async (payload: RegisterPayload) => {
  const response = await apiRequest<unknown>("/api/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return persistSessionFromPayload(response);
};

export const logout = async () => {
  const token = getStoredAuthToken();

  try {
    if (token) {
      await apiRequest("/api/logout", {
        method: "POST",
        token,
      });
    }
  } finally {
    clearAuthSession();
  }
};
