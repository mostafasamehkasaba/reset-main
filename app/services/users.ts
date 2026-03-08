import { getStoredAuthToken } from "../lib/auth-session";
import { apiRequest } from "../lib/fetcher";
import type { AppUser, UserRole, UserStatus } from "../types";

export type UserPayload = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
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

const normalizeRole = (value: unknown): UserRole => {
  const normalized = getFirstText(value).toLowerCase();
  if (
    normalized === "admin" ||
    normalized === "owner" ||
    normalized === "manager" ||
    normalized === "مدير"
  ) {
    return "مدير";
  }
  if (normalized === "accountant" || normalized === "finance" || normalized === "محاسب") {
    return "محاسب";
  }
  if (normalized === "viewer" || normalized === "read_only" || normalized === "مشاهدة فقط") {
    return "مشاهدة فقط";
  }

  return "محاسب";
};

const normalizeStatus = (value: unknown): UserStatus => {
  const normalized = getFirstText(value).toLowerCase();
  if (
    normalized === "inactive" ||
    normalized === "disabled" ||
    normalized === "suspended" ||
    normalized === "معلق" ||
    normalized === "معلّق"
  ) {
    return "معلّق";
  }

  return "نشط";
};

const normalizeUser = (input: unknown, index: number): AppUser => {
  const record = asRecord(input) || {};

  return {
    id: Math.floor(getFirstNumber(record.id, record.user_id, index + 1)),
    name: getFirstText(record.name, record.full_name, record.username, `مستخدم ${index + 1}`),
    email: getFirstText(record.email, record.user_email, "-"),
    phone: getFirstText(record.phone, record.phone_number, record.mobile, "-"),
    role: normalizeRole(record.role ?? record.user_role),
    status: normalizeStatus(record.status ?? record.state),
    joinedAt: getFirstText(record.joinedAt, record.joined_at, record.created_at, "-"),
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.users, record.items, record.results];

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

const requireToken = () => {
  const token = getStoredAuthToken();
  if (!token) {
    throw new Error("الجلسة غير متاحة. سجل الدخول أولًا.");
  }

  return token;
};

const buildRequestBody = (user: UserPayload) => ({
  name: user.name,
  full_name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  user_role: user.role,
  status: user.status,
});

export const listUsers = async () => {
  const payload = await apiRequest<unknown>("/api/users", {
    token: requireToken(),
  });

  return extractCollection(payload).map((user, index) => normalizeUser(user, index));
};

export const createUser = async (payload: UserPayload) => {
  const response = await apiRequest<unknown>("/api/users", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildRequestBody(payload)),
  });
  const record = asRecord(response);
  return normalizeUser(record?.data || record?.user || response, 0);
};

export const updateUser = async (userId: number, payload: UserPayload) => {
  const response = await apiRequest<unknown>(`/api/users/${userId}`, {
    method: "PUT",
    token: requireToken(),
    body: JSON.stringify(buildRequestBody(payload)),
  });
  const record = asRecord(response);
  return normalizeUser(record?.data || record?.user || response, 0);
};

export const deleteUser = async (userId: number) => {
  await apiRequest(`/api/users/${userId}`, {
    method: "DELETE",
    token: requireToken(),
  });
};
