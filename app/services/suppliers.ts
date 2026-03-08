import { getStoredAuthToken } from "../lib/auth-session";
import {
  getCountryLabel,
  getSupplierStatusLabel,
  toCountryApiValue,
  type SupplierStatusApiValue,
  toSupplierStatusApiValue,
} from "../lib/api-lookups";
import { apiRequest } from "../lib/fetcher";
import type { Supplier, SupplierStatus } from "../types";

export type SupplierPayload = {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  taxNumber: string;
  paymentTermDays: 30 | 60;
  creditLimit: number;
  openingBalance: number;
  bankAccountNumber: string;
  bankName: string;
  iban: string;
  status: SupplierStatus | SupplierStatusApiValue;
  notes: string;
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

const normalizeStatus = (value: unknown): SupplierStatus => {
  return getSupplierStatusLabel(value);
};

const normalizeSupplier = (input: unknown, index: number): Supplier => {
  const record = asRecord(input) || {};
  const openingBalance = getFirstNumber(record.openingBalance, record.opening_balance);

  return {
    id: Math.floor(getFirstNumber(record.id, record.supplier_id, index + 1)),
    name: getFirstText(record.name, record.supplier_name, `مورد ${index + 1}`),
    email: getFirstText(record.email, "-") || "-",
    phone: getFirstText(record.phone, record.mobile, record.phone_number, "-") || "-",
    country: getCountryLabel(getFirstText(record.country, record.country_name, "-") || "-"),
    city: getFirstText(record.city, record.city_name, "-") || "-",
    address: getFirstText(record.address, record.street_address, "-") || "-",
    taxNumber: getFirstText(record.taxNumber, record.tax_number, "-") || "-",
    paymentTermDays:
      getFirstNumber(record.paymentTermDays, record.payment_term_days) === 60 ? 60 : 30,
    creditLimit: getFirstNumber(record.creditLimit, record.credit_limit),
    openingBalance,
    bankAccountNumber:
      getFirstText(record.bankAccountNumber, record.bank_account_number, "-") || "-",
    bankName: getFirstText(record.bankName, record.bank_name, "-") || "-",
    iban: getFirstText(record.iban, "-") || "-",
    status: normalizeStatus(record.status ?? record.state ?? record.is_active),
    notes: getFirstText(record.notes, record.note, "-") || "-",
    balance: getFirstNumber(
      record.balance,
      record.current_balance,
      record.remaining_balance,
      openingBalance
    ),
    orders: Math.floor(getFirstNumber(record.orders, record.orders_count)),
    joinedAt:
      getFirstText(record.joinedAt, record.joined_at, record.created_at) ||
      new Date().toISOString().slice(0, 10),
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.suppliers, record.items, record.results];

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

const buildRequestBody = (supplier: SupplierPayload) => {
  const normalizedCountry = toCountryApiValue(supplier.country);
  const normalizedStatus = toSupplierStatusApiValue(supplier.status);

  return {
    name: supplier.name,
    supplier_name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    mobile: supplier.phone,
    country: normalizedCountry,
    country_name: getCountryLabel(normalizedCountry),
    city: supplier.city,
    address: supplier.address,
    taxNumber: supplier.taxNumber,
    tax_number: supplier.taxNumber,
    paymentTermDays: supplier.paymentTermDays,
    payment_term_days: supplier.paymentTermDays,
    creditLimit: supplier.creditLimit,
    credit_limit: supplier.creditLimit,
    openingBalance: supplier.openingBalance,
    opening_balance: supplier.openingBalance,
    bankAccountNumber: supplier.bankAccountNumber,
    bank_account_number: supplier.bankAccountNumber,
    bankName: supplier.bankName,
    bank_name: supplier.bankName,
    iban: supplier.iban,
    status: normalizedStatus,
    state: normalizedStatus,
    is_active: normalizedStatus === "active",
    status_label: getSupplierStatusLabel(normalizedStatus),
    notes: supplier.notes,
  };
};

const extractSingleSupplier = (payload: unknown, fallback: SupplierPayload): Supplier => {
  const record = asRecord(payload);
  const candidate = record?.data || record?.supplier || record?.item || payload;
  return normalizeSupplier(candidate || fallback, 0);
};

const requireToken = () => {
  const token = getStoredAuthToken();
  if (!token) {
    throw new Error("الجلسة غير متاحة. سجل الدخول أولًا.");
  }

  return token;
};

export const listSuppliers = async () => {
  const payload = await apiRequest<unknown>("/api/suppliers", {
    token: requireToken(),
  });

  return extractCollection(payload).map((supplier, index) =>
    normalizeSupplier(supplier, index)
  );
};

export const createSupplier = async (supplier: SupplierPayload) => {
  const payload = await apiRequest<unknown>("/api/suppliers", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildRequestBody(supplier)),
  });

  return extractSingleSupplier(payload, supplier);
};

export const deleteSupplier = async (supplierId: number) => {
  await apiRequest(`/api/suppliers/${supplierId}`, {
    method: "DELETE",
    token: requireToken(),
  });
};
