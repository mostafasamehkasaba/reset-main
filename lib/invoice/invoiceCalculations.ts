import type {
  InvoiceEditorItem,
  InvoiceEditorStatus,
  InvoiceEditorTotals,
} from "./invoiceTypes";

const sanitizeFiniteNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
};

export const roundCurrency = (value: number) =>
  Math.round(sanitizeFiniteNumber(value) * 100) / 100;

export const clampAmount = (value: number) => roundCurrency(Math.max(0, sanitizeFiniteNumber(value)));

export const clampQuantity = (value: number) =>
  Math.max(0, Math.trunc(sanitizeFiniteNumber(value)));

export const calculateInvoiceRowTotal = (item: Pick<InvoiceEditorItem, "price" | "quantity">) => {
  const price = clampAmount(item.price);
  const quantity = clampQuantity(item.quantity);
  return roundCurrency(price * quantity);
};

export const calculateInvoiceSubtotal = (items: Array<Pick<InvoiceEditorItem, "price" | "quantity">>) =>
  roundCurrency(items.reduce((total, item) => total + calculateInvoiceRowTotal(item), 0));

export const calculateInvoiceTax = (subtotal: number, taxRate: number) =>
  roundCurrency(clampAmount(subtotal) * (clampAmount(taxRate) / 100));

export const calculateInvoiceDiscount = (
  subtotal: number,
  tax: number,
  discount: number
) => {
  const available = roundCurrency(clampAmount(subtotal) + clampAmount(tax));
  return roundCurrency(Math.min(available, clampAmount(discount)));
};

export const calculateInvoicePaidAmount = (
  status: InvoiceEditorStatus,
  total: number,
  partialPaidAmount: number
) => {
  const safeTotal = clampAmount(total);

  if (status === "paid") {
    return safeTotal;
  }

  if (status === "partial") {
    return roundCurrency(Math.min(safeTotal, clampAmount(partialPaidAmount)));
  }

  return 0;
};

export const calculateInvoiceTotals = ({
  items,
  taxRate,
  discount,
  status,
  partialPaidAmount,
}: {
  items: InvoiceEditorItem[];
  taxRate: number;
  discount: number;
  status: InvoiceEditorStatus;
  partialPaidAmount: number;
}): InvoiceEditorTotals => {
  const subtotal = calculateInvoiceSubtotal(items);
  const tax = calculateInvoiceTax(subtotal, taxRate);
  const safeDiscount = calculateInvoiceDiscount(subtotal, tax, discount);
  const total = roundCurrency(Math.max(0, subtotal + tax - safeDiscount));
  const paid = calculateInvoicePaidAmount(status, total, partialPaidAmount);
  const due = roundCurrency(Math.max(0, total - paid));

  return {
    subtotal,
    tax,
    discount: safeDiscount,
    total,
    paid,
    due,
    itemCount: items.length,
  };
};

export const deriveTaxRateFromTotals = (subtotal: number, tax: number) => {
  const safeSubtotal = clampAmount(subtotal);
  if (safeSubtotal === 0) {
    return 0;
  }

  return roundCurrency((clampAmount(tax) / safeSubtotal) * 100);
};
