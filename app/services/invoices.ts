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
import type { Invoice, InvoiceStatus } from "../types";
import { syncLocalClientInvoice, type ClientInvoiceLedgerEntry } from "./clients";

export type InvoicePaymentStatus = "draft" | "paid" | "unpaid" | "partial" | "cancelled";

export type InvoiceLineItemPayload = {
  itemType: "product" | "service";
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  discountType: "percent" | "amount";
  discountValue: number;
  taxRate: number;
};

export type CreateInvoicePayload = {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: InvoicePaymentStatus | InvoiceStatus;
  currency: string;
  paymentMethod: "cash" | "transfer" | "card" | "credit";
  clientId: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  notes?: string;
  paidAmount: number;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  items: InvoiceLineItemPayload[];
};

type InvoicePaymentMethod = CreateInvoicePayload["paymentMethod"];

type InvoiceRecord = Invoice & {
  paymentMethod: InvoicePaymentMethod;
  clientId: number | null;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  notes: string;
  subtotal: number;
  tax: number;
  items: InvoiceLineItemPayload[];
};

export type InvoiceDetails = {
  id: string;
  backendId?: string;
  num: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus | string;
  currency: string;
  paymentMethod: InvoicePaymentMethod;
  clientId: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  notes: string;
  paidAmount: number;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    due: number;
  };
  items: InvoiceLineItemPayload[];
};

const INVOICES_STORAGE_KEY = "reset-main-invoices-v1";

const defaultInvoices: Invoice[] = [];

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

const getFirstId = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.floor(value));
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

const getFirstArray = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const isPaymentMethod = (value: unknown): value is InvoicePaymentMethod =>
  value === "cash" || value === "transfer" || value === "card" || value === "credit";

const normalizePaymentMethod = (value: unknown, dueDate: string): InvoicePaymentMethod => {
  if (isPaymentMethod(value)) {
    return value;
  }

  const normalized = getFirstText(value).toLowerCase();
  if (normalized === "cash" || normalized === "transfer" || normalized === "card") {
    return normalized;
  }

  if (normalized === "credit" || normalized === "deferred" || normalized === "later") {
    return "credit";
  }

  return dueDate && dueDate !== "-" ? "credit" : "cash";
};

const normalizeStatus = (value: unknown): InvoiceStatus => {
  const normalized = getFirstText(value).toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "مدفوعة" ||
    normalized === "completed"
  ) {
    return "مدفوعة";
  }

  if (
    normalized === "unpaid" ||
    normalized === "pending" ||
    normalized === "due" ||
    normalized === "غير مدفوعة"
  ) {
    return "غير مدفوعة";
  }

  if (
    normalized === "partial" ||
    normalized === "partial_paid" ||
    normalized === "partially_paid" ||
    normalized === "مدفوعة جزئيا" ||
    normalized === "مدفوعة جزئيًا"
  ) {
    return "مدفوعة جزئيا";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "void" ||
    normalized === "ملغاة"
  ) {
    return "ملغاة";
  }

  if (normalized === "draft" || normalized === "مسودة") {
    return "مسودة";
  }

  return (getFirstText(value) as InvoiceStatus) || "مسودة";
};

