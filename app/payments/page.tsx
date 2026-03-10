"use client";

import { CreditCard, Eye, Search } from "lucide-react";
import ActionDrawer from "@/components/ActionDrawer";
import { useCallback, useEffect, useMemo, useState } from "react";
import InvoiceTable from "@/components/InvoiceTable";
import PaymentModal from "@/components/PaymentModal";
import { buildInvoiceTableItem } from "@/lib/invoiceCalculations";
import { recordInvoicePayment } from "@/lib/invoiceServices";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { getErrorMessage } from "../lib/fetcher";
import { listInvoices } from "../services/invoices";
import type { Invoice } from "../types";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${moneyFormatter.format(value)} ${currency}`;

export default function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [actionInvoiceItem, setActionInvoiceItem] = useState<ReturnType<
    typeof buildInvoiceTableItem
  > | null>(null);
  const [paymentInvoiceItem, setPaymentInvoiceItem] = useState<ReturnType<
    typeof buildInvoiceTableItem
  > | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listInvoices();
      setInvoicesList(data);
    } catch (error) {
      setInvoicesList([]);
      setErrorMessage(getErrorMessage(error, "تعذر تحميل الفواتير المستحقة."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const payableInvoices = useMemo(
    () =>
      invoicesList
        .map(buildInvoiceTableItem)
        .filter((invoice) => invoice.due > 0 && invoice.lifecycleStatus !== "cancelled"),
    [invoicesList]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return payableInvoices;
    }

    return payableInvoices.filter((invoice) =>
      [invoice.id, invoice.customer, invoice.issueDate, invoice.dueDate, invoice.rawStatus]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [payableInvoices, query]);

  const currency = payableInvoices[0]?.currency || "OMR";
  const totalOutstanding = payableInvoices.reduce((sum, invoice) => sum + invoice.due, 0);

  const handleRecordPayment = async (payload: {
    amount: number;
    paymentMethod: "cash" | "transfer" | "card" | "credit";
  }) => {
    if (!paymentInvoiceItem) {
      return;
    }

    setPaymentError("");
    setIsRecordingPayment(true);

    try {
      await recordInvoicePayment({
        invoiceId: paymentInvoiceItem.id,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
      });
      await loadData();
      setPaymentInvoiceItem(null);
    } catch (error) {
      setPaymentError(getErrorMessage(error, "تعذر تسجيل الدفعة."));
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <TopNav currentLabel="المدفوعات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  المدفوعات
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  مساحة متابعة التحصيل والمدفوعات المستحقة
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                  كل الفواتير التي تحتاج إلى تحصيل أصبحت في شاشة واحدة، مع تسجيل دفعة مباشر وتحديث فوري للحالة.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                  الرصيد المستحق
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatMoney(totalOutstanding, currency)}
                </p>
                <p className="mt-1 text-sm text-slate-500">{payableInvoices.length} فاتورة قابلة للتحصيل</p>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  التحصيلات
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">الفواتير القابلة للتحصيل</h2>
              </div>
              <label className="relative block w-full max-w-sm">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث برقم الفاتورة أو العميل"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                />
              </label>
            </div>

            <div className="mt-5">
              <InvoiceTable
                rows={filteredRows}
                isLoading={isLoading}
                emptyMessage="لا توجد فواتير تحتاج إلى تحصيل الآن."
                onDelete={() => {}}
                onPay={setPaymentInvoiceItem}
                onOpenActions={setActionInvoiceItem}
                showDelete={false}
                showEdit={false}
              />
            </div>
          </section>
        </main>

        <Sidebar activeLabel="المدفوعات" />
      </div>

      <PaymentModal
        open={paymentInvoiceItem !== null}
        invoice={paymentInvoiceItem}
        isSubmitting={isRecordingPayment}
        errorMessage={paymentError}
        onClose={() => {
          if (isRecordingPayment) return;
          setPaymentInvoiceItem(null);
          setPaymentError("");
        }}
        onSubmit={handleRecordPayment}
      />

      <ActionDrawer
        open={actionInvoiceItem !== null}
        title="إجراءات الفاتورة"
        subtitle={actionInvoiceItem?.id || undefined}
        onClose={() => setActionInvoiceItem(null)}
        actions={
          actionInvoiceItem
            ? [
                {
                  id: "view",
                  label: "عرض الفاتورة",
                  description: "افتح صفحة الفاتورة لمراجعة التفاصيل.",
                  icon: Eye,
                  href: `/invoices/view?id=${encodeURIComponent(actionInvoiceItem.id)}`,
                },
                {
                  id: "pay",
                  label: "تسجيل دفعة",
                  description: "سجل دفعة جديدة لهذه الفاتورة.",
                  icon: CreditCard,
                  tone: "accent" as const,
                  disabled: actionInvoiceItem.due <= 0,
                  onClick: () => {
                    setPaymentInvoiceItem(actionInvoiceItem);
                    setActionInvoiceItem(null);
                  },
                },
              ]
            : []
        }
      >
        {actionInvoiceItem ? (
          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">العميل</span>
              <span className="font-medium text-slate-900">{actionInvoiceItem.customer}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">المستحق</span>
              <span className="font-semibold text-amber-700">
                {formatMoney(actionInvoiceItem.due, actionInvoiceItem.currency)}
              </span>
            </div>
          </div>
        ) : null}
      </ActionDrawer>
    </div>
  );
}
