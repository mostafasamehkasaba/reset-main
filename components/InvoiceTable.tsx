"use client";

import Link from "next/link";
import {
  CreditCard,
  Eye,
  MoreHorizontal,
  PencilLine,
  Trash2,
} from "lucide-react";
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

export default function InvoiceTable({
  rows,
  isLoading,
  emptyMessage,
  onDelete,
  onPay,
  onOpenActions,
  showDelete = true,
  showEdit = true,
  showPay = true,
}: {
  rows: InvoiceTableItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete: (invoice: InvoiceTableItem) => void;
  onPay: (invoice: InvoiceTableItem) => void;
  onOpenActions?: (invoice: InvoiceTableItem) => void;
  showDelete?: boolean;
  showEdit?: boolean;
  showPay?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-right text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">رقم الفاتورة</th>
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 text-center font-medium">البنود</th>
              <th className="px-4 py-3 text-center font-medium">الإجمالي</th>
              <th className="px-4 py-3 text-center font-medium">المدفوع</th>
              <th className="px-4 py-3 text-center font-medium">المستحق</th>
              <th className="px-4 py-3 text-center font-medium">الحالة</th>
              <th className="px-4 py-3 text-center font-medium">الإصدار</th>
              <th className="px-4 py-3 text-center font-medium">الاستحقاق</th>
              <th className="px-4 py-3 text-center font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                  جاري تحميل الفواتير...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                  {emptyMessage || "لا توجد فواتير مطابقة."}
                </td>
              </tr>
            ) : (
              rows.map((invoice, index) => (
                <tr
                  key={invoice.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                >
                  <td className="px-4 py-4 font-medium text-slate-700">{invoice.number}</td>
                  <td className="px-4 py-4 font-semibold text-slate-950">{invoice.id}</td>
                  <td className="px-4 py-4 text-slate-700">{invoice.customer}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{invoice.products}</td>
                  <td className="px-4 py-4 text-center font-semibold text-slate-950">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-emerald-700">
                    {formatMoney(invoice.paid, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-amber-700">
                    {formatMoney(invoice.due, invoice.currency)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        invoiceStatusStyles[invoice.lifecycleStatus]
                      }`}
                    >
                      {formatInvoiceStatus(invoice.lifecycleStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500">{invoice.issueDate}</td>
                  <td className="px-4 py-4 text-center text-slate-500">{invoice.dueDate}</td>
                  <td className="px-4 py-4">
                    {onOpenActions ? (
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => onOpenActions(invoice)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                          aria-label="خيارات الفاتورة"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/invoices/view?id=${encodeURIComponent(invoice.id)}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          aria-label="عرض الفاتورة"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {showEdit ? (
                          <Link
                            href={`/invoices/new?id=${encodeURIComponent(invoice.id)}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                            aria-label="تعديل الفاتورة"
                          >
                            <PencilLine className="h-4 w-4" />
                          </Link>
                        ) : null}
                        {showPay ? (
                          <button
                            type="button"
                            onClick={() => onPay(invoice)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                            aria-label="تسجيل دفعة"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        ) : null}
                        {showDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(invoice)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                            aria-label="حذف الفاتورة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
