import type { Delegate } from "../types";
import {
  getNextNumericId,
  loadStoredValue,
  saveStoredValue,
  upsertByKey,
} from "../lib/local-fallback";

export type DelegatePayload = {
  name: string;
  phone: string;
  email: string;
  region: string;
  status: Delegate["status"];
};

const DELEGATES_STORAGE_KEY = "reset-main-delegates-v1";

const defaultDelegates: Delegate[] = [];

const normalizeDelegate = (input: unknown, index: number): Delegate => {
  const record = input as Record<string, unknown> || {};

  return {
    id: record.id as number ?? index + 1,
    name: record.name as string ?? `مندوب ${index + 1}`,
    phone: record.phone as string ?? "-",
    email: record.email as string ?? "-",
    region: record.region as string ?? "-",
    status: record.status as Delegate["status"] ?? "نشط",
  };
};

const getDelegateKey = (delegate: Delegate) => String(delegate.id);

export const loadLocalDelegates = () => {
  return loadStoredValue(DELEGATES_STORAGE_KEY, defaultDelegates, (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return defaultDelegates;
    }

    return value.map((delegate, index) => normalizeDelegate(delegate, index));
  });
};

const saveLocalDelegates = (delegates: Delegate[]) => {
  saveStoredValue(DELEGATES_STORAGE_KEY, delegates);
};

export const listDelegates = async () => {
  return Promise.resolve(loadLocalDelegates());
};

export const getDelegate = async (delegateId: number) => {
  const delegates = await listDelegates();
  return Promise.resolve(delegates.find((delegate) => delegate.id === delegateId) ?? null);
};

export const createDelegate = async (delegate: DelegatePayload) => {
  const delegates = loadLocalDelegates();
  const newDelegate = normalizeDelegate(
    {
      ...delegate,
      id: getNextNumericId(delegates, (entry) => entry.id),
    },
    delegates.length
  );

  saveLocalDelegates(upsertByKey(delegates, newDelegate, getDelegateKey));
  return Promise.resolve(newDelegate);
};

export const updateDelegate = async (delegateId: number, delegate: DelegatePayload) => {
  const delegates = loadLocalDelegates();
  const existingDelegate = delegates.find((entry) => entry.id === delegateId);
  const nextDelegate = normalizeDelegate(
    {
      ...(existingDelegate || {}),
      ...delegate,
      id: delegateId,
    },
    0
  );

  if (!existingDelegate) {
    saveLocalDelegates(upsertByKey(delegates, nextDelegate, getDelegateKey));
    return Promise.resolve(nextDelegate);
  }

  saveLocalDelegates(
    delegates.map((entry) => (entry.id === delegateId ? nextDelegate : entry))
  );
  return Promise.resolve(nextDelegate);
};

export const deleteDelegate = async (delegate: Delegate) => {
  const delegates = loadLocalDelegates();
  saveLocalDelegates(delegates.filter((d) => d.id !== delegate.id));
  return Promise.resolve();
};