const parseInvoiceNumber = (value: string) => {
  const match = value.match(/(\d{1,})/g);
  if (!match) return 0;
  const joined = match.join("");
  const parsed = Number.parseInt(joined, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeInvoice = (input: unknown, index: number): Invoice => {
  const record = asRecord(input) || {};
  const clientRecord = asRecord(record.client) || asRecord(record.customer) || {};
  const itemsCount = Array.isArray(record.items)
    ? record.items.length
    : Array.isArray(record.products)
      ? record.products.length
      : 0;

  const id =
    getFirstId(
      record.id,
      record.invoice_id,
      record.invoiceNumber,
      record.invoice_number,
      record.number,
      record.no,
      record.code,
      record.invoice_code
    ) || `INV-${String(index + 1).padStart(4, "0")}`;

  const total = getFirstNumber(
    record.total,
    record.total_amount,
    record.grand_total,
    record.amount,
    record.total_price
  );
  const paid = getFirstNumber(
    record.paid,
    record.paid_amount,
    record.amount_paid,
    record.payments_total,
    record.amount_received
  );
  const discount = getFirstNumber(record.discount, record.discount_amount, record.discount_value);

  const computedDue = Math.max(0, total - paid);
  const due = getFirstNumber(
    record.due,
    record.due_amount,
    record.balance,
    record.remaining_amount,
    record.amount_due,
    computedDue
  );

  const num = Math.floor(
    getFirstNumber(
      record.num,
      record.sequence,
      record.invoice_no,
      record.invoice_number,
      record.number,
      record.no,
      parseInvoiceNumber(id),
      index + 1
    )
  );

  return {
    id,
    backendId: getFirstText(record.backendId, record.backend_id),
    num: num || index + 1,
    products: Math.floor(
      getFirstNumber(
        record.products,
        record.items_count,
        record.products_count,
        record.lines_count,
        itemsCount
      )
    ),
    total,
    paid,
    discount,
    due: due < 0 ? 0 : due,
    currency: getFirstText(record.currency, record.currency_code, "OMR"),
    status: normalizeStatus(record.status ?? record.payment_status ?? record.state),
    date: getFirstText(record.date, record.issue_date, record.invoice_date, record.created_at, "-"),
    dueDate: getFirstText(record.dueDate, record.due_date, record.payment_due, record.due_on, "-"),
    client: getFirstText(
      record.client,
      record.client_name,
      record.customer_name,
      record.clientName,
      record.customer,
      clientRecord.name,
      "-"
    ),
  };
};

const normalizeInvoiceItems = (input: unknown): InvoiceLineItemPayload[] => {
  const rawItems = getFirstArray(
    input,
    asRecord(input)?.items,
    asRecord(input)?.line_items,
    asRecord(input)?.lines,
    asRecord(input)?.products
  );

  return rawItems
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }

      const itemType =
        getFirstText(record.itemType, record.item_type).toLowerCase() === "product"
          ? "product"
          : "service";
      const productId = getFirstNumber(record.productId, record.product_id);
      const discountType =
        getFirstText(record.discountType, record.discount_type).toLowerCase() === "amount"
          ? "amount"
          : "percent";

      return {
        itemType,
        ...(itemType === "product" && Number.isFinite(productId) && productId > 0
          ? { productId: Math.trunc(productId) }
          : {}),
        name: getFirstText(
          record.name,
          record.item_name,
          record.title,
          record.description,
          asRecord(record.product)?.name
        ),
        price: Math.max(0, getFirstNumber(record.price, record.unit_price, record.rate)),
        quantity: Math.max(1, Math.trunc(getFirstNumber(record.quantity, record.qty, 1))),
        discountType,
        discountValue: Math.max(
          0,
          getFirstNumber(record.discountValue, record.discount_value, record.discount)
        ),
        taxRate: Math.max(0, getFirstNumber(record.taxRate, record.tax_rate, record.tax)),
      };
    })
    .filter((item): item is InvoiceLineItemPayload => item !== null && item.name.trim().length > 0);
};

const normalizeInvoiceRecord = (input: unknown, index: number): InvoiceRecord => {
  const summary = normalizeInvoice(input, index);
  const record = asRecord(input) || {};
  const clientRecord = asRecord(record.client) || asRecord(record.customer) || {};
  const totalsRecord = asRecord(record.totals) || asRecord(record.summary) || {};
  const items = normalizeInvoiceItems(input);
  const subtotalFromItems = items.reduce(
    (total, item) => total + Math.max(0, item.price) * Math.max(1, item.quantity),
    0
  );

  return {
    ...summary,
    paymentMethod: normalizePaymentMethod(record.payment_method ?? record.paymentMethod, summary.dueDate),
    clientId: Math.trunc(
      getFirstNumber(record.clientId, record.client_id, clientRecord.id, clientRecord.client_id)
    ) || null,
    clientEmail: getFirstText(
      record.clientEmail,
      record.client_email,
      clientRecord.email,
      clientRecord.client_email
    ),
    clientPhone: getFirstText(
      record.clientPhone,
      record.client_phone,
      clientRecord.phone,
      clientRecord.phone_number
    ),
    clientAddress: getFirstText(
      record.clientAddress,
      record.client_address,
      clientRecord.address,
      clientRecord.address_line
    ),
    notes: getFirstText(record.notes, record.internal_notes, record.comment),
    subtotal: getFirstNumber(
      record.subtotal,
      totalsRecord.subtotal,
      record.sub_total,
      subtotalFromItems
    ),
    tax: getFirstNumber(record.tax, totalsRecord.tax, record.tax_amount),
    items,
  };
};

