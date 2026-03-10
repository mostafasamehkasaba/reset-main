import type { Invoice } from "@/app/types";
import {
  invoiceStatusLabels,
  type InvoiceLifecycleStatus,
  type InvoiceTableItem,
} from "./invoiceTypes";

export {
  calculateInvoiceDiscount,
  calculateInvoicePaidAmount,
  calculateInvoiceRowTotal,
  calculateInvoiceSubtotal,
  calculateInvoiceTax,
  calculateInvoiceTotals,
  deriveTaxRateFromTotals,
  roundCurrency,
} from "./invoice/invoiceCalculations";

export const parseInvoiceDate = (value: string) => {
  const normalized = value.trim();
  if (!normalized || normalized === "-") {
    return null;
  }

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = normalized.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getCollectedAmount = (invoice: Invoice) => {
  if (invoice.paid > 0) {
    return invoice.paid;
  }

  if (invoice.status === "مدفوعة") {
    return invoice.total;
  }

  return 0;
};

export const getInvoiceLifecycleStatus = (invoice: Invoice): InvoiceLifecycleStatus => {
  if (invoice.status === "ملغاة") {
    return "cancelled";
  }

  if (invoice.status === "مسودة") {
    return "draft";
  }

  if (getCollectedAmount(invoice) >= invoice.total && invoice.total > 0) {
    return "paid";
  }

  const dueDate = parseInvoiceDate(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    dueDate &&
    invoice.due > 0 &&
    dueDate.getTime() < today.getTime() &&
    invoice.status !== "مدفوعة"
  ) {
    return "overdue";
  }

  return "sent";
};

export const buildInvoiceTableItem = (invoice: Invoice): InvoiceTableItem => ({
  id: invoice.id,
  number: invoice.num,
  customer: invoice.client || "غير محدد",
  products: invoice.products,
  total: invoice.total,
  paid: invoice.paid,
  due: invoice.due,
  currency: invoice.currency || "OMR",
  issueDate: invoice.date || "-",
  dueDate: invoice.dueDate || "-",
  rawStatus: invoice.status,
  lifecycleStatus: getInvoiceLifecycleStatus(invoice),
});

export const formatInvoiceStatus = (status: InvoiceLifecycleStatus) => invoiceStatusLabels[status];
