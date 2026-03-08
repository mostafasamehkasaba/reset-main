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
import type { Invoice } from "../types";

export type InvoiceLinePayload = {
  itemType: "product" | "service";
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  discountType: "percent" | "amount";
  discountValue: number;
  taxRate: number;
};

export type InvoicePaymentStatus = "draft" | "paid" | "unpaid" | "partial" | "cancelled";

export type CreateInvoicePayload = {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: string;
  currency: string;
  paymentMethod?: string;
  clientId?: number | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  notes?: string;
  paidAmount?: number;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  items: InvoiceLinePayload[];
};

const INVOICES_STORAGE_KEY = "reset-main-invoices-v1";

const defaultInvoices: Invoice[] = [
  {
    id: "INV-0001",
    num: 1,
    products: 2,
    total: 240,
    paid: 240,
    discount: 0,
    due: 0,
    currency: "OMR",
    status: "مدفوعة",
    date: "2026-02-20",
    dueDate: "2026-02-20",
    client: "شركة المدار",
  },
  {
    id: "INV-0002",
    num: 2,
    products: 1,
    total: 180,
    paid: 0,
    discount: 0,
    due: 180,
    currency: "OMR",
    status: "غير مدفوعة",
    date: "2026-03-01",
    dueDate: "2026-03-08",
    client: "شركة المدار",
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

const getFirstIdentifier = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const normalizeStatus = (value: unknown) => {
  const normalized = getFirstText(value).toLowerCase();

  if (!normalized || normalized === "draft") return "مسودة";
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

const normalizeInvoice = (input: unknown, index: number): Invoice => {
  const record = asRecord(input) || {};
  const total = getFirstNumber(record.total, record.total_amount, record.grand_total);
  const paid = getFirstNumber(record.paid, record.paid_amount, record.amount_paid);
  const discount = getFirstNumber(record.discount, record.discount_amount);
  const due = getFirstNumber(record.due, record.due_amount, record.remaining_amount, total - paid);

  return {
    id: getFirstText(
      record.invoice_number,
      record.number,
      record.id,
      `INV-${String(index + 1).padStart(4, "0")}`
    ),
    backendId: getFirstIdentifier(record.id, record.invoice_id),
    num: Math.floor(getFirstNumber(record.num, record.sequence, record.id, index + 1)),
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
    client: getFirstText(
      getFirstText(record.client_name),
      getFirstText(asRecord(record.client)?.name),
      getFirstText(asRecord(record.customer)?.name),
      "-"
    ),
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

const calculateLineTotals = (item: InvoiceLinePayload) => {
  const safePrice = Math.max(0, item.price);
  const safeQuantity = Math.max(1, item.quantity);
  const base = safePrice * safeQuantity;
  const rawDiscount =
    item.discountType === "percent"
      ? (base * Math.max(0, item.discountValue)) / 100
      : Math.max(0, item.discountValue);
  const discount = Math.min(base, rawDiscount);
  const taxable = Math.max(0, base - discount);
  const tax = (taxable * Math.max(0, item.taxRate)) / 100;

  return {
    base,
    discount,
    tax,
    total: taxable + tax,
  };
};

const buildInvoiceBody = (payload: CreateInvoicePayload) => {
  const paidAmount = Math.max(0, Math.min(payload.paidAmount ?? 0, payload.totals.total));
  const dueAmount = Math.max(0, payload.totals.total - paidAmount);
  const items = payload.items.map((item) => {
    const totals = calculateLineTotals(item);

    const baseItem = {
      item_type: item.itemType,
      itemType: item.itemType,
      name: item.name,
      product_name: item.name,
      price: item.price,
      unit_price: item.price,
      unitPrice: item.price,
      quantity: item.quantity,
      discount_type: item.discountType,
      discountType: item.discountType,
      discount_value: item.discountValue,
      discountValue: item.discountValue,
      tax_rate: item.taxRate,
      taxRate: item.taxRate,
      base: totals.base,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
    };

    if (item.itemType === "product" && typeof item.productId === "number") {
      return {
        ...baseItem,
        product_id: item.productId,
        productId: item.productId,
      };
    }

    return baseItem;
  });

  return {
    invoice_number: payload.invoiceNumber,
    number: payload.invoiceNumber,
    date: payload.issueDate,
    issue_date: payload.issueDate,
    due_date: payload.dueDate,
    status: payload.status,
    payment_status: payload.status,
    currency: payload.currency,
    currency_code: payload.currency,
    payment_method: payload.paymentMethod,
    client_id: payload.clientId,
    clientId: payload.clientId,
    client_name: payload.clientName,
    clientName: payload.clientName,
    client_email: payload.clientEmail,
    clientEmail: payload.clientEmail,
    client_phone: payload.clientPhone,
    clientPhone: payload.clientPhone,
    client_address: payload.clientAddress,
    clientAddress: payload.clientAddress,
    notes: payload.notes,
    subtotal: payload.totals.subtotal,
    total: payload.totals.total,
    total_amount: payload.totals.total,
    paid: paidAmount,
    paid_amount: paidAmount,
    amount_paid: paidAmount,
    due: dueAmount,
    due_amount: dueAmount,
    discount: payload.totals.discount,
    discount_amount: payload.totals.discount,
    tax: payload.totals.tax,
    tax_amount: payload.totals.tax,
    tax_total: payload.totals.tax,
    items,
    line_items: items,
  };
};

const getInvoiceKey = (invoice: Invoice) => getFirstText(invoice.id, String(invoice.num));

const loadLocalInvoices = () =>
  loadStoredValue(INVOICES_STORAGE_KEY, defaultInvoices, (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return defaultInvoices;
    }

    return value.map((invoice, index) => normalizeInvoice(invoice, index));
  });

const saveLocalInvoices = (invoices: Invoice[]) => {
  saveStoredValue(INVOICES_STORAGE_KEY, invoices);
};

const persistInvoice = (invoice: Invoice) => {
  const invoices = loadLocalInvoices();
  saveLocalInvoices(upsertByKey(invoices, invoice, getInvoiceKey));
};

const createLocalInvoice = (payload: CreateInvoicePayload) => {
  const invoices = loadLocalInvoices();
  const nextInvoiceNumber = getNextNumericId(invoices, (entry) => entry.num);
  const paidAmount = Math.max(0, Math.min(payload.paidAmount ?? 0, payload.totals.total));
  const dueAmount = Math.max(0, payload.totals.total - paidAmount);
  const createdInvoice = normalizeInvoice(
    {
      id: payload.invoiceNumber || `INV-${String(nextInvoiceNumber).padStart(4, "0")}`,
      invoice_number: payload.invoiceNumber,
      number: payload.invoiceNumber,
      num: nextInvoiceNumber,
      products: payload.items.length,
      items_count: payload.items.length,
      total: payload.totals.total,
      total_amount: payload.totals.total,
      paid: paidAmount,
      paid_amount: paidAmount,
      discount: payload.totals.discount,
      discount_amount: payload.totals.discount,
      due: dueAmount,
      due_amount: dueAmount,
      currency: payload.currency,
      status: payload.status,
      payment_status: payload.status,
      date: payload.issueDate,
      issue_date: payload.issueDate,
      due_date: payload.dueDate,
      dueDate: payload.dueDate,
      client_name: payload.clientName,
    },
    invoices.length
  );

  saveLocalInvoices(upsertByKey(invoices, createdInvoice, getInvoiceKey));
  return createdInvoice;
};

const removeLocalInvoice = (invoice: Pick<Invoice, "id" | "backendId">) => {
  const invoices = loadLocalInvoices();
  const normalizedId = invoice.id.trim().toLowerCase();
  const normalizedBackendId = invoice.backendId?.trim().toLowerCase() || "";

  saveLocalInvoices(
    invoices.filter((entry) => {
      const entryId = entry.id.trim().toLowerCase();
      const entryBackendId = entry.backendId?.trim().toLowerCase() || "";

      if (normalizedId && entryId === normalizedId) {
        return false;
      }

      if (normalizedBackendId && entryBackendId === normalizedBackendId) {
        return false;
      }

      return true;
    })
  );
};

const canFallbackInvoiceDeleteError = (error: unknown) => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.status === 404 || error.status === 405) {
    return true;
  }

  return /No query results for model \[App\\Models\\Invoice\]/i.test(error.message);
};

export const listInvoices = async () => {
  const localInvoices = loadLocalInvoices();

  try {
    const token = getStoredAuthToken();
    const payload = await apiRequest<unknown>("/api/invoices", {
      ...(token ? { token } : {}),
    });
    const remoteInvoices = extractCollection(payload).map((invoice, index) =>
      normalizeInvoice(invoice, index)
    );
    const mergedInvoices = mergeUniqueByKey(localInvoices, remoteInvoices, getInvoiceKey);
    saveLocalInvoices(mergedInvoices);
    return mergedInvoices;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return localInvoices;
    }

    throw error;
  }
};

export const createInvoice = async (payload: CreateInvoicePayload) => {
  try {
    const token = getStoredAuthToken();
    const response = await apiRequest<unknown>("/api/invoices", {
      method: "POST",
      ...(token ? { token } : {}),
      body: JSON.stringify(buildInvoiceBody(payload)),
    });

    const record = asRecord(response);
    const createdInvoice = normalizeInvoice(record?.data || record?.invoice || response, 0);
    persistInvoice(createdInvoice);
    return createdInvoice;
  } catch (error) {
    if (isRecoverableApiError(error)) {
      return createLocalInvoice(payload);
    }

    throw error;
  }
};

export const deleteInvoice = async (invoice: Pick<Invoice, "id" | "backendId">) => {
  const deleteTarget = getFirstText(invoice.backendId, invoice.id);

  try {
    const token = getStoredAuthToken();
    await apiRequest(`/api/invoices/${encodeURIComponent(deleteTarget)}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
    removeLocalInvoice(invoice);
  } catch (error) {
    if (isRecoverableApiError(error) || canFallbackInvoiceDeleteError(error)) {
      removeLocalInvoice(invoice);
      return;
    }

    throw error;
  }
};
