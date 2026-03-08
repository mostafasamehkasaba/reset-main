import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredPaymentMethod = {
  id: number;
  name: string;
  type: string;
  payments: number;
  total: number;
  currency: string;
  desc: string;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "payment-methods.json");

const ensureDataFile = async () => {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]", "utf8");
  }
};

const parseCollection = (raw: string): StoredPaymentMethod[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPaymentMethod[]) : [];
  } catch {
    return [];
  }
};

export const listStoredPaymentMethods = async () => {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  return parseCollection(raw);
};

const saveStoredPaymentMethods = async (methods: StoredPaymentMethod[]) => {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(methods, null, 2), "utf8");
};

export const createStoredPaymentMethod = async (input: {
  name: string;
  type?: string;
  currency?: string;
  desc?: string;
}) => {
  const methods = await listStoredPaymentMethods();
  const nextId = methods.reduce((maxId, method) => Math.max(maxId, method.id), 0) + 1;

  const method: StoredPaymentMethod = {
    id: nextId,
    name: input.name,
    type: input.type || "",
    payments: 0,
    total: 0,
    currency: input.currency || "OMR",
    desc: input.desc || "-",
    createdAt: new Date().toISOString(),
  };

  methods.unshift(method);
  await saveStoredPaymentMethods(methods);
  return method;
};

export const deleteStoredPaymentMethod = async (methodId: number) => {
  const methods = await listStoredPaymentMethods();
  const nextMethods = methods.filter((method) => method.id !== methodId);

  if (nextMethods.length === methods.length) {
    return false;
  }

  await saveStoredPaymentMethods(nextMethods);
  return true;
};
