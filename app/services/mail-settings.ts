import { ApiError } from "../lib/fetcher";

export type MailSettings = {
  contactEmail: string;
  smtpHost: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpPort: string;
  tlsEnabled: boolean;
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

const normalizeMailSettings = (input: unknown): MailSettings => {
  const record = asRecord(input) || {};

  return {
    contactEmail: getText(record.contactEmail).trim(),
    smtpHost: getText(record.smtpHost).trim(),
    smtpUsername: getText(record.smtpUsername).trim(),
    smtpPassword: getText(record.smtpPassword),
    smtpPort: String(Math.max(1, getNumber(record.smtpPort, 587) || 587)),
    tlsEnabled: typeof record.tlsEnabled === "boolean" ? record.tlsEnabled : true,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt.trim()
        : null,
  };
};

export const emptyMailSettings: MailSettings = {
  contactEmail: "",
  smtpHost: "",
  smtpUsername: "",
  smtpPassword: "",
  smtpPort: "587",
  tlsEnabled: true,
  updatedAt: null,
};

export const getMailSettings = async () => {
  const response = await localApiRequest<unknown>("/api/mail-settings");
  const record = asRecord(response);
  return normalizeMailSettings(record?.data || response);
};

export const saveMailSettings = async (settings: MailSettings) => {
  const response = await localApiRequest<unknown>("/api/mail-settings", {
    method: "PUT",
    body: JSON.stringify({
      contactEmail: settings.contactEmail.trim(),
      smtpHost: settings.smtpHost.trim(),
      smtpUsername: settings.smtpUsername.trim(),
      smtpPassword: settings.smtpPassword,
      smtpPort: Math.max(1, Number.parseInt(settings.smtpPort, 10) || 587),
      tlsEnabled: settings.tlsEnabled,
    }),
  });

  const record = asRecord(response);
  return normalizeMailSettings(record?.data || response);
};