const toInvoiceSummary = (invoice: InvoiceRecord): Invoice => ({
  id: invoice.id,
  backendId: invoice.backendId,
  num: invoice.num,
  products: invoice.products,
  total: invoice.total,
  paid: invoice.paid,
  discount: invoice.discount,
  due: invoice.due,
  currency: invoice.currency,
  status: invoice.status,
  date: invoice.date,
  dueDate: invoice.dueDate,
  client: invoice.client,
});

const toInvoiceDetails = (invoice: InvoiceRecord): InvoiceDetails => ({
  id: invoice.id,
  backendId: invoice.backendId,
  num: invoice.num,
  issueDate: invoice.date,
  dueDate: invoice.dueDate === "-" ? "" : invoice.dueDate,
  status: invoice.status,
  currency: invoice.currency,
  paymentMethod: invoice.paymentMethod,
  clientId: invoice.clientId,
  clientName: invoice.client,
  clientEmail: invoice.clientEmail,
  clientPhone: invoice.clientPhone,
  clientAddress: invoice.clientAddress,
  notes: invoice.notes,
  paidAmount: invoice.paid,
  totals: {
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
    due: invoice.due,
  },
  items: invoice.items,
});

const toClientLedgerEntry = (invoice: InvoiceRecord): ClientInvoiceLedgerEntry => ({
  id: invoice.id,
  num: invoice.num,
  clientId: invoice.clientId,
  clientName: invoice.client,
  products: invoice.products,
  total: invoice.total,
  paid: invoice.paid,
  discount: invoice.discount,
  due: invoice.due,
  currency: invoice.currency,
  status: String(invoice.status),
  date: invoice.date,
  dueDate: invoice.dueDate,
});

const extractCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.data, record.invoices, record.items, record.results];

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

const buildRequestBody = (payload: CreateInvoicePayload) => {
  return {
    invoiceNumber: payload.invoiceNumber,
    invoice_number: payload.invoiceNumber,
    number: payload.invoiceNumber,
    issueDate: payload.issueDate,
    issue_date: payload.issueDate,
    date: payload.issueDate,
    dueDate: payload.dueDate,
    due_date: payload.dueDate,
    status: payload.status,
    payment_status: payload.status,
    currency: payload.currency,
    paymentMethod: payload.paymentMethod,
    payment_method: payload.paymentMethod,
    clientId: payload.clientId,
    client_id: payload.clientId,
    clientName: payload.clientName,
    client_name: payload.clientName,
    clientEmail: payload.clientEmail,
    client_email: payload.clientEmail,
    clientPhone: payload.clientPhone,
    client_phone: payload.clientPhone,
    clientAddress: payload.clientAddress,
    client_address: payload.clientAddress,
    notes: payload.notes,
    paidAmount: payload.paidAmount,
    paid_amount: payload.paidAmount,
    totals: {
      subtotal: payload.totals.subtotal,
      discount: payload.totals.discount,
      tax: payload.totals.tax,
      total: payload.totals.total,
    },
    subtotal: payload.totals.subtotal,
    discount: payload.totals.discount,
    tax: payload.totals.tax,
    total: payload.totals.total,
    items: payload.items,
    line_items: payload.items,
  };
};

const isLegacySeedInvoice = (invoice: InvoiceRecord) => {
  return (
    (invoice.id === "INV-0001" &&
      invoice.total === 240 &&
      invoice.paid === 240 &&
      invoice.client === "شركة المدار" &&
      invoice.date === "2026-02-20") ||
    (invoice.id === "INV-0002" &&
      invoice.total === 180 &&
      invoice.paid === 0 &&
      invoice.client === "شركة المدار" &&
      invoice.date === "2026-03-01") ||
    (invoice.id === "INV-0003" &&
      invoice.total === 560 &&
      invoice.paid === 560 &&
      invoice.client === "مؤسسة النور" &&
      invoice.date === "2026-02-16")
  );
};

const defaultInvoiceRecords = defaultInvoices.map((invoice, index) =>
  normalizeInvoiceRecord(invoice, index)
);

