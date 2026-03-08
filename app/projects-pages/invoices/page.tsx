"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { deleteInvoice, listInvoices } from "../../services/invoices";
import type { Invoice } from "../../types";

const statusStyles: Record<string, string> = {
  مدفوعة: "text-emerald-700 bg-emerald-50 border-emerald-200",
  "غير مدفوعة": "text-rose-700 bg-rose-50 border-rose-200",
  "مدفوعة جزئيا": "text-sky-700 bg-sky-50 border-sky-200",
  مسودة: "text-slate-700 bg-slate-100 border-slate-200",
  ملغاة: "text-amber-700 bg-amber-50 border-amber-200",
};

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listInvoices();
        if (!active) return;
        setInvoicesList(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل الفواتير."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoicesList;

    return invoicesList.filter((invoice) =>
      [
        invoice.id,
        invoice.client,
        invoice.status,
        invoice.currency,
        invoice.date,
        invoice.dueDate,
        String(invoice.num),
        String(invoice.total),
        String(invoice.paid),
        String(invoice.discount),
        String(invoice.due),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, invoicesList]);

  const selectedInvoice = useMemo(
    () => invoicesList.find((invoice) => invoice.id === openId) ?? null,
    [openId, invoicesList]
  );
  const selectedDeleteInvoice = useMemo(
    () => invoicesList.find((invoice) => invoice.id === deleteInvoiceId) ?? null,
    [deleteInvoiceId, invoicesList]
  );

  const handleDeleteInvoice = async (invoiceId: string) => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteInvoice(invoiceId);
      setInvoicesList((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      setDeleteInvoiceId(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف الفاتورة."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]" dir="ltr">
              <div className="flex justify-start">
                <a
                  href="/projects-pages/invoices/new"
                  className="inline-flex rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                >
                  فاتورة جديدة
                </a>
              </div>

              <div className="w-full md:justify-self-center">
                <div className="app-search mx-auto w-full max-w-md">
                  <input
                    className="app-search-input h-10 w-full px-2 text-right text-sm outline-none"
                    placeholder="ابحث عن فاتورة بالرقم أو العميل"
                    dir="rtl"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="app-search-icon h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </div>
              </div>
              <div className="text-right md:justify-self-end" dir="rtl">
                <p className="text-lg font-semibold text-slate-700">الفواتير</p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {deleteError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {deleteError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" dir="rtl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">#</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">رقم الفاتورة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المنتجات</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الإجمالي</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المدفوع</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الخصم</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المستحق</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">العملة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الحالة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">التاريخ</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">تاريخ الاستحقاق</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">العميل</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center" aria-label="الإجراءات">
                      ...
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                        جارٍ تحميل الفواتير...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                        لا توجد فواتير من الـ API حاليًا.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice, index) => (
                      <tr
                        key={invoice.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {invoice.num}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-slate-800">
                          {invoice.id}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {invoice.products}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-emerald-700">
                          {invoice.total}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-sky-600">
                          {invoice.paid}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {invoice.discount}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-rose-600">
                          {invoice.due}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {invoice.currency}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${
                              statusStyles[invoice.status] ??
                              "text-slate-600 bg-slate-100 border-slate-200"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {invoice.date}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">
                          {invoice.dueDate}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">
                          {invoice.client}
                        </td>
                        <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-500">
                          <button
                            type="button"
                            onClick={() => setOpenId(invoice.id)}
                            className="rounded-full p-1 hover:bg-slate-200"
                            aria-label="خيارات"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="currentColor"
                            >
                              <circle cx="12" cy="5" r="1.6" />
                              <circle cx="12" cy="12" r="1.6" />
                              <circle cx="12" cy="19" r="1.6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">خيارات الفاتورة</p>
                <p className="text-xs text-slate-500">رقم: {selectedInvoice.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">العميل</span>
                <span className="font-semibold text-slate-700">{selectedInvoice.client}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الإجمالي</span>
                <span className="font-semibold text-emerald-700">
                  {selectedInvoice.total} {selectedInvoice.currency}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="text-slate-600">الحالة</span>
                <span className="font-semibold text-slate-700">{selectedInvoice.status}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href={`/projects-pages/invoices/view?id=${encodeURIComponent(selectedInvoice.id)}`}
              >
                عرض
              </a>
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-slate-600 hover:bg-slate-50"
                href="/projects-pages/invoices/new"
              >
                تعديل
              </a>
              <button
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50"
                type="button"
                onClick={() => window.print()}
              >
                طباعة
              </button>
              <button
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100"
                type="button"
                onClick={() => {
                  setDeleteInvoiceId(selectedInvoice.id);
                  setOpenId(null);
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteInvoiceId !== null}
        title="تأكيد حذف الفاتورة"
        message={
          selectedDeleteInvoice
            ? `هل تريد حذف الفاتورة رقم "${selectedDeleteInvoice.id}"؟`
            : "هل تريد حذف هذه الفاتورة؟"
        }
        onClose={() => {
          if (isDeleting) return;
          setDeleteInvoiceId(null);
        }}
        onConfirm={() => {
          if (deleteInvoiceId === null || isDeleting) return;
          void handleDeleteInvoice(deleteInvoiceId);
        }}
      />
    </div>
  );
}
