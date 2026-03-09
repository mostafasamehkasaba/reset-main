import { getStoredAuthToken } from "../lib/auth-session";
import { getCountryLabel, toCountryApiValue } from "../lib/api-lookups";
import { ApiError, apiRequest } from "../lib/fetcher";
import {
  getNextNumericId,
  isRecoverableApiError,
  loadStoredValue,
  mergeUniqueByKey,
  saveStoredValue,
  upsertByKey,
} from "../lib/local-fallback";
import type { Client, ClientRecentInvoice, ClientStats } from "../types";

export type ClientType = "individual" | "company";
export type ClientPaymentMethod = "cash" | "transfer" | "card" | "credit";

export type CreateClientPayload = {
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  taxNumber?: string;
  commercialRegister?: string;
  creditLimit?: number;
  openingBalance?: number;
  defaultPaymentMethod?: ClientPaymentMethod;
  internalNotes?: string;
  currency?: string;
};

export type ClientInvoiceLedgerEntry = {
  id: string;
  num: number;
  clientId: number | null;
  clientName: string;
  products: number;
  total: number;
  paid: number;
  discount: number;
  due: number;
  currency: string;
  status: string;
  date: string;
  dueDate: string;
};

const CLIENTS_STORAGE_KEY = "reset-main-clients-v1";

const defaultClients: Client[] = [
  {
    id: 1,
    name: "شركة المدار",
    email: "info@almadar.test",
    phone: "+968 9000 1001",
    country: "عمان",
    address: "مسقط",
    currency: "OMR",
    invoices: 2,
    due: 180,
    stats: {
      total: 420,
      paid: 240,
      discount: 0,
      due: 180,
    },
    recentInvoices: [
      {
        id: 1,
        products: 2,
        total: 240,
        paid: 240,
        discount: 0,
        due: 0,
        currency: "OMR",
        status: "مدفوعة",
        date: "2026-02-20",
        dueDate: "2026-02-20",
      },
      {
        id: 2,
        products: 1,
        total: 180,
        paid: 0,
        discount: 0,
        due: 180,
        currency: "OMR",
        status: "غير مدفوعة",
        date: "2026-03-01",
        dueDate: "2026-03-08",
      },
    ],
  },
  {
    id: 2,
    name: "مؤسسة النور",
    email: "sales@alnoor.test",
    phone: "+966 500 000 200",
    country: "السعودية",
    address: "الرياض",
    currency: "SAR",
    invoices: 1,
    due: 0,
    stats: {
      total: 560,
      paid: 560,
      discount: 20,
      due: 0,
    },
    recentInvoices: [
      {
        id: 3,
        products: 3,
        total: 560,
        paid: 560,
        discount: 20,
        due: 0,
        currency: "SAR",
        status: "مدفوعة",
        date: "2026-02-16",
        dueDate: "2026-02-18",
      },
    ],
  },
];

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
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

const normalizeStatus = (value: unknown) => {
  const normalized = getFirstText(value).toLowerCase();

  if (!normalized) return "مسودة";
  if (normalized === "paid" || normalized === "مدفوعة") return "مدفوعة";

  if (normalized === "unpaid" || normalized === "غير مدفوعة" || normalized === "pending") {
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
    type: getFirstText(record.type, record.client_type, record.customer_type, "individual"),
    email: getFirstText(record.email, record.client_email, record.customer_email, "-"),
    phone: getFirstText(record.phone, record.phone_number, record.mobile, "-"),
    country: getCountryLabel(
      getFirstText(record.country, record.country_name, record.nationality, "-")
    ),
    address: getFirstText(record.address, record.address_line, record.street, "-"),
    taxNumber: getFirstText(record.taxNumber, record.tax_number, "-"),
    commercialRegister: getFirstText(
      record.commercialRegister,
      record.commercial_register,
      "-"
    ),
    creditLimit: getFirstNumber(record.creditLimit, record.credit_limit, 0),
    openingBalance: getFirstNumber(record.openingBalance, record.opening_balance, 0),
    defaultPaymentMethod: getFirstText(
      record.defaultPaymentMethod,
      record.default_payment_method,
      "-"
    ),
    internalNotes: getFirstText(record.internalNotes, record.internal_notes, record.notes, "-"),
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
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

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

const buildRequestBody = (client: CreateClientPayload) => {
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
    tax_number: client.taxNumber,
    taxNumber: client.taxNumber,
    commercial_register: client.commercialRegister,
    commercialRegister: client.commercialRegister,
    credit_limit: client.creditLimit,
    creditLimit: client.creditLimit,
    opening_balance: client.openingBalance,
    openingBalance: client.openingBalance,
    default_payment_method: client.defaultPaymentMethod,
    defaultPaymentMethod: client.defaultPaymentMethod,
    internal_notes: client.internalNotes,
    internalNotes: client.internalNotes,
    notes: client.internalNotes,
    currency: client.currency,
    currency_code: client.currency,
  };
};

const getClientKey = (client: Client) =>
  getFirstText(client.email, `${client.name}-${client.phone}`, String(client.id));

const loadLocalClients = () =>
  loadStoredValue(CLIENTS_STORAGE_KEY, defaultClients, (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return defaultClients;
    }

    return value.map((client, index) => normalizeClient(client, index));
  });

