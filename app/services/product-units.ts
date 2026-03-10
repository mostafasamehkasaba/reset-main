import { ApiError } from "../lib/fetcher";

export type ProductUnitOption = {
  id: number;
  name: string;
  createdAt: string;
  isDefault: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

const normalizeUnit = (input: unknown, index: number): ProductUnitOption => {
  const record = asRecord(input) || {};

  return {
    id: Math.floor(getNumber(record.id, index + 1)),
    name: getText(record.name, record.unit_name, `وحدة ${index + 1}`),
    createdAt: getText(record.createdAt, record.created_at, "-"),
    isDefault: Boolean(record.isDefault),
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const candidates = [record.data, record.units, record.items, record.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const localApiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === "string" && payload.trim()) ||
      (asRecord(payload)?.message as string | undefined) ||
      `فشل الطلب (${response.status}).`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};

export const listProductUnits = async () => {
  const payload = await localApiRequest<unknown>("/api/product-units");
  return extractCollection(payload).map((item, index) => normalizeUnit(item, index));
};

export const createProductUnit = async (name: string) => {
  const payload = await localApiRequest<unknown>("/api/product-units", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const record = asRecord(payload);
  return normalizeUnit(record?.data || record?.unit || payload, 0);
};
