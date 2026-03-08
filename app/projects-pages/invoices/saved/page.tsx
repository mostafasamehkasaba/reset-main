"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import { listInvoices } from "../../../services/invoices";
import type { Invoice } from "../../../types";

export default function SavedInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listInvoices();
        if (!active) return;
        setInvoices(data);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getErrorMessage(error, "تعذر تحميل الفواتير المحفوظة."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const savedInvoices = useMemo(() => invoices, [invoices]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div
        className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              الفواتير المحفوظة
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
              جاري تحميل الفواتير المحفوظة...
            </div>
          ) : savedInvoices.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
              لا توجد فواتير محفوظة من الـ API حاليًا.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {savedInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="text-sm text-slate-500">رقم الفاتورة</div>
                  <div className="mt-1 text-lg font-semibold text-slate-700">
                    {invoice.id}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">الإجمالي</div>
                  <div className="text-base font-semibold text-emerald-700">
                    {invoice.currency} {invoice.total}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{invoice.date}</div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}
