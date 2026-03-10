import { apiRequest } from "@/app/lib/fetcher";
import { login, type LoginPayload } from "@/app/services/auth";

export type SocialAuthProvider = "google" | "github";

export const AUTH_DASHBOARD_PATH = "/dashboard";

const forgotPasswordEndpoint = process.env.NEXT_PUBLIC_AUTH_FORGOT_PASSWORD_URL?.trim() || "";

const socialProviderEndpoints: Record<SocialAuthProvider, string> = {
  google: process.env.NEXT_PUBLIC_AUTH_GOOGLE_URL?.trim() || "",
  github: process.env.NEXT_PUBLIC_AUTH_GITHUB_URL?.trim() || "",
};

export const getSafeAuthRedirect = (
  value: string | null | undefined,
  fallback = AUTH_DASHBOARD_PATH
) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
};

export const loginWithEmail = async (payload: LoginPayload) => login(payload);

export const requestPasswordReset = async (email: string) => {
  if (!forgotPasswordEndpoint) {
    throw new Error(
      "مسار استعادة كلمة المرور غير مُعد بعد. أضف NEXT_PUBLIC_AUTH_FORGOT_PASSWORD_URL."
    );
  }

  return apiRequest<unknown>(forgotPasswordEndpoint, {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
};

const buildSocialProviderUrl = (provider: SocialAuthProvider, nextPath: string) => {
  const providerUrl = socialProviderEndpoints[provider];

  if (!providerUrl) {
    const providerLabel = provider === "google" ? "Google" : "GitHub";
    throw new Error(
      `تسجيل الدخول بواسطة ${providerLabel} غير مُعد بعد. أضف رابط المزود في متغيرات البيئة.`
    );
  }

  const url = /^https?:\/\//i.test(providerUrl)
    ? new URL(providerUrl)
    : new URL(providerUrl, window.location.origin);

  if (nextPath) {
    url.searchParams.set("next", nextPath);
  }

  return url.toString();
};

export const startSocialLogin = async (provider: SocialAuthProvider, nextPath: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const targetUrl = buildSocialProviderUrl(provider, nextPath);
  window.location.assign(targetUrl);
};