const saveLocalClients = (clients: Client[]) => {
  saveStoredValue(CLIENTS_STORAGE_KEY, clients);
};

const persistClient = (client: Client) => {
  const clients = loadLocalClients();
  saveLocalClients(upsertByKey(clients, client, getClientKey));
};

const buildClientDraft = (client: CreateClientPayload) => ({
  ...buildRequestBody(client),
  invoices: 0,
  due: 0,
  currency: client.currency || "OMR",
  currency_code: client.currency || "OMR",
  stats: {
    total: 0,
    paid: 0,
    discount: 0,
    due: 0,
  },
  recentInvoices: [],
});

const createLocalClient = (client: CreateClientPayload) => {
  const clients = loadLocalClients();
  const createdClient = normalizeClient(
    {
      ...buildClientDraft(client),
      id: getNextNumericId(clients, (entry) => entry.id),
    },
    clients.length
  );

  saveLocalClients(upsertByKey(clients, createdClient, getClientKey));
  return createdClient;
};

const updateLocalClient = (clientId: number, client: CreateClientPayload) => {
  const clients = loadLocalClients();
  const existingClient = clients.find((entry) => entry.id === clientId);
  const nextClient = normalizeClient(
    {
      ...(existingClient || {}),
      ...buildClientDraft(client),
      id: clientId,
      invoices: existingClient?.invoices ?? 0,
      due: existingClient?.due ?? 0,
      stats: existingClient?.stats ?? {
        total: 0,
        paid: 0,
        discount: 0,
        due: 0,
      },
      recentInvoices: existingClient?.recentInvoices ?? [],
    },
    0
  );

  if (!existingClient) {
    saveLocalClients(upsertByKey(clients, nextClient, getClientKey));
    return nextClient;
  }

  saveLocalClients(clients.map((entry) => (entry.id === clientId ? nextClient : entry)));
  return nextClient;
};

const removeLocalClient = (clientId: number) => {
  const clients = loadLocalClients();
  saveLocalClients(clients.filter((client) => client.id !== clientId));
};

const getLedgerEntryKey = (entry: ClientInvoiceLedgerEntry | ClientRecentInvoice) =>
  String(
    "num" in entry && typeof entry.num === "number" && Number.isFinite(entry.num)
      ? entry.num
      : entry.id
  );

const normalizeRecentInvoiceDate = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toRecentInvoice = (entry: ClientInvoiceLedgerEntry): ClientRecentInvoice => ({
  id: Math.max(1, Math.trunc(entry.num)),
  products: Math.max(0, Math.trunc(entry.products)),
  total: Math.max(0, entry.total),
  paid: Math.max(0, entry.paid),
  discount: Math.max(0, entry.discount),
  due: Math.max(0, entry.due),
  currency: entry.currency || "OMR",
  status: entry.status,
  date: entry.date || "-",
  dueDate: entry.dueDate || "-",
});

const recalculateClientInvoices = (client: Client, recentInvoices: ClientRecentInvoice[]) => {
  const normalizedRecentInvoices = [...recentInvoices].sort((left, right) => {
    const dateDifference =
      normalizeRecentInvoiceDate(right.date) - normalizeRecentInvoiceDate(left.date);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return right.id - left.id;
  });

  const invoiceStats = normalizedRecentInvoices.reduce(
    (totals, invoice) => ({
      total: totals.total + invoice.total,
      paid: totals.paid + invoice.paid,
      discount: totals.discount + invoice.discount,
      due: totals.due + invoice.due,
    }),
    { total: 0, paid: 0, discount: 0, due: 0 }
  );

  const openingBalanceDue = Math.max(0, client.openingBalance ?? 0);
  const totalDue = invoiceStats.due + openingBalanceDue;

  return {
    ...client,
    invoices: normalizedRecentInvoices.length,
    due: totalDue,
    stats: {
      total: invoiceStats.total,
      paid: invoiceStats.paid,
      discount: invoiceStats.discount,
      due: totalDue,
    },
    recentInvoices: normalizedRecentInvoices,
  };
};

