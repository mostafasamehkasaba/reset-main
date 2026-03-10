const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_KEY ||
  "https://invoice.looptech.cloud";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const AUTH_TOKEN_STORAGE_KEY = "reset-main-auth-token";
export const AUTH_USER_STORAGE_KEY = "reset-main-auth-user";
export const AUTH_COOKIE_NAME = "reset_main_auth_token";
export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const LOGIN_PATH = "/auth/login";
export const REGISTER_PATH = "/auth/register";
