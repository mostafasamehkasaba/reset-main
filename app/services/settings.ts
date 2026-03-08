import { ApiError } from "../lib/fetcher";

export type AppSettings = {
  siteName: string;
  siteUrl: string;
  siteEmail: string;
  sitePhone: string;
  itemsPerPage: string;
  defaultCurrency: string;
  companyTagline: string;
  invoiceNotes: string;
  logoDataUrl: string;
  updatedAt: string | null;
};

type LocalRequestOptions = RequestInit;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
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

const getMessageFromPayload = (payload: unknown) => {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  const record = asRecord(payload);
  if (!record) return null;

  if (record.errors && typeof record.errors === "object") {
    const firstError = Object.values(record.errors as Record<string, unknown>).find((value) => {
      if (typeof value === "string" && value.trim()) {
        return true;
      }

      return Array.isArray(value) && typeof value[0] === "string" && value[0].trim();
    });

    if (typeof firstError === "string" && firstError.trim()) {
      return firstError.trim();
    }

    if (Array.isArray(firstError) && typeof firstError[0] === "string") {
      return firstError[0].trim();
    }
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  return null;
};

const localApiRequest = async <T>(
  endpoint: string,
  options: LocalRequestOptions = {}
): Promise<T> => {
  const { headers, body, credentials = "same-origin", ...restOptions } = options;
  const normalizedHeaders = new Headers(headers);

  normalizedHeaders.set("Accept", "application/json");

  if (body && !(body instanceof FormData) && !normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...restOptions,
    body,
    credentials,
    headers: normalizedHeaders,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    throw new ApiError(
      getMessageFromPayload(payload) || `فشل الطلب (${response.status}).`,
      response.status,
      payload
    );
  }

  return payload as T;
};

const normalizeSettings = (input: unknown): AppSettings => {
  const record = asRecord(input) || {};

  return {
    siteName: getText(record.siteName).trim(),
    siteUrl: getText(record.siteUrl).trim(),
    siteEmail: getText(record.siteEmail).trim(),
    sitePhone: getText(record.sitePhone).trim(),
    itemsPerPage: String(Math.max(1, getNumber(record.itemsPerPage, 20) || 20)),
    defaultCurrency: getText(record.defaultCurrency).trim() || "ريال عماني",
    companyTagline: getText(record.companyTagline).trim(),
    invoiceNotes: getText(record.invoiceNotes),
    logoDataUrl: getText(record.logoDataUrl).trim(),
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt.trim()
        : null,
  };
};

export const emptySettings: AppSettings = {
  siteName: "",
  siteUrl: "",
  siteEmail: "",
  sitePhone: "",
  itemsPerPage: "20",
  defaultCurrency: "ريال عماني",
  companyTagline: "",
  invoiceNotes:
    "أهلاً بكم، يسعدنا خدمتك. سيتم إرسال الفاتورة مع جميع التفاصيل عبر البريد الإلكتروني.",
  logoDataUrl: "",
  updatedAt: null,
};

export const getSettings = async () => {
  const response = await localApiRequest<unknown>("/api/settings");
  const record = asRecord(response);
  return normalizeSettings(record?.data || response);
};

export const saveSettings = async (settings: AppSettings) => {
  const response = await localApiRequest<unknown>("/api/settings", {
    method: "PUT",
    body: JSON.stringify({
      siteName: settings.siteName.trim(),
      siteUrl: settings.siteUrl.trim(),
      siteEmail: settings.siteEmail.trim(),
      sitePhone: settings.sitePhone.trim(),
      itemsPerPage: Math.max(1, Number.parseInt(settings.itemsPerPage, 10) || 20),
      defaultCurrency: settings.defaultCurrency.trim(),
      companyTagline: settings.companyTagline.trim(),
      invoiceNotes: settings.invoiceNotes,
      logoDataUrl: settings.logoDataUrl,
    }),
  });
  const record = asRecord(response);
  return normalizeSettings(record?.data || response);
};
