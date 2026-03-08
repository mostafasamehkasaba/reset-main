"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import { listInvoices } from "../../../services/invoices";
import type { Invoice } from "../../../types";

function ViewInvoicePageContent() {
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get("id");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!invoiceIdParam) {
        setErrorMessage("لم يتم تحديد الفاتورة.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listInvoices();
        if (!active) return;
        const selected = data.find((entry) => entry.id === invoiceIdParam) ?? null;
        if (!selected) {
          setErrorMessage("تعذر العثور على الفاتورة المطلوبة.");
        }
        setInvoice(selected);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل بيانات الفاتورة."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [invoiceIdParam]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              تفاصيل الفاتورة
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
              جاري تحميل بيانات الفاتورة...
            </div>
          ) : invoice ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">رقم الفاتورة</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {invoice.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">العميل</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {invoice.client}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">التاريخ</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {invoice.date}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">تاريخ الاستحقاق</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {invoice.dueDate || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full min-w-[640px] text-right text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-2 py-2 sm:px-3 sm:py-3">البند</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">السعر</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الكمية</th>
                      <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td
                        className="px-2 py-4 sm:px-3 sm:py-4 text-center text-slate-500"
                        colSpan={4}
                      >
                        تفاصيل البنود غير متاحة من الـ API حاليًا.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">الملاحظات</label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    -
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">الإجمالي</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.total} {invoice.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">الخصم</span>
                    <span className="font-semibold text-slate-700">
                      {invoice.discount} {invoice.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">المستحق</span>
                    <span className="font-semibold text-rose-600">
                      {invoice.due} {invoice.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}

function ViewInvoicePageFallback() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            جاري تحميل بيانات الفاتورة...
          </div>
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}

export default function ViewInvoicePage() {
  return (
    <Suspense fallback={<ViewInvoicePageFallback />}>
      <ViewInvoicePageContent />
    </Suspense>
  );
}
