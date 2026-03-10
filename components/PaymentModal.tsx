"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import {
  invoicePaymentMethodOptions,
  type InvoicePaymentMethodValue,
  type InvoiceTableItem,
} from "@/lib/invoiceTypes";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${currencyFormatter.format(value)} ${currency}`;

export default function PaymentModal({
  open,
  invoice,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  invoice: InvoiceTableItem | null;
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    paymentMethod: InvoicePaymentMethodValue;
  }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethodValue>("cash");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!open || !invoice) {
      setAmount("");
      setPaymentMethod("cash");
      setValidationMessage("");
      return;
    }

    setAmount(invoice.due > 0 ? String(invoice.due) : "");
    setPaymentMethod("cash");
    setValidationMessage("");
  }, [invoice, open]);

  if (!open || !invoice) {
    return null;
  }

  const handleSubmit = () => {
    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationMessage("أدخل مبلغ دفع صالحًا.");
      return;
    }

    if (parsedAmount > invoice.due) {
      setValidationMessage("المبلغ لا يمكن أن يتجاوز الرصيد المستحق.");
      return;
    }

    setValidationMessage("");
    onSubmit({
      amount: parsedAmount,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.4)]" dir="rtl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Payment
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">تسجيل دفعة</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              حدّث تحصيل الفاتورة مباشرة من نفس الجدول.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">رقم الفاتورة</span>
            <span className="font-semibold text-slate-950">{invoice.id}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">العميل</span>
            <span className="font-medium text-slate-900">{invoice.customer}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">المتبقي</span>
            <span className="font-semibold text-amber-700">
              {formatMoney(invoice.due, invoice.currency)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-right">
            <span className="mb-2 block text-sm font-semibold text-slate-700">مبلغ الدفع</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setValidationMessage("");
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
            />
          </label>

          <label className="block text-right">
            <span className="mb-2 block text-sm font-semibold text-slate-700">طريقة الدفع</span>
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as InvoicePaymentMethodValue)
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
            >
              {invoicePaymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {validationMessage ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {validationMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            <span>{isSubmitting ? "جارٍ الحفظ..." : "تأكيد الدفع"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
