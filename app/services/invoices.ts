import { getStoredAuthToken } from "../lib/auth-session";
import { apiRequest } from "../lib/fetcher";
import type { Invoice } from "../types";

export type InvoiceLinePayload = {
  itemType: "product" | "service";
  productId: number | null;
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
  status: string;
  currency: string;
  paymentMethod?: string;
  clientId?: number | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  notes?: string;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  items: InvoiceLinePayload[];
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

const normalizeInvoice = (input: unknown, index: number): Invoice => {
  const record = asRecord(input) || {};
  const total = getFirstNumber(record.total, record.total_amount, record.grand_total);
  const paid = getFirstNumber(record.paid, record.paid_amount, record.amount_paid);
  const discount = getFirstNumber(record.discount, record.discount_amount);
  const due = getFirstNumber(record.due, record.due_amount, record.remaining_amount, total - paid);

  return {
    id: getFirstText(
      record.id,
      record.invoice_number,
      record.number,
      `INV-${String(index + 1).padStart(4, "0")}`
    ),
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

const requireToken = () => {
  const token = getStoredAuthToken();
  if (!token) {
    throw new Error("الجلسة غير متاحة. سجل الدخول أولًا.");
  }

  return token;
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
  const items = payload.items.map((item) => {
    const totals = calculateLineTotals(item);

    return {
      item_type: item.itemType,
      itemType: item.itemType,
      product_id: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.price,
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
  });

  return {
    invoice_number: payload.invoiceNumber,
    number: payload.invoiceNumber,
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
    discount: payload.totals.discount,
    discount_amount: payload.totals.discount,
    tax: payload.totals.tax,
    tax_amount: payload.totals.tax,
    items,
    line_items: items,
  };
};

export const listInvoices = async () => {
  const payload = await apiRequest<unknown>("/api/invoices", {
    token: requireToken(),
  });

  return extractCollection(payload).map((invoice, index) => normalizeInvoice(invoice, index));
};

export const createInvoice = async (payload: CreateInvoicePayload) => {
  const response = await apiRequest<unknown>("/api/invoices", {
    method: "POST",
    token: requireToken(),
    body: JSON.stringify(buildInvoiceBody(payload)),
  });

  const record = asRecord(response);
  return normalizeInvoice(record?.data || record?.invoice || response, 0);
};

export const deleteInvoice = async (invoiceId: string) => {
  await apiRequest(`/api/invoices/${invoiceId}`, {
    method: "DELETE",
    token: requireToken(),
  });
};