const matchesLedgerClient = (client: Client, invoice: ClientInvoiceLedgerEntry) => {
  if (invoice.clientId !== null) {
    return client.id === invoice.clientId;
  }

  return client.name.trim().toLowerCase() === invoice.clientName.trim().toLowerCase();
};

export const syncLocalClientInvoice = (
  nextInvoice: ClientInvoiceLedgerEntry | null,
  previousInvoice: ClientInvoiceLedgerEntry | null = null
) => {
  const clients = loadLocalClients();
  if (clients.length === 0) {
    return;
  }

  const nextClients = clients.map((client) => {
    const touchesPrevious = previousInvoice ? matchesLedgerClient(client, previousInvoice) : false;
    const touchesNext = nextInvoice ? matchesLedgerClient(client, nextInvoice) : false;

    if (!touchesPrevious && !touchesNext) {
      return client;
    }

    let recentInvoices = [...client.recentInvoices];

    if (previousInvoice) {
      const previousKey = getLedgerEntryKey(previousInvoice);
      recentInvoices = recentInvoices.filter(
        (invoice) => getLedgerEntryKey(invoice) !== previousKey
      );
    }

    if (nextInvoice) {
      recentInvoices = upsertByKey(recentInvoices, toRecentInvoice(nextInvoice), getLedgerEntryKey);
    }

    return recalculateClientInvoices(client, recentInvoices);
  });

  saveLocalClients(nextClients);
};

export const listClients = async () => {
  const localClients = loadLocalClients();

  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>("/api/clients", {
      ...(token ? { token } : {}),
    });
    const remoteClients = extractCollection(payload).map((client, index) =>
      normalizeClient(client, index)
    );
    const mergedClients = mergeUniqueByKey(localClients, remoteClients, getClientKey);
    saveLocalClients(mergedClients);
    return mergedClients;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return localClients;
    }

    throw error;
  }
};

export const getClient = async (clientId: number) => {
  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>(`/api/clients/${clientId}`, {
      ...(token ? { token } : {}),
    });
    const record = asRecord(payload);
    const client = normalizeClient(record?.data || record?.client || payload, 0);
    persistClient(client);
    return client;
  } catch (error) {
    if (
      (error instanceof ApiError && (error.status === 404 || error.status === 405)) ||
      isRecoverableApiError(error)
    ) {
      const localClient = loadLocalClients().find((client) => client.id === clientId);
      if (localClient) {
        return localClient;
      }

      const clients = await listClients();
      return clients.find((client) => client.id === clientId) ?? null;
    }

    throw error;
  }
};

export const createClient = async (client: CreateClientPayload) => {
  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>("/api/clients", {
      method: "POST",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildRequestBody(client)),
    });

    const record = asRecord(payload);
    const createdRecord = asRecord(record?.data || record?.client || payload) || {};
    const createdClient = normalizeClient(
      {
        ...buildClientDraft(client),
        ...createdRecord,
      },
      0
    );
    persistClient(createdClient);
    return createdClient;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return createLocalClient(client);
    }

    throw error;
  }
};

export const updateClient = async (clientId: number, client: CreateClientPayload) => {
  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>(`/api/clients/${clientId}`, {
      method: "PUT",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildRequestBody(client)),
    });

    const record = asRecord(payload);
    const updatedRecord = asRecord(record?.data || record?.client || payload) || {};
    const updatedClient = normalizeClient(
      {
        ...buildClientDraft(client),
        ...updatedRecord,
        id: clientId,
      },
      0
    );

    persistClient(updatedClient);
    return updatedClient;
  } catch (error) {
    if (
      isRecoverableApiError(error) ||
      (error instanceof ApiError && (error.status === 404 || error.status === 405))
    ) {
      return updateLocalClient(clientId, client);
    }

    throw error;
  }
};

export const deleteClient = async (clientId: number) => {
  try {
    const token = getStoredAuthToken();
    await apiRequest(`/api/clients/${clientId}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
    removeLocalClient(clientId);
  } catch (error) {
    if (isRecoverableApiError(error)) {
      removeLocalClient(clientId);
      return;
    }

    throw error;
  }
};
