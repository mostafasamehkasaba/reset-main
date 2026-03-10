import { AlertTriangle, CreditCard, Percent, ReceiptText } from "lucide-react";
import {
  invoiceEditorStatusAccent,
  invoiceEditorStatusLabels,
  invoiceEditorStatusOptions,
  type InvoiceEditorStatus,
  type InvoiceEditorTotals,
} from "@/lib/invoice/invoiceTypes";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${moneyFormatter.format(value)} ${currency}`;

type InvoiceTotalsProps = {
  totals: InvoiceEditorTotals;
  currency: string;
  taxRate: number;
  discount: number;
  status: InvoiceEditorStatus;
  partialPaidAmount: number;
  errors: {
    payment?: string;
    discount?: string;
    creditLimit?: string;
  };
  clientCredit: {
    creditLimit: number;
    currentDue: number;
    projectedDue: number;
    remainingCredit: number;
    exceeded: boolean;
    currency: string;
  };
  onChange: (field: "taxRate" | "discount" | "status" | "partialPaidAmount", value: string) => void;
};

function SummaryRow({
  label,
  value,
  strong = false,
  inverted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span
        className={
          inverted
            ? strong
              ? "text-sm font-semibold text-white"
              : "text-sm text-slate-300"
            : strong
              ? "text-sm font-semibold text-slate-900"
              : "text-sm text-slate-500"
        }
      >
        {label}
      </span>
      <span
        className={
          inverted
            ? strong
              ? "text-base font-semibold text-white"
              : "text-sm font-medium text-white"
            : strong
              ? "text-base font-semibold text-slate-950"
              : "text-sm font-medium text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function InvoiceTotals({
  totals,
  currency,
  taxRate,
  discount,
  status,
  partialPaidAmount,
  errors,
  clientCredit,
  onChange,
}: InvoiceTotalsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-sky-700">
              التحصيل
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatMoney(totals.due, currency)}
            </h3>
            <p className="mt-2 text-sm text-slate-500">المبلغ المتبقي للتحصيل بعد الضريبة والخصم.</p>
          </div>

          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${invoiceEditorStatusAccent[status]}`}
          >
            {invoiceEditorStatusLabels[status]}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Percent className="h-4 w-4 text-slate-400" />
              نسبة الضريبة
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxRate}
              onChange={(event) => onChange("taxRate", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <ReceiptText className="h-4 w-4 text-slate-400" />
              الخصم
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(event) => onChange("discount", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </label>
        </div>

        {errors.discount ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errors.discount}
          </div>
        ) : null}

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">الإجمالي النهائي</span>
            <span className="text-3xl font-semibold">{formatMoney(totals.total, currency)}</span>
          </div>

          <div className="mt-4 divide-y divide-white/10">
            <SummaryRow
              label="الإجمالي الفرعي"
              value={formatMoney(totals.subtotal, currency)}
              inverted
            />
            <SummaryRow label="الضريبة" value={formatMoney(totals.tax, currency)} inverted />
            <SummaryRow label="الخصم" value={formatMoney(totals.discount, currency)} inverted />
            <SummaryRow label="المدفوع" value={formatMoney(totals.paid, currency)} inverted />
            <SummaryRow
              label="المتبقي"
              value={formatMoney(totals.due, currency)}
              strong
              inverted
            />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.35)]">
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CreditCard className="h-4 w-4 text-slate-400" />
              حالة التحصيل
            </span>
            <select
              value={status}
              onChange={(event) => onChange("status", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              {invoiceEditorStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {status === "partial" ? (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">المبلغ المحصل الآن</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={partialPaidAmount}
                onChange={(event) => onChange("partialPaidAmount", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </label>
          ) : null}

          {errors.payment ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errors.payment}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`rounded-[28px] border p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.25)] ${
          clientCredit.exceeded
            ? "border-rose-200 bg-rose-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-2xl p-2 ${
              clientCredit.exceeded ? "bg-rose-100 text-rose-700" : "bg-sky-50 text-sky-700"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">ملخص الحد الائتماني</p>
            <p className="mt-1 text-sm text-slate-500">
              يفيد قبل إصدار فاتورة آجلة أو غير مدفوعة.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs tracking-[0.18em] text-slate-400">الحد الائتماني</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatMoney(clientCredit.creditLimit, clientCredit.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs tracking-[0.18em] text-slate-400">المستحق المتوقع</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatMoney(clientCredit.projectedDue, clientCredit.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs tracking-[0.18em] text-slate-400">المستحق الحالي</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatMoney(clientCredit.currentDue, clientCredit.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs tracking-[0.18em] text-slate-400">المتاح</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatMoney(clientCredit.remainingCredit, clientCredit.currency)}
            </p>
          </div>
        </div>

        {errors.creditLimit ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errors.creditLimit}
          </div>
        ) : null}
      </div>
    </div>
  );
}