const getInvoiceKey = (invoice: InvoiceRecord | Invoice) => invoice.id.trim().toLowerCase();

const loadLocalInvoices = () => {
  const invoices = loadStoredValue(INVOICES_STORAGE_KEY, defaultInvoiceRecords, (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return defaultInvoiceRecords;
    }

    return value.map((invoice, index) => normalizeInvoiceRecord(invoice, index));
  });

  const filteredInvoices = invoices.filter((invoice) => !isLegacySeedInvoice(invoice));

  if (filteredInvoices.length !== invoices.length) {
    saveStoredValue(INVOICES_STORAGE_KEY, filteredInvoices);
  }

  return filteredInvoices;
};

const saveLocalInvoices = (invoices: InvoiceRecord[]) => {
  saveStoredValue(INVOICES_STORAGE_KEY, invoices);
};

const persistInvoice = (invoice: InvoiceRecord) => {
  const invoices = loadLocalInvoices();
  saveLocalInvoices(upsertByKey(invoices, invoice, getInvoiceKey));
};

const removeLocalInvoice = (invoiceId: string) => {
  const invoices = loadLocalInvoices();
  const removedInvoice = invoices.find((entry) => entry.id === invoiceId) ?? null;
  saveLocalInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
  return removedInvoice;
};

const buildLocalInvoiceFromPayload = (
  payload: CreateInvoicePayload,
  fallbackId: string,
  backendId?: string
) => {
  const total = Math.max(0, payload.totals.total);
  const paid = Math.max(0, payload.paidAmount);
  const discount = Math.max(0, payload.totals.discount);
  const due = Math.max(0, total - paid);

  return normalizeInvoiceRecord(
    {
      id: fallbackId,
      backend_id: backendId,
      invoice_number: fallbackId,
      num: parseInvoiceNumber(fallbackId),
      products: payload.items.length,
      subtotal: payload.totals.subtotal,
      total,
      paid,
      discount,
      tax: payload.totals.tax,
      due,
      currency: payload.currency || "OMR",
      status: payload.status,
      payment_method: payload.paymentMethod,
      date: payload.issueDate,
      due_date: payload.dueDate || "-",
      client_id: payload.clientId,
      client_name: payload.clientName,
      client_email: payload.clientEmail,
      client_phone: payload.clientPhone,
      client_address: payload.clientAddress,
      notes: payload.notes,
      items: payload.items,
      line_items: payload.items,
    },
    0
  );
};

const createLocalInvoice = (payload: CreateInvoicePayload) => {
  const invoices = loadLocalInvoices();
  const fallbackId =
    payload.invoiceNumber || `INV-${String(invoices.length + 1).padStart(4, "0")}`;
  const createdInvoice = buildLocalInvoiceFromPayload(payload, fallbackId);

  saveLocalInvoices(upsertByKey(invoices, createdInvoice, getInvoiceKey));
  syncLocalClientInvoice(toClientLedgerEntry(createdInvoice));
  return createdInvoice;
};

const updateLocalInvoice = (invoiceId: string, payload: CreateInvoicePayload) => {
  const invoices = loadLocalInvoices();
  const existingInvoice = invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  const nextInvoice = buildLocalInvoiceFromPayload(
    payload,
    invoiceId,
    existingInvoice?.backendId
  );

  if (!existingInvoice) {
    saveLocalInvoices(upsertByKey(invoices, nextInvoice, getInvoiceKey));
    syncLocalClientInvoice(toClientLedgerEntry(nextInvoice));
    return nextInvoice;
  }

  saveLocalInvoices(invoices.map((invoice) => (invoice.id === invoiceId ? nextInvoice : invoice)));
  syncLocalClientInvoice(toClientLedgerEntry(nextInvoice), toClientLedgerEntry(existingInvoice));
  return nextInvoice;
};

export const listInvoices = async () => {
  const localInvoices = loadLocalInvoices();

  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>("/api/invoices", {
      ...(token ? { token } : {}),
    });
    const remoteInvoices = extractCollection(payload).map((invoice, index) =>
      normalizeInvoiceRecord(invoice, index)
    );
    const mergedInvoices = mergeUniqueByKey(localInvoices, remoteInvoices, getInvoiceKey);
    saveLocalInvoices(mergedInvoices);
    return mergedInvoices.map(toInvoiceSummary);
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return localInvoices.map(toInvoiceSummary);
    }

    throw error;
  }
};

