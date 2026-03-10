"use client";

import { Alexandria } from "next/font/google";
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import RecentActivity, {
  type RecentActivityItem,
} from "@/components/dashboard/RecentActivity";
import RevenueChart, {
  InvoiceStatusChart,
  type RevenueChartPoint,
  type StatusChartPoint,
} from "@/components/dashboard/RevenueChart";
import MetricsCards, { type MetricCardItem } from "@/components/dashboard/MetricsCards";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { listClients } from "../../services/clients";
import { listInvoices } from "../../services/invoices";
import type { Client, Invoice } from "../../types";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const getThemeState = () => {
  if (typeof window === "undefined") return false;
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const parseDateValue = (value: string) => {
  const normalized = value.trim();
  if (!normalized || normalized === "-") {
    return null;
  }

  const direct = new Date(normalized);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = normalized.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getLastSixMonths = () => {
  const months: Date[] = [];
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    months.push(date);
  }

  return months;
};

const getCollectedAmount = (invoice: Invoice) => {
  if (invoice.paid > 0) {
    return invoice.paid;
  }

  if (invoice.status === "مدفوعة") {
    return invoice.total;
  }

  return 0;
};

const getPrimaryCurrency = (invoices: Invoice[]) => {
  const counts = new Map<string, number>();

  invoices.forEach((invoice) => {
    const currency = invoice.currency || "OMR";
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || "OMR";
};

const formatMoney = (value: number, currency: string) => `${moneyFormatter.format(value)} ${currency}`;

const formatRelativeTime = (date: Date | null) => {
  if (!date) {
    return "تاريخ غير متاح";
  }

  const diffMs = date.getTime() - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(diffMs) < hour) {
    return relativeTimeFormatter.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return relativeTimeFormatter.format(Math.round(diffMs / hour), "hour");
  }

  return relativeTimeFormatter.format(Math.round(diffMs / day), "day");
};

const getInvoiceStatusColor = (status: string) => {
  if (status === "مدفوعة") return "#10b981";
  if (status === "مدفوعة جزئيا") return "#0ea5e9";
  if (status === "غير مدفوعة") return "#f59e0b";
  if (status === "ملغاة") return "#f43f5e";
  return "#94a3b8";
};

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-[28px] bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-[24px] bg-white" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="h-[360px] animate-pulse rounded-[28px] bg-white" />
        <div className="h-[360px] animate-pulse rounded-[28px] bg-white" />
      </div>
      <div className="h-[360px] animate-pulse rounded-[28px] bg-white" />
    </div>
  );
}

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");
  const [invoicesError, setInvoicesError] = useState("");

  useEffect(() => {
    setIsDark(getThemeState());
    const syncTheme = () => setIsDark(getThemeState());
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const mediaHandler = () => syncTheme();
    media.addEventListener("change", mediaHandler);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", mediaHandler);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setIsLoading(true);

      const [clientsResult, invoicesResult] = await Promise.allSettled([
        listClients(),
        listInvoices(),
      ]);

      if (!active) {
        return;
      }

      if (clientsResult.status === "fulfilled") {
        setClients(clientsResult.value);
        setClientsError("");
      } else {
        setClients([]);
        setClientsError(getErrorMessage(clientsResult.reason, "تعذر تحميل العملاء."));
      }

      if (invoicesResult.status === "fulfilled") {
        setInvoices(invoicesResult.value);
        setInvoicesError("");
      } else {
        setInvoices([]);
        setInvoicesError(getErrorMessage(invoicesResult.reason, "تعذر تحميل الفواتير."));
      }

      setIsLoading(false);
    };

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const currency = useMemo(() => getPrimaryCurrency(invoices), [invoices]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const totalRevenue = useMemo(
    () => invoices.reduce((sum, invoice) => sum + getCollectedAmount(invoice), 0),
    [invoices]
  );

  const paidInvoicesCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "مدفوعة").length,
    [invoices]
  );

  const overdueInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const dueDate = parseDateValue(invoice.dueDate);
        if (!dueDate) {
          return false;
        }

        return (
          invoice.due > 0 &&
          dueDate.getTime() < today.getTime() &&
          invoice.status !== "مدفوعة" &&
          invoice.status !== "ملغاة"
        );
      }),
    [invoices, today]
  );

  const overdueAmount = useMemo(
    () => overdueInvoices.reduce((sum, invoice) => sum + invoice.due, 0),
    [overdueInvoices]
  );

  const partialInvoicesCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "مدفوعة جزئيا").length,
    [invoices]
  );

  const draftInvoicesCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "مسودة").length,
    [invoices]
  );

  const customersWithDue = useMemo(
    () => clients.filter((client) => client.due > 0).length,
    [clients]
  );

  const totalDue = useMemo(
    () => invoices.reduce((sum, invoice) => sum + invoice.due, 0),
    [invoices]
  );

  const invoiceBookTotal = useMemo(
    () => invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    [invoices]
  );

  const collectionRate = invoiceBookTotal > 0 ? Math.round((totalRevenue / invoiceBookTotal) * 100) : 0;

  const metrics = useMemo<MetricCardItem[]>(
    () => [
      {
        id: "revenue",
        title: "إجمالي الإيراد",
        value: formatMoney(totalRevenue, currency),
        hint: `معدل التحصيل الحالي ${collectionRate}% من إجمالي قيمة الفواتير.`,
        icon: BadgeDollarSign,
        tone: "sky",
      },
      {
        id: "invoices",
        title: "إجمالي الفواتير",
        value: String(invoices.length),
        hint: `المسودات الحالية ${draftInvoicesCount} والفواتير الجزئية ${partialInvoicesCount}.`,
        icon: FileText,
        tone: "slate",
      },
      {
        id: "paid",
        title: "الفواتير المدفوعة",
        value: String(paidInvoicesCount),
        hint: `الفواتير المسددة بالكامل من إجمالي ${invoices.length} فاتورة.`,
        icon: CheckCircle2,
        tone: "emerald",
      },
      {
        id: "overdue",
        title: "الفواتير المتأخرة",
        value: String(overdueInvoices.length),
        hint: `قيمة متأخرة ${formatMoney(overdueAmount, currency)} تحتاج إلى متابعة.`,
        icon: AlertTriangle,
        tone: "rose",
      },
      {
        id: "customers",
        title: "إجمالي العملاء",
        value: String(clients.length),
        hint: `${customersWithDue} عميل لديهم رصيد مستحق حاليًا.`,
        icon: Users,
        tone: "amber",
      },
    ],
    [
      clients.length,
      collectionRate,
      currency,
      customersWithDue,
      draftInvoicesCount,
      invoices.length,
      overdueAmount,
      overdueInvoices.length,
      paidInvoicesCount,
      partialInvoicesCount,
      totalRevenue,
    ]
  );

  const monthlyRevenueData = useMemo<RevenueChartPoint[]>(() => {
    const months = getLastSixMonths();
    const totalsByMonth = new Map<string, number>();

    invoices.forEach((invoice) => {
      const date = parseDateValue(invoice.date);
      if (!date) {
        return;
      }

      const key = getMonthKey(date);
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + getCollectedAmount(invoice));
    });

    return months.map((date) => {
      const key = getMonthKey(date);
      return {
        label: date.toLocaleDateString("ar-EG", { month: "short" }),
        value: totalsByMonth.get(key) ?? 0,
      };
    });
  }, [invoices]);

  const invoiceStatusData = useMemo<StatusChartPoint[]>(() => {
    const statuses = ["مدفوعة", "مدفوعة جزئيا", "غير مدفوعة", "مسودة", "ملغاة"];

    return statuses.map((status) => ({
      label: status,
      value: invoices.filter((invoice) => invoice.status === status).length,
      color: getInvoiceStatusColor(status),
    }));
  }, [invoices]);

  const recentActivity = useMemo<RecentActivityItem[]>(() => {
    const invoiceCreatedActivities = invoices.map((invoice) => {
      const activityDate = parseDateValue(invoice.date);

      return {
        id: `invoice-${invoice.id}`,
        type: "invoice_created" as const,
        title: `تم إنشاء الفاتورة ${invoice.id}`,
        description: `فاتورة للعميل ${invoice.client || "غير محدد"} بقيمة ${formatMoney(invoice.total, invoice.currency || currency)}.`,
        timestampLabel: formatRelativeTime(activityDate),
        timestampValue: activityDate?.getTime() ?? 0,
      };
    });

    const paymentActivities = invoices
      .filter((invoice) => getCollectedAmount(invoice) > 0)
      .map((invoice) => {
        const activityDate = parseDateValue(invoice.date);

        return {
          id: `payment-${invoice.id}`,
          type: "payment_received" as const,
          title: `تم استلام دفعة للفواتير ${invoice.id}`,
          description: `تم تحصيل ${formatMoney(getCollectedAmount(invoice), invoice.currency || currency)} من العميل ${invoice.client || "غير محدد"}.`,
          timestampLabel: formatRelativeTime(activityDate),
          timestampValue: activityDate?.getTime() ?? 0,
        };
      });

    const customerActivities = clients.map((client) => {
      const activityDate = parseDateValue(client.createdAt || client.updatedAt || "");

      return {
        id: `customer-${client.id}`,
        type: "customer_added" as const,
        title: `تمت إضافة العميل ${client.name}`,
        description: client.email && client.email !== "-" ? `بيانات الاتصال: ${client.email}` : "تم إنشاء سجل عميل جديد داخل النظام.",
        timestampLabel: formatRelativeTime(activityDate),
        timestampValue: activityDate?.getTime() ?? 0,
      };
    });

    return [...invoiceCreatedActivities, ...paymentActivities, ...customerActivities]
      .sort((left, right) => right.timestampValue - left.timestampValue)
      .slice(0, 8)
      .map(({ timestampValue: _timestampValue, ...item }) => item);
  }, [clients, currency, invoices]);

  const headerStats = useMemo(
    () => [
      { label: "المتحصل هذا الشهر", value: formatMoney(monthlyRevenueData.at(-1)?.value ?? 0, currency) },
      { label: "إجمالي المستحق", value: formatMoney(totalDue, currency) },
      { label: "العملاء النشطون", value: String(clients.length) },
    ],
    [clients.length, currency, monthlyRevenueData, totalDue]
  );

  const errorMessages = [clientsError, invoicesError].filter(Boolean);

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <TopNav currentLabel="لوحة البيانات" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <section
            className={`${alexandria.className} relative overflow-hidden rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.26)] sm:px-6`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-sky-300 to-transparent" />

            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-sky-700">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  نظرة عامة
                </div>
                <h1 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[2.15rem]">
                  لوحة قيادة مركزة للأرقام الأهم بدون ازدحام بصري
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
                  المؤشرات الأساسية، الأداء الشهري، وحالة الفواتير في مساحة أسرع قراءة وأكثر تنظيمًا.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[560px]">
                {headerStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-3.5"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {errorMessages.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-2">
              {errorMessages.map((message) => (
                <div
                  key={message}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {message}
                </div>
              ))}
            </section>
          ) : null}

          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <MetricsCards items={metrics} />

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,0.95fr)]">
                <RevenueChart data={monthlyRevenueData} currency={currency} isDark={isDark} />
                <InvoiceStatusChart data={invoiceStatusData} isDark={isDark} />
              </section>

              <RecentActivity items={recentActivity} />
            </>
          )}
        </main>

        <Sidebar activeLabel="لوحة البيانات" />
      </div>
    </div>
  );
}
