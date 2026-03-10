"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InvoiceDocument } from "../../../components/invoices/InvoiceDocument";
import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";
import { getErrorMessage } from "../../../lib/fetcher";
import { getInvoiceDetails, type InvoiceDetails } from "../../../services/invoices";
import { emptySettings, getSettings, type AppSettings } from "../../../services/settings";

function ViewInvoiceLoadingState() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.18)]">
      <div className="animate-pulse space-y-4">
        <div className="h-40 rounded-[24px] bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-36 rounded-[20px] bg-slate-100" />
          <div className="h-36 rounded-[20px] bg-slate-100" />
        </div>
        <div className="h-72 rounded-[24px] bg-slate-100" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 rounded-[20px] bg-slate-100" />
            <div className="h-40 rounded-[20px] bg-slate-100" />
          </div>
          <div className="h-48 rounded-[20px] bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ViewInvoicePageContent() {
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get("id");

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [companySettings, setCompanySettings] = useState<AppSettings>(emptySettings);
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
        const [data, settings] = await Promise.all([
          getInvoiceDetails(invoiceIdParam),
          getSettings().catch(() => emptySettings),
        ]);
        if (!active) return;

        setCompanySettings(settings);

        if (!data) {
          setInvoice(null);
          setErrorMessage("تعذر العثور على الفاتورة المطلوبة.");
          return;
        }

        setInvoice(data);
      } catch (error) {
        if (!active) return;
        setInvoice(null);
        setCompanySettings(emptySettings);
        setErrorMessage(getErrorMessage(error, "تعذر تحميل بيانات الفاتورة."));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [invoiceIdParam]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">عرض الفاتورة</p>
              <p className="text-sm text-slate-500">
                تخطيط أبسط وأكثر وضوحًا لقراءة الفاتورة بسرعة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {invoice ? (
                <Link
                  href={`/invoices/new?id=${encodeURIComponent(invoice.id)}`}
                  className="rounded-full border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  تعديل الفاتورة
                </Link>
              ) : null}
              <Link
                href="/invoices"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                رجوع
              </Link>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <ViewInvoiceLoadingState />
          ) : invoice ? (
            <InvoiceDocument invoice={invoice} company={companySettings} />
          ) : null}
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}

function ViewInvoicePageFallback() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <ViewInvoiceLoadingState />
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
