import type { Supplier, SupplierStatus } from "../types";

export const SUPPLIER_STORAGE_KEY = "reset-main-suppliers-v2";

export const SUPPLIER_STATUSES: SupplierStatus[] = ["نشط", "موقوف", "مؤرشف"];

export const PAYMENT_TERMS: Array<30 | 60> = [30, 60];

export const defaultSuppliers: Supplier[] = [];

const asPositiveNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric < 0 ? 0 : numeric;
};

const asText = (value: unknown, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized || fallback;
};

const asPaymentTerm = (value: unknown): 30 | 60 => {
  return value === 60 ? 60 : 30;
};

const asSupplierStatus = (value: unknown): SupplierStatus => {
  if (value === "موقوف") return "موقوف";
  if (value === "مؤرشف") return "مؤرشف";
  return "نشط";
};

const LEGACY_SEED_SUPPLIER_EMAILS = new Set([
  "sales@alriyada.com",
  "future@supplies.co",
  "contact@delta-traders.com",
]);

const isLegacySeedSupplier = (supplier: Supplier) =>
  LEGACY_SEED_SUPPLIER_EMAILS.has(supplier.email);

const sanitizeSupplier = (raw: Partial<Supplier>, index: number): Supplier => {
  return {
    id: Math.floor(asPositiveNumber(raw.id, index + 1)),
    name: asText(raw.name, `مورد ${index + 1}`),
    email: asText(raw.email, "-"),
    phone: asText(raw.phone, "-"),
    country: asText(raw.country, "-"),
    city: asText(raw.city, "-"),
    address: asText(raw.address, "-"),
    taxNumber: asText(raw.taxNumber, "-"),
    paymentTermDays: asPaymentTerm(raw.paymentTermDays),
    creditLimit: asPositiveNumber(raw.creditLimit, 0),
    openingBalance: asPositiveNumber(raw.openingBalance, 0),
    bankAccountNumber: asText(raw.bankAccountNumber, "-"),
    bankName: asText(raw.bankName, "-"),
    iban: asText(raw.iban, "-"),
    status: asSupplierStatus(raw.status),
    notes: asText(raw.notes, "-"),
    balance: asPositiveNumber(raw.balance, 0),
    orders: Math.floor(asPositiveNumber(raw.orders, 0)),
    joinedAt: asText(raw.joinedAt, new Date().toISOString().slice(0, 10)),
  };
};

export const loadSuppliersFromStorage = (): Supplier[] => {
  if (typeof window === "undefined") return defaultSuppliers;

  try {
    const raw = window.localStorage.getItem(SUPPLIER_STORAGE_KEY);
    if (!raw) return defaultSuppliers;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultSuppliers;
    const suppliers = parsed
      .map((item, index) => sanitizeSupplier(item as Partial<Supplier>, index))
      .filter((supplier) => !isLegacySeedSupplier(supplier));

    if (suppliers.length !== parsed.length) {
      saveSuppliersToStorage(suppliers);
    }

    return suppliers;
  } catch {
    return defaultSuppliers;
  }
};

export const saveSuppliersToStorage = (suppliers: Supplier[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(suppliers));
};
