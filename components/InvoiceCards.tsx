"use client";

import Link from "next/link";
import { CreditCard, Eye, PencilLine, Trash2 } from "lucide-react";
import { formatInvoiceStatus } from "@/lib/invoiceCalculations";
import {
  invoiceStatusStyles,
  type InvoiceTableItem,
} from "@/lib/invoiceTypes";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${currencyFormatter.format(value)} ${currency}`;

export default function InvoiceCards({
  rows,
  isLoading,
  emptyMessage,
  onDelete,
  onPay,
  showDelete = true,
  showEdit = true,
  showPay = true,
}: {
  rows: InvoiceTableItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete: (invoice: InvoiceTableItem) => void;
  onPay: (invoice: InvoiceTableItem) => void;
  showDelete?: boolean;
  showEdit?: boolean;
  showPay?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
        جاري تحميل الفواتير...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
        {emptyMessage || "لا توجد فواتير مطابقة."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {rows.map((invoice) => (
        <article
          key={invoice.id}
          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                #{invoice.number}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{invoice.id}</h3>
              <p className="mt-1 text-sm text-slate-500">{invoice.customer}</p>
            </div>
            <span
              className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${
                invoiceStatusStyles[invoice.lifecycleStatus]
              }`}
            >
              {formatInvoiceStatus(invoice.lifecycleStatus)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-400">الإجمالي</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {formatMoney(invoice.total, invoice.currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-400">المتبقي</p>
              <p className="mt-2 text-sm font-semibold text-amber-700">
                {formatMoney(invoice.due, invoice.currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-400">المدفوع</p>
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                {formatMoney(invoice.paid, invoice.currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <p className="text-xs text-slate-400">عدد البنود</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{invoice.products}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">الإصدار</p>
              <p className="mt-1 font-medium text-slate-700">{invoice.issueDate}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400">الاستحقاق</p>
              <p className="mt-1 font-medium text-slate-700">{invoice.dueDate}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={`/invoices/view?id=${encodeURIComponent(invoice.id)}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="عرض الفاتورة"
            >
              <Eye className="h-4 w-4" />
            </Link>
            {showEdit ? (
              <Link
                href={`/invoices/new?id=${encodeURIComponent(invoice.id)}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="تعديل الفاتورة"
              >
                <PencilLine className="h-4 w-4" />
              </Link>
            ) : null}
            {showPay ? (
              <button
                type="button"
                onClick={() => onPay(invoice)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                aria-label="تسجيل دفعة"
              >
                <CreditCard className="h-4 w-4" />
              </button>
            ) : null}
            {showDelete ? (
              <button
                type="button"
                onClick={() => onDelete(invoice)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                aria-label="حذف الفاتورة"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <div className="mr-auto text-xs text-slate-400">{invoice.rawStatus}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
