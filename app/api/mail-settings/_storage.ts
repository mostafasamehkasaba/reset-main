import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredMailSettings = {
  contactEmail: string;
  smtpHost: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpPort: number;
  tlsEnabled: boolean;
  updatedAt: string | null;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "mail-settings.json");

const defaultMailSettings: StoredMailSettings = {
  contactEmail: "",
  smtpHost: "",
  smtpUsername: "",
  smtpPassword: "",
  smtpPort: 587,
  tlsEnabled: true,
  updatedAt: null,
};

const ensureDataFile = async () => {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultMailSettings, null, 2), "utf8");
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asString = (value: unknown, fallback = "") => {
  return typeof value === "string" ? value : fallback;
};

const asNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const normalizeMailSettings = (value: unknown): StoredMailSettings => {
  const record = asRecord(value) || {};

  return {
    contactEmail: asString(record.contactEmail).trim(),
    smtpHost: asString(record.smtpHost).trim(),
    smtpUsername: asString(record.smtpUsername).trim(),
    smtpPassword: asString(record.smtpPassword),
    smtpPort: Math.max(1, asNumber(record.smtpPort, defaultMailSettings.smtpPort)),
    tlsEnabled: typeof record.tlsEnabled === "boolean" ? record.tlsEnabled : true,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt.trim()
        : null,
  };
};

export const readStoredMailSettings = async () => {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");

  try {
    return normalizeMailSettings(JSON.parse(raw));
  } catch {
    return defaultMailSettings;
  }
};

export const writeStoredMailSettings = async (input: StoredMailSettings) => {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(input, null, 2), "utf8");
  return input;
};

export const getDefaultMailSettings = () => defaultMailSettings;
