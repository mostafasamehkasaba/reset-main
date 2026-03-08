import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredSettings = {
  siteName: string;
  siteUrl: string;
  siteEmail: string;
  sitePhone: string;
  itemsPerPage: number;
  defaultCurrency: string;
  companyTagline: string;
  invoiceNotes: string;
  logoDataUrl: string;
  updatedAt: string | null;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "settings.json");

const defaultSettings: StoredSettings = {
  siteName: "",
  siteUrl: "",
  siteEmail: "",
  sitePhone: "",
  itemsPerPage: 20,
  defaultCurrency: "ريال عماني",
  companyTagline: "",
  invoiceNotes:
    "أهلاً بكم، يسعدنا خدمتك. سيتم إرسال الفاتورة مع جميع التفاصيل عبر البريد الإلكتروني.",
  logoDataUrl: "",
  updatedAt: null,
};

const ensureDataFile = async () => {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultSettings, null, 2), "utf8");
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

const normalizeSettings = (value: unknown): StoredSettings => {
  const record = asRecord(value) || {};

  return {
    siteName: asString(record.siteName).trim(),
    siteUrl: asString(record.siteUrl).trim(),
    siteEmail: asString(record.siteEmail).trim(),
    sitePhone: asString(record.sitePhone).trim(),
    itemsPerPage: Math.max(1, asNumber(record.itemsPerPage, defaultSettings.itemsPerPage)),
    defaultCurrency: asString(record.defaultCurrency, defaultSettings.defaultCurrency).trim(),
    companyTagline: asString(record.companyTagline).trim(),
    invoiceNotes: asString(record.invoiceNotes, defaultSettings.invoiceNotes),
    logoDataUrl: asString(record.logoDataUrl).trim(),
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt.trim()
        : null,
  };
};

export const readStoredSettings = async () => {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
};

export const writeStoredSettings = async (input: StoredSettings) => {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(input, null, 2), "utf8");
  return input;
};

export const getDefaultSettings = () => defaultSettings;