export const getInvoiceDetails = async (invoiceId: string) => {
  const findLocalInvoice = () =>
    loadLocalInvoices().find((invoice) => invoice.id === invoiceId) ?? null;

  const localInvoice = findLocalInvoice();
  if (localInvoice?.items.length) {
    return toInvoiceDetails(localInvoice);
  }

  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>(`/api/invoices/${encodeURIComponent(invoiceId)}`, {
      ...(token ? { token } : {}),
    });
    const record = asRecord(payload);
    const remoteInvoice = normalizeInvoiceRecord(record?.data || record?.invoice || payload, 0);
    persistInvoice(remoteInvoice);
    return toInvoiceDetails(remoteInvoice);
  } catch (error) {
    if (
      isRecoverableApiError(error) ||
      (error instanceof ApiError && (error.status === 404 || error.status === 405))
    ) {
      return localInvoice ? toInvoiceDetails(localInvoice) : null;
    }

    throw error;
  }
};

export const createInvoice = async (payload: CreateInvoicePayload) => {
  const invoices = loadLocalInvoices();
  const fallbackSequence = getNextNumericId(invoices, (item) => item.num);
  const invoiceId =
    payload.invoiceNumber.trim() ||
    `INV-${String(fallbackSequence).padStart(4, "0")}`;
  const requestBody = JSON.stringify(buildRequestBody(payload));

  const existingInvoice = invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  const token = getStoredAuthToken();

  if (existingInvoice) {
    try {
      const response = await apiRequest<unknown>(
        `/api/invoices/${encodeURIComponent(invoiceId)}`,
        {
          method: "PUT",
          ...(token ? { token } : {}),
          body: requestBody,
        }
      );
      const record = asRecord(response);
      const remoteInvoice = normalizeInvoiceRecord(record?.data || record?.invoice || response, 0);
      const updatedInvoice = buildLocalInvoiceFromPayload(
        payload,
        remoteInvoice.id || invoiceId,
        remoteInvoice.backendId || existingInvoice.backendId
      );

      persistInvoice(updatedInvoice);
      syncLocalClientInvoice(
        toClientLedgerEntry(updatedInvoice),
        toClientLedgerEntry(existingInvoice)
      );
      return toInvoiceSummary(updatedInvoice);
    } catch (error) {
      if (
        isRecoverableApiError(error) ||
        (error instanceof ApiError && (error.status === 404 || error.status === 405))
      ) {
        return toInvoiceSummary(updateLocalInvoice(invoiceId, payload));
      }

      throw error;
    }
  }

  try {
    const response = await apiRequest<unknown>("/api/invoices", {
      method: "POST",
      ...(token ? { token } : {}),
      body: requestBody,
    });
    const record = asRecord(response);
    const remoteInvoice = normalizeInvoiceRecord(record?.data || record?.invoice || response, 0);
    const createdInvoice = buildLocalInvoiceFromPayload(
      payload,
      remoteInvoice.id || invoiceId,
      remoteInvoice.backendId
    );

    persistInvoice(createdInvoice);
    syncLocalClientInvoice(toClientLedgerEntry(createdInvoice));
    return toInvoiceSummary(createdInvoice);
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return toInvoiceSummary(createLocalInvoice(payload));
    }

    throw error;
  }
};

export const deleteInvoice = async (invoice: Invoice) => {
  const invoiceId = invoice.backendId || invoice.id;
  const localInvoice = loadLocalInvoices().find((entry) => entry.id === invoice.id) ?? null;

  try {
    const token = getStoredAuthToken();
    await apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
    const removedInvoice = removeLocalInvoice(invoice.id);
    syncLocalClientInvoice(null, toClientLedgerEntry(removedInvoice || localInvoice || normalizeInvoiceRecord(invoice, 0)));
  } catch (error) {
    if (
      isRecoverableApiError(error) ||
      (error instanceof ApiError && (error.status === 404 || error.status === 405))
    ) {
      const removedInvoice = removeLocalInvoice(invoice.id);
      syncLocalClientInvoice(null, toClientLedgerEntry(removedInvoice || localInvoice || normalizeInvoiceRecord(invoice, 0)));
      return;
    }

    throw error;
  }
};

