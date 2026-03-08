import { API_BASE_URL } from "./constant";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildUrl = (endpoint: string) => {
  if (isAbsoluteUrl(endpoint)) return endpoint;
  if (endpoint.startsWith("/")) return `${API_BASE_URL}${endpoint}`;
  return `${API_BASE_URL}/${endpoint}`;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getMessageFromPayload = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    const normalized = payload.trim();
    return normalized || null;
  }

  const record = asRecord(payload);
  if (!record) return null;

  if (record.errors && typeof record.errors === "object") {
    const messages = Object.values(record.errors as Record<string, unknown>)
      .flatMap((value) => {
        if (typeof value === "string" && value.trim()) {
          return [value.trim()];
        }

        if (Array.isArray(value)) {
          return value.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0
          );
        }

        return [];
      })
      .map((message) => message.trim())
      .filter(Boolean);

    if (messages.length > 0) {
      return [...new Set(messages)].join("، ");
    }

    for (const value of Object.values(record.errors as Record<string, unknown>)) {
      if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return value[0].trim();
      }
    }
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  return null;
};

const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
};

export const getErrorMessage = (
  error: unknown,
  fallback = "حدث خطأ غير متوقع. حاول مرة أخرى."
) => {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { token, headers, body, credentials = "same-origin", ...restOptions } = options;
  const normalizedHeaders = new Headers(headers);
  const requestUrl = buildUrl(endpoint);

  normalizedHeaders.set("Accept", "application/json");

  if (body && !(body instanceof FormData) && !normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    normalizedHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...restOptions,
      body,
      credentials,
      headers: normalizedHeaders,
    });
  } catch {
    throw new Error("تعذر الاتصال بالخادم. تحقق من إعداد رابط الـ API أو سياسات CORS.");
  }

  let payload: unknown = null;

  if (response.status !== 204) {
    payload = isJsonResponse(response) ? await response.json() : await response.text();
  }

  if (!response.ok) {
    const message = getMessageFromPayload(payload) || `فشل الطلب (${response.status}).`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
