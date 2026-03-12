import { getStoredAuthToken } from "../lib/auth-session";
import { ApiError, apiRequest } from "../lib/fetcher";
import {
  getNextNumericId,
  isRecoverableApiError,
  loadStoredValue,
  mergeUniqueByKey,
  saveStoredValue,
  upsertByKey,
} from "../lib/local-fallback";
import type { AppUser, UserRole, UserStatus } from "../types";

export type UserPayload = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
};

export type CreateUserPayload = UserPayload & {
  password: string;
  passwordConfirmation: string;
};

const USERS_STORAGE_KEY = "reset-main-users-v1";
const USERS_DELETED_KEY = "reset-main-users-deleted-v1";

const defaultUsers: AppUser[] = [];

const loadDeletedKeys = (): Set<string> => {
  const raw = loadStoredValue(USERS_DELETED_KEY, [] as string[], (v) => Array.isArray(v) ? v : []);
  return new Set(raw);
};

const saveDeletedKeys = (keys: Set<string>) => {
  saveStoredValue(USERS_DELETED_KEY, Array.from(keys));
};

const trackDeletedUser = (user: AppUser) => {
  const keys = loadDeletedKeys();
  const key = getUserKey(user);
  keys.add(key);
  if (user.backendId) keys.add(user.backendId);
  saveDeletedKeys(keys);
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
    normalized === "معلق"
  ) {
    return "معلّق";
  }

  return "نشط";
};

const normalizeUser = (input: unknown, index: number): AppUser => {
  const record = asRecord(input) || {};

  return {
    id: Math.floor(getFirstNumber(record.id, record.user_id, index + 1)),
    backendId: getFirstText(record.id, record.user_id) || undefined,
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

const denormalizeRole = (role: UserRole): string => {
  if (role === "مدير") return "admin";
  if (role === "محاسب") return "accountant";
  if (role === "مشاهدة فقط") return "viewer";
  return "accountant";
};

const denormalizeStatus = (status: UserStatus): string => {
  if (status === "معلّق") return "inactive";
  return "active";
};

const buildRequestBody = (user: UserPayload) => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: denormalizeRole(user.role),
  status: denormalizeStatus(user.status),
});

const buildCreateRequestBody = (user: CreateUserPayload) => ({
  name: user.name,
  email: user.email,
  password: user.password,
  password_confirmation: user.passwordConfirmation,
});

const mergeCreatedUser = (user: AppUser, payload: UserPayload): AppUser => ({
  ...user,
  phone: payload.phone,
  role: payload.role,
  status: payload.status,
  joinedAt: user.joinedAt || new Date().toISOString().slice(0, 10),
});

const getUserKey = (user: AppUser) =>
  getFirstText(user.email, `${user.name}-${user.phone}`, String(user.id));

const LEGACY_SEED_USER_EMAILS = new Set(["admin@example.com", "accountant@example.com"]);

const isLegacySeedUser = (user: AppUser) => LEGACY_SEED_USER_EMAILS.has(user.email);

const loadLocalUsers = () => {
  const users = loadStoredValue(USERS_STORAGE_KEY, defaultUsers, (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return defaultUsers;
    }

    return value.map((user, index) => normalizeUser(user, index));
  });

  const filteredUsers = users.filter((user) => !isLegacySeedUser(user));

  if (filteredUsers.length !== users.length) {
    saveStoredValue(USERS_STORAGE_KEY, filteredUsers);
  }

  return filteredUsers;
};

const saveLocalUsers = (users: AppUser[]) => {
  saveStoredValue(USERS_STORAGE_KEY, users);
};

const persistUser = (user: AppUser) => {
  const users = loadLocalUsers();
  saveLocalUsers(upsertByKey(users, user, getUserKey));
};

const createLocalUser = (payload: CreateUserPayload) => {
  const users = loadLocalUsers();
  const createdUser = normalizeUser(
    {
      ...buildRequestBody(payload),
      id: getNextNumericId(users, (entry) => entry.id),
      joined_at: new Date().toISOString().slice(0, 10),
    },
    users.length
  );

  saveLocalUsers(upsertByKey(users, createdUser, getUserKey));
  return createdUser;
};

const updateLocalUser = (userId: number, payload: UserPayload) => {
  const users = loadLocalUsers();
  const existingUser = users.find((user) => user.id === userId);
  const nextUser = normalizeUser(
    {
      ...(existingUser || {}),
      ...buildRequestBody(payload),
      id: userId,
      joined_at: existingUser?.joinedAt || new Date().toISOString().slice(0, 10),
    },
    0
  );

  saveLocalUsers(
    users.map((user) => (user.id === userId ? nextUser : user))
  );

  return nextUser;
};

