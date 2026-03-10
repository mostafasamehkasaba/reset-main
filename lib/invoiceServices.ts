import {
  createInvoice,
  getInvoiceDetails,
  listInvoices,
  type CreateInvoicePayload,
} from "@/app/services/invoices";
import type { Invoice } from "@/app/types";
import { buildInvoiceTableItem } from "./invoiceCalculations";
import type { InvoicePaymentMethodValue, InvoiceTableItem } from "./invoiceTypes";

const resolveNextPaymentStatus = (
  rawStatus: string,
  nextPaidAmount: number,
  totalAmount: number
): CreateInvoicePayload["status"] => {
  if (rawStatus === "ملغاة") {
    return "cancelled";
  }

  if (rawStatus === "مسودة" && nextPaidAmount <= 0) {
    return "draft";
  }

  if (nextPaidAmount >= totalAmount && totalAmount > 0) {
    return "paid";
  }

  if (nextPaidAmount > 0) {
    return "partial";
  }

  return "unpaid";
};

export const listInvoiceTableItems = async () => {
  const invoices = await listInvoices();
  return invoices.map(buildInvoiceTableItem);
};

export const recordInvoicePayment = async ({
  invoiceId,
  amount,
  paymentMethod,
}: {
  invoiceId: string;
  amount: number;
  paymentMethod: InvoicePaymentMethodValue;
}) => {
  const details = await getInvoiceDetails(invoiceId);

  if (!details) {
    throw new Error("تعذر العثور على الفاتورة المطلوبة.");
  }

  const safeTotal = Math.max(0, details.totals.total);
  const safeAmount = Math.max(0, amount);
  const nextPaidAmount = Math.min(safeTotal, Math.max(0, details.paidAmount + safeAmount));

  const payload: CreateInvoicePayload = {
    invoiceNumber: details.id,
    issueDate: details.issueDate,
    ...(details.dueDate && details.dueDate !== "-" ? { dueDate: details.dueDate } : {}),
    status: resolveNextPaymentStatus(details.status, nextPaidAmount, safeTotal),
    currency: details.currency || "OMR",
    paymentMethod,
    clientId: Math.max(0, details.clientId ?? 0),
    clientName: details.clientName || "عميل غير محدد",
    clientEmail: details.clientEmail || "",
    clientPhone: details.clientPhone || "",
    clientAddress: details.clientAddress || "",
    notes: details.notes || "",
    paidAmount: nextPaidAmount,
    totals: {
      subtotal: details.totals.subtotal,
      discount: details.totals.discount,
      tax: details.totals.tax,
      total: safeTotal,
    },
    items: details.items,
  };

  const savedInvoice = await createInvoice(payload);
  return buildInvoiceTableItem(savedInvoice as Invoice);
};
