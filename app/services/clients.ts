import { getStoredAuthToken } from "../lib/auth-session";
import { getCountryLabel, toCountryApiValue } from "../lib/api-lookups";
import { ApiError, apiRequest } from "../lib/fetcher";
import type { Client, ClientRecentInvoice, ClientStats } from "../types";

export type ClientType = "individual" | "company";

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

const normalizeStatus = (value: unknown) => {
  const normalized = getFirstText(value).toLowerCase();
  if (!normalized) return "مسودة";
  if (normalized === "paid" || normalized === "مدفوعة") return "مدفوعة";
  if (
    normalized === "unpaid" ||
    normalized === "غير مدفوعة" ||
    normalized === "pending"
  ) {
    return "غير مدفوعة";
  }
  if (
    normalized === "partially_paid" ||
    normalized === "partial" ||
    normalized === "مدفوعة جزئيا" ||
    normalized === "مدفوعة جزئيًا"
  ) {
    return "مدفوعة جزئيا";
  }
  if (normalized === "cancelled" || normalized === "canceled" || normalized === "ملغاة") {
    return "ملغاة";
  }

  return getFirstText(value, "مسودة");
};

const normalizeStats = (value: unknown): ClientStats => {
  const record = asRecord(value) || {};
  return {
    total: getFirstNumber(record.total, record.total_amount, record.grand_total),
    paid: getFirstNumber(record.paid, record.paid_amount, record.amount_paid),
    discount: getFirstNumber(record.discount, record.discount_amount),
    due: getFirstNumber(record.due, record.due_amount, record.remaining_amount),
  };
};

const normalizeRecentInvoice = (input: unknown, index: number): ClientRecentInvoice => {
  const record = asRecord(input) || {};
  const total = getFirstNumber(record.total, record.total_amount, record.grand_total);
  const paid = getFirstNumber(record.paid, record.paid_amount, record.amount_paid);
  const discount = getFirstNumber(record.discount, record.discount_amount);
  const due = getFirstNumber(
    record.due,
    record.due_amount,
    record.remaining_amount,
    total - paid
  );

  return {
    id: Math.floor(getFirstNumber(record.id, record.invoice_id, index + 1)),
    products: Math.floor(
      getFirstNumber(record.products, record.items_count, record.products_count, record.lines_count, 0)
    ),
    total,
    paid,
    discount,
    due: due < 0 ? 0 : due,
    currency: getFirstText(record.currency, record.currency_code, "OMR"),
    status: normalizeStatus(record.status ?? record.payment_status ?? record.state),
    date: getFirstText(record.date, record.issue_date, record.created_at, "-"),
    dueDate: getFirstText(record.dueDate, record.due_date, "-"),
  };
};

const normalizeClient = (input: unknown, index: number): Client => {
  const record = asRecord(input) || {};

  const recentInvoicesRaw =
    record.recentInvoices ||
    record.recent_invoices ||
    record.invoices ||
    record.last_invoices ||
    [];

  const recentInvoices = Array.isArray(recentInvoicesRaw)
    ? recentInvoicesRaw.map((invoice, invoiceIndex) =>
        normalizeRecentInvoice(invoice, invoiceIndex)
      )
    : [];

  const statsRecord =
    record.stats || record.summary || record.totals || record.metrics || record;
  const parsedStats = normalizeStats(statsRecord);
  const computedStats = recentInvoices.reduce(
    (totals, invoice) => ({
      total: totals.total + invoice.total,
      paid: totals.paid + invoice.paid,
      discount: totals.discount + invoice.discount,
      due: totals.due + invoice.due,
    }),
    { total: 0, paid: 0, discount: 0, due: 0 }
  );
  const stats =
    parsedStats.total || parsedStats.paid || parsedStats.discount || parsedStats.due
      ? parsedStats
      : computedStats;

  return {
    id: Math.floor(getFirstNumber(record.id, record.client_id, record.customer_id, index + 1)),
    name: getFirstText(record.name, record.client_name, record.customer_name, `عميل ${index + 1}`),
    email: getFirstText(record.email, record.client_email, record.customer_email, "-"),
    phone: getFirstText(record.phone, record.phone_number, record.mobile, "-"),
    country: getCountryLabel(
      getFirstText(record.country, record.country_name, record.nationality, "-")
    ),
    address: getFirstText(record.address, record.address_line, record.street, "-"),
    currency: getFirstText(record.currency, record.currency_code, "OMR"),
    invoices: Math.floor(
      getFirstNumber(
        record.invoices,
        record.invoices_count,
        record.total_invoices,
        recentInvoices.length
      )
    ),
    due: getFirstNumber(record.due, record.due_amount, record.outstanding, stats.due),
    stats,
    recentInvoices,
  };
};

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.clients, record.items, record.results];

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

const buildRequestBody = (client: {
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  currency?: string;
}) => {
  const normalizedCountry = client.country ? toCountryApiValue(client.country) : undefined;

  return {
    name: client.name,
    client_name: client.name,
    customer_name: client.name,
    type: client.type,
    client_type: client.type,
    customer_type: client.type,
    is_company: client.type === "company",
    email: client.email,
    client_email: client.email,
    phone: client.phone,
    phone_number: client.phone,
    country: normalizedCountry,
    country_name: normalizedCountry ? getCountryLabel(normalizedCountry) : undefined,
    nationality: normalizedCountry ? getCountryLabel(normalizedCountry) : undefined,
    address: client.address,
    currency: client.currency,
    currency_code: client.currency,
  };
};

export const listClients = async () => {
  const payload = await apiRequest<unknown>("/api/clients", {
    token: requireToken(),
  });

  return extractCollection(payload).map((client, index) => normalizeClient(client, index));
};

export const getClient = async (clientId: number) => {
  try {
    const payload = await apiRequest<unknown>(`/api/clients/${clientId}`, {
      token: requireToken(),
    });
    const record = asRecord(payload);
    return normalizeClient(record?.data || record?.client || payload, 0);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      const list = await listClients();
      return list.find((client) => client.id === clientId) ?? null;
    }
    throw error;
  }
};

export const createClient = async (client: {
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  currency?: string;
}) => {
  const payload = await apiRequest<unknown>("/api/clients", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildRequestBody(client)),
  });

  const record = asRecord(payload);
  return normalizeClient(record?.data || record?.client || payload, 0);
};

export const deleteClient = async (clientId: number) => {
  await apiRequest(`/api/clients/${clientId}`, {
    method: "DELETE",
    token: requireToken(),
  });
};
