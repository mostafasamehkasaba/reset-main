"use client";

import Link from "next/link";
import { CreditCard, Eye, PencilLine, Search, Trash2 } from "lucide-react";
import ActionDrawer from "@/components/ActionDrawer";
import { useCallback, useEffect, useMemo, useState } from "react";
import InvoiceCards from "@/components/InvoiceCards";
import InvoiceTable from "@/components/InvoiceTable";
import PaymentModal from "@/components/PaymentModal";
import ViewModeToggle from "@/components/ViewModeToggle";
import { useCollectionViewMode } from "@/hooks/useCollectionViewMode";
import { buildInvoiceTableItem } from "@/lib/invoiceCalculations";
import { type InvoiceTableItem } from "@/lib/invoiceTypes";
import { recordInvoicePayment } from "@/lib/invoiceServices";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { deleteInvoice, listInvoices } from "../../services/invoices";
import type { Invoice } from "../../types";

type InvoiceStatusSummary = {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number, currency: string) =>
  `${moneyFormatter.format(value)} ${currency}`;

function AnimatedCount({
  value,
  animationKey,
  delayMs = 0,
}: {
  value: number;
  animationKey: number;
  delayMs?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDisplayValue(value);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    setDisplayValue(0);

    let animationFrameId = 0;
    let timeoutId = 0;
    const durationMs = 720;

    const startAnimation = () => {
      const startTime = performance.now();

      const tick = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / durationMs, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        setDisplayValue(Math.round(value * easedProgress));

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(tick);
        }
      };

      animationFrameId = window.requestAnimationFrame(tick);
    };

    timeoutId = window.setTimeout(startAnimation, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [animationKey, delayMs, value]);

  return <span className="tabular-nums">{displayValue}</span>;
}

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [deleteInvoiceItem, setDeleteInvoiceItem] = useState<InvoiceTableItem | null>(null);
  const [paymentInvoiceItem, setPaymentInvoiceItem] = useState<InvoiceTableItem | null>(null);
  const [actionInvoiceItem, setActionInvoiceItem] = useState<InvoiceTableItem | null>(null);
  const [statsAnimationKey, setStatsAnimationKey] = useState(0);
  const { viewMode, setViewMode, isTableView } = useCollectionViewMode(
    "reset-main-view-mode-invoices"
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listInvoices();
      setInvoicesList(data);
    } catch (error) {
      setInvoicesList([]);
      setErrorMessage(getErrorMessage(error, "تعذر تحميل الفواتير."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const invoiceRows = useMemo(() => invoicesList.map(buildInvoiceTableItem), [invoicesList]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return invoiceRows;
    }

    return invoiceRows.filter((invoice) =>
      [
        invoice.id,
        String(invoice.number),
        invoice.customer,
        invoice.rawStatus,
        invoice.issueDate,
        invoice.dueDate,
        String(invoice.total),
        String(invoice.paid),
        String(invoice.due),
        invoice.currency,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [invoiceRows, query]);

  const statusSummary = useMemo<InvoiceStatusSummary>(
    () => ({
      draft: invoiceRows.filter((invoice) => invoice.lifecycleStatus === "draft").length,
      sent: invoiceRows.filter((invoice) => invoice.lifecycleStatus === "sent").length,
      paid: invoiceRows.filter((invoice) => invoice.lifecycleStatus === "paid").length,
      overdue: invoiceRows.filter((invoice) => invoice.lifecycleStatus === "overdue").length,
      cancelled: invoiceRows.filter((invoice) => invoice.lifecycleStatus === "cancelled").length,
    }),
    [invoiceRows]
  );

  const statusCards = useMemo(
    () => [
      { label: "مسودة", value: statusSummary.draft },
      { label: "مرسلة", value: statusSummary.sent },
      { label: "مدفوعة", value: statusSummary.paid },
      { label: "متأخرة", value: statusSummary.overdue },
      { label: "ملغاة", value: statusSummary.cancelled },
    ],
    [statusSummary]
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setStatsAnimationKey((current) => current + 1);
  }, [isLoading, statusSummary]);

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceItem) {
      return;
    }

    const rawInvoice = invoicesList.find((invoice) => invoice.id === deleteInvoiceItem.id);
    if (!rawInvoice) {
      setDeleteError("تعذر العثور على الفاتورة المطلوب حذفها.");
      return;
    }

    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteInvoice(rawInvoice);
      setInvoicesList((current) => current.filter((invoice) => invoice.id !== rawInvoice.id));
      setDeleteInvoiceItem(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "تعذر حذف الفاتورة."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecordPayment = async (payload: { amount: number; paymentMethod: "cash" | "transfer" | "card" | "credit" }) => {
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
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section className="rounded-[32px] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  ملخص الحالات
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  حالات الفواتير
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                  نظرة سريعة على توزيع الفواتير الحالية، مع عدّادات تظهر تدريجيًا عند فتح الصفحة.
                </p>
              </div>

              <div className="flex items-center">
                <Link
                  href="/invoices/new"
                  className="inline-flex rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  إنشاء فاتورة
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {statusCards.map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                    <AnimatedCount
                      value={item.value}
                      animationKey={statsAnimationKey}
                      delayMs={index * 80}
                    />
                  </p>
                </div>
              ))}
            </div>
          </section>

          {(errorMessage || deleteError || paymentError) ? (
            <section className="grid gap-3 md:grid-cols-3">
              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}
              {deleteError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {deleteError}
                </div>
              ) : null}
              {paymentError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {paymentError}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
                  قائمة الفواتير
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">عرض الفواتير</h2>
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-3">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
                <label className="relative block w-full max-w-sm">
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث برقم الفاتورة أو العميل أو الحالة"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5">
              {isTableView ? (
                <InvoiceTable
                  rows={filteredRows}
                  isLoading={isLoading}
                  emptyMessage="لا توجد فواتير مطابقة للبحث الحالي."
                  onDelete={setDeleteInvoiceItem}
                  onPay={setPaymentInvoiceItem}
                  onOpenActions={setActionInvoiceItem}
                />
              ) : (
                <InvoiceCards
                  rows={filteredRows}
                  isLoading={isLoading}
                  emptyMessage="لا توجد فواتير مطابقة للبحث الحالي."
                  onDelete={setDeleteInvoiceItem}
                  onPay={setPaymentInvoiceItem}
                />
              )}
            </div>
          </section>
        </main>

        <Sidebar activeLabel="الفواتير" />
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
                  description: "افتح صفحة عرض الفاتورة بكامل التفاصيل.",
                  icon: Eye,
                  href: `/invoices/view?id=${encodeURIComponent(actionInvoiceItem.id)}`,
                },
                {
                  id: "edit",
                  label: "تعديل الفاتورة",
                  description: "افتح نموذج التعديل لنفس الفاتورة.",
                  icon: PencilLine,
                  href: `/invoices/new?id=${encodeURIComponent(actionInvoiceItem.id)}`,
                },
                {
                  id: "pay",
                  label: "تسجيل دفعة",
                  description: "سجل تحصيلًا جديدًا وربطه بهذه الفاتورة.",
                  icon: CreditCard,
                  tone: "accent" as const,
                  disabled: actionInvoiceItem.due <= 0,
                  onClick: () => {
                    setPaymentInvoiceItem(actionInvoiceItem);
                    setActionInvoiceItem(null);
                    setPaymentError("");
                  },
                },
                {
                  id: "delete",
                  label: "حذف الفاتورة",
                  description: "احذف الفاتورة نهائيًا بعد التأكيد.",
                  icon: Trash2,
                  tone: "danger" as const,
                  onClick: () => {
                    setDeleteInvoiceItem(actionInvoiceItem);
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
              <span className="text-slate-500">الإجمالي</span>
              <span className="font-semibold text-slate-950">
                {formatMoney(actionInvoiceItem.total, actionInvoiceItem.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">المتبقي</span>
              <span className="font-semibold text-amber-700">
                {formatMoney(actionInvoiceItem.due, actionInvoiceItem.currency)}
              </span>
            </div>
          </div>
        ) : null}
      </ActionDrawer>

      <ConfirmDeleteModal
        open={deleteInvoiceItem !== null}
        title="تأكيد حذف الفاتورة"
        message={
          deleteInvoiceItem
            ? `هل تريد حذف الفاتورة رقم "${deleteInvoiceItem.id}"؟`
            : "هل تريد حذف هذه الفاتورة؟"
        }
        isProcessing={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteInvoiceItem(null);
        }}
        onConfirm={() => {
          if (!deleteInvoiceItem || isDeleting) return;
          void handleDeleteInvoice();
        }}
      />
    </div>
  );
}
