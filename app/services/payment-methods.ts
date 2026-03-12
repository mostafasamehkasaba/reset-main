import { ApiError } from "../lib/fetcher";
import { getStoredAuthToken } from "../lib/auth-session";
import { isRecoverableApiError } from "../lib/local-fallback";

export type PaymentMethod = {
  id: number;
  name: string;
  type?: string;
  payments: number;
  total: number;
  currency: string;
  desc: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentMethodPayload = {
  name: string;
  desc?: string;
  currency?: string;
  type?: string;
};

type LocalRequestOptions = RequestInit & {
  token?: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
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

  return 0;
};

const getMessageFromPayload = (payload: unknown) => {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  const record = asRecord(payload);
  if (!record) return null;

  const candidates = [record.message, record.error, record.details, record.reason];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const normalizeMethod = (input: unknown, index: number): PaymentMethod => {
  const record = asRecord(input) || {};
  return {
    id: Math.floor(getFirstNumber(record.id, record.method_id, index + 1)),
    name: getFirstText(record.name, record.method_name, `وسيلة ${index + 1}`),
    type: getFirstText(record.type, record.method_type, record.category),
    payments: Math.floor(getFirstNumber(record.payments, record.payments_count, 0)),
    total: getFirstNumber(record.total, record.total_amount, record.sum),
    currency: getFirstText(record.currency, record.currency_code, "OMR"),
    desc: getFirstText(record.desc, record.description, "-"),
    createdAt: getFirstText(record.createdAt, record.created_at),
    updatedAt: getFirstText(record.updatedAt, record.updated_at),
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.methods, record.items, record.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    const nestedRecord = asRecord(candidate);
    if (nestedRecord && Array.isArray(nestedRecord.data)) {
      return nestedRecord.data;
    }
  }

  return [];
};

const localApiRequest = async <T>(
  endpoint: string,
  options: LocalRequestOptions = {}
): Promise<T> => {
  const { token, headers, body, credentials = "same-origin", ...restOptions } = options;
  const normalizedHeaders = new Headers(headers);

  normalizedHeaders.set("Accept", "application/json");

  if (body && !(body instanceof FormData) && !normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    normalizedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...restOptions,
    body,
    credentials,
    headers: normalizedHeaders,
  });

  let payload: unknown = null;
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 204) {
    payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      getMessageFromPayload(payload) || `فشل الطلب (${response.status}).`,
      response.status,
      payload
    );
  }

  return payload as T;
};

const buildRequestBody = (payload: PaymentMethodPayload) => ({
  name: payload.name,
  method_name: payload.name,
  desc: payload.desc,
  description: payload.desc,
  currency: payload.currency,
  currency_code: payload.currency,
  type: payload.type,
  method_type: payload.type,
});

const getToken = () => getStoredAuthToken();

const PAYMENT_METHODS_STORAGE_KEY = "reset-main-payment-methods-v1";
const PAYMENT_METHODS_DELETED_KEY = "reset-main-payment-methods-deleted-v1";

const loadDeletedMethodKeys = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(PAYMENT_METHODS_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDeletedMethodKeys = (keys: Set<string>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PAYMENT_METHODS_DELETED_KEY, JSON.stringify(Array.from(keys)));
};

const trackDeletedMethod = (id: number, name?: string) => {
  const keys = loadDeletedMethodKeys();
  keys.add(String(id));
  if (name) keys.add(name.trim().toLowerCase());
  saveDeletedMethodKeys(keys);
};

const loadLocalMethods = (): PaymentMethod[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PAYMENT_METHODS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMethods = (methods: PaymentMethod[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(methods));
};

export const listPaymentMethods = async () => {
  const local = loadLocalMethods();
  const deletedKeys = loadDeletedMethodKeys();
  try {
    const payload = await localApiRequest<unknown>("/api/payment-methods", {
      token: getToken(),
    });
    console.group("[PaymentMethodsService] API Response Debug");
    console.log("Raw Payload:", payload);
    const remote = extractCollection(payload)
      .map((method, index) => normalizeMethod(method, index))
      .filter((method) => !deletedKeys.has(String(method.id)) && !deletedKeys.has(method.name.trim().toLowerCase()));
    console.log("Parsed Remote Data:", remote);
    console.groupEnd();

    // Merge local and remote, preserving IDs, filtering deleted
    const merged = Array.from(new Map([...local, ...remote].map(m => [m.id, m])).values())
      .filter((m) => !deletedKeys.has(String(m.id)) && !deletedKeys.has(m.name.trim().toLowerCase()));
    saveLocalMethods(merged);
    return merged;
  } catch (error) {
    console.error("[PaymentMethodsService] list failed:", error);
    const isSilenced =
      isRecoverableApiError(error) ||
      (error instanceof ApiError && [404, 405].includes(error.status));

    if (isSilenced) {
      console.warn("[PaymentMethodsService] API Unavailable, using local cache.");
      return local.filter((m) => !deletedKeys.has(String(m.id)));
    }

    throw error;
  }
};

export const createPaymentMethod = async (payload: PaymentMethodPayload) => {
  const deletedKeys = loadDeletedMethodKeys();
  // If we're creating something with a name we previously deleted, remove it from tombstones
  if (deletedKeys.has(payload.name.trim().toLowerCase())) {
    deletedKeys.delete(payload.name.trim().toLowerCase());
    saveDeletedMethodKeys(deletedKeys);
  }
  try {
    const response = await localApiRequest<unknown>("/api/payment-methods", {
      method: "POST",
      token: getToken(),
      body: JSON.stringify(buildRequestBody(payload)),
    });
    const record = asRecord(response);
    const created = normalizeMethod(record?.data || record?.method || response, Date.now());
    
    const local = loadLocalMethods();
    saveLocalMethods([created, ...local]);
    return created;
  } catch (error) {
    // Basic local fallback for 5xx errors
    const local = loadLocalMethods();
    const created = normalizeMethod({ ...buildRequestBody(payload), id: Date.now() }, local.length);
    saveLocalMethods([created, ...local]);
    return created;
  }
};

export const updatePaymentMethod = async (
  methodId: number,
  payload: PaymentMethodPayload
) => {
  try {
    const response = await localApiRequest<unknown>(`/api/payment-methods/${methodId}`, {
      method: "PUT",
      token: getToken(),
      body: JSON.stringify(buildRequestBody(payload)),
    });
    const record = asRecord(response);
    const updated = normalizeMethod(record?.data || record?.method || response, 0);
    
    const local = loadLocalMethods();
    saveLocalMethods(local.map(m => m.id === methodId ? updated : m));
    return updated;
  } catch (error) {
    const local = loadLocalMethods();
    const updated = normalizeMethod({ ...buildRequestBody(payload), id: methodId }, 0);
    saveLocalMethods(local.map(m => m.id === methodId ? updated : m));
    return updated;
  }
};

export const deletePaymentMethod = async (methodId: number) => {
  const local = loadLocalMethods();
  const target = local.find(m => m.id === methodId);
  trackDeletedMethod(methodId, target?.name);
  saveLocalMethods(local.filter(m => m.id !== methodId));

  try {
    await localApiRequest(`/api/payment-methods/${methodId}`, {
      method: "DELETE",
      token: getToken(),
    });
  } catch (error) {
    console.error("[PaymentMethodsService] Delete failed:", methodId, error);
    const isSilenced =
      isRecoverableApiError(error) ||
      (error instanceof ApiError && [404, 405].includes(error.status)) ||
      !(error instanceof ApiError);

    if (!isSilenced) throw error;
  }
};