const removeLocalUser = (userId: number) => {
  const users = loadLocalUsers();
  saveLocalUsers(users.filter((user) => user.id !== userId));
};

export const listUsers = async () => {
  const localUsers = loadLocalUsers();
  const deletedKeys = loadDeletedKeys();

  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>("/api/users", {
      ...(token ? { token } : {}),
    });
    console.group("[UsersService] API Response Debug");
    console.log("Raw Payload:", payload);
    const remoteUsers = extractCollection(payload)
      .map((user, index) => normalizeUser(user, index))
      .filter((user) => !deletedKeys.has(getUserKey(user)) && (!user.backendId || !deletedKeys.has(user.backendId)));
    console.log("Parsed Remote Data:", remoteUsers);
    console.groupEnd();
    
    const mergedUsers = mergeUniqueByKey(localUsers, remoteUsers, getUserKey)
      .filter((user) => !deletedKeys.has(getUserKey(user)) && (!user.backendId || !deletedKeys.has(user.backendId)));
    
    saveLocalUsers(mergedUsers);
    return mergedUsers;
  } catch (error) {
    console.error("[UsersService] listUsers failed:", error);
    const isSilenced =
      isRecoverableApiError(error) ||
      (error instanceof ApiError && [404, 405].includes(error.status));

    if (isSilenced) {
      console.warn("[UsersService] API Unavailable, using local cache.");
      return localUsers.filter((user) => !deletedKeys.has(getUserKey(user)));
    }

    throw error;
  }
};

export const createUser = async (payload: CreateUserPayload) => {
  const requestBody = {
    ...buildRequestBody(payload),
    password: payload.password,
    password_confirmation: payload.passwordConfirmation,
  };

  try {
    console.log("[UsersService] Attempting to create user via /api/users:", requestBody);
    const token = getStoredAuthToken();
    const response = await apiRequest<unknown>("/api/users", {
      method: "POST",
      ...(token ? { token } : {}),
      body: JSON.stringify(requestBody),
    });
    console.log("[UsersService] Creation success:", response);

    const record = asRecord(response);
    const createdUser = normalizeUser(record?.data || record?.user || response, 0);
    
    persistUser(createdUser);
    return createdUser;
  } catch (error) {
    console.error("[UsersService] Create user failed:", error);
    if (isRecoverableApiError(error)) {
      return createLocalUser(payload);
    }

    throw error;
  }
};

export const updateUser = async (userOrId: AppUser | number, payload: UserPayload) => {
  const isId = typeof userOrId === "number";
  const userId = isId ? userOrId : userOrId.id;
  const apiUrlId = (!isId && userOrId.backendId) ? userOrId.backendId : userId;

  try {
    const token = getStoredAuthToken();
    const response = await apiRequest<unknown>(`/api/users/${encodeURIComponent(apiUrlId)}`, {
      method: "PUT",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildRequestBody(payload)),
    });
    const record = asRecord(response);
    const updatedUser = normalizeUser(record?.data || record?.user || response, 0);
    persistUser(updatedUser);
    return updatedUser;
  } catch (error) {
    if (
      isRecoverableApiError(error) ||
      (error instanceof ApiError && (error.status === 404 || error.status === 405))
    ) {
      return updateLocalUser(userId, payload);
    }

    throw error;
  }
};

export const deleteUser = async (userOrId: AppUser | number) => {
  const isId = typeof userOrId === "number";
  const userId = isId ? userOrId : userOrId.id;
  const apiUrlId = (!isId && userOrId.backendId) ? userOrId.backendId : userId;

  // Optimistic local marker
  if (!isId) {
    trackDeletedUser(userOrId);
  }
  removeLocalUser(userId);

  try {
    console.log("[UsersService] Attempting to delete user:", { userId, apiUrlId });
    const token = getStoredAuthToken();
    await apiRequest(`/api/users/${encodeURIComponent(apiUrlId)}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
    console.log("[UsersService] Delete success for user:", userId);
  } catch (error) {
    console.error("[UsersService] Delete failed for user:", userId, error);
    
    // Deletion is already done locally. 
    // We only throw if it's a 4xx that UNEXPECTEDLY prevents deletion (like 403 Forbidden)
    // but 404 (already gone), 405 (method not allowed), or 500 (SQL error) should be silent.
    const isSilenced =
      isRecoverableApiError(error) ||
      (error instanceof ApiError && [404, 405].includes(error.status)) ||
      !(error instanceof ApiError); // Connection errors

    if (!isSilenced) {
      throw error;
    }
  }
};
