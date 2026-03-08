"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { getErrorMessage } from "../../lib/fetcher";
import { getStockAlerts, type Product } from "../../lib/product-store";
import { listInvoices } from "../../services/invoices";
import { listProducts } from "../../services/products";
import type { Invoice } from "../../types";
import styles from "./home-dashboard.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

const toCurrency = (value: number) => `OMR ${value.toLocaleString()}`;

const getThemeState = () => {
  if (typeof window === "undefined") return false;
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const parseInvoiceDate = (value: string) => {
  if (!value || value === "-") return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDayKey = (date: Date) => date.toISOString().slice(0, 10);

const getLastThirtyDays = () => {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    days.push(date);
  }

  return days;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [productsError, setProductsError] = useState("");
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
      try {
        const data = await listProducts();
        if (!active) return;
        setProducts(data);
        setProductsError("");
      } catch (error) {
        if (!active) return;
        setProducts([]);
        setProductsError(getErrorMessage(error, "تعذر تحميل المنتجات."));
      }

      try {
        const data = await listInvoices();
        if (!active) return;
        setInvoices(data);
        setInvoicesError("");
      } catch (error) {
        if (!active) return;
        setInvoices([]);
        setInvoicesError(getErrorMessage(error, "تعذر تحميل الفواتير."));
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const stockAlerts = useMemo(() => getStockAlerts(products), [products]);
  const criticalAlertsCount = stockAlerts.filter((alert) => alert.level === "critical").length;
  const reorderAlertsCount = stockAlerts.filter((alert) => alert.level === "reorder").length;
  const totalInventoryUnits = products.reduce((sum, product) => sum + product.quantity, 0);
  const totalInventoryCost = products.reduce(
    (sum, product) => sum + product.quantity * product.purchasePrice,
    0
  );
  const averageTax = useMemo(() => {
    const taxableProducts = products.filter((product) => product.taxMode !== "none");
    if (!taxableProducts.length) return 0;
    const totalTax = taxableProducts.reduce(
      (sum, product) => sum + product.defaultTaxRate,
      0
    );
    return totalTax / taxableProducts.length;
  }, [products]);

  const paymentTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paymentPaid = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const discount = invoices.reduce((sum, invoice) => sum + invoice.discount, 0);
  const due = invoices.reduce((sum, invoice) => sum + invoice.due, 0);
  const paymentProgress =
    paymentTotal > 0 ? Math.min(100, Math.round((paymentPaid / paymentTotal) * 100)) : 0;
  const topAlerts = stockAlerts.slice(0, 5);

  const chartSeries = useMemo(() => {
    const days = getLastThirtyDays();
    const invoiceCounts = new Map<string, number>();
    const paymentCounts = new Map<string, number>();
    const paidCounts = new Map<string, number>();

    invoices.forEach((invoice) => {
      const date = parseInvoiceDate(invoice.date);
      if (!date) return;
      date.setHours(0, 0, 0, 0);
      const key = formatDayKey(date);

      invoiceCounts.set(key, (invoiceCounts.get(key) ?? 0) + 1);
      if (invoice.paid > 0) {
        paymentCounts.set(key, (paymentCounts.get(key) ?? 0) + 1);
      }
      if (invoice.status === "مدفوعة") {
        paidCounts.set(key, (paidCounts.get(key) ?? 0) + 1);
      }
    });

    return {
      labels: days.map((date) => date.toLocaleDateString("ar-EG", { day: "2-digit" })),
      invoicesSeries: days.map((date) => invoiceCounts.get(formatDayKey(date)) ?? 0),
      paymentsSeries: days.map((date) => paymentCounts.get(formatDayKey(date)) ?? 0),
      paidSeries: days.map((date) => paidCounts.get(formatDayKey(date)) ?? 0),
    };
  }, [invoices]);

  const chartData = useMemo(
    () => ({
      labels: chartSeries.labels,
      datasets: [
        {
          label: "الفواتير",
          data: chartSeries.invoicesSeries,
          borderColor: isDark ? "#2dd4bf" : "#0f766e",
          backgroundColor: isDark ? "rgba(45,212,191,0.15)" : "rgba(15,118,110,0.14)",
          pointRadius: 2.5,
          borderWidth: 2.2,
          tension: 0.35,
          fill: true,
        },
        {
          label: "الدفعات",
          data: chartSeries.paymentsSeries,
          borderColor: isDark ? "#fbbf24" : "#d97706",
          backgroundColor: "transparent",
          pointRadius: 2.5,
          borderWidth: 2,
          tension: 0.35,
        },
        {
          label: "المدفوع",
          data: chartSeries.paidSeries,
          borderColor: isDark ? "#7dd3fc" : "#0284c7",
          backgroundColor: "transparent",
          pointRadius: 2.5,
          borderWidth: 2,
          tension: 0.35,
        },
      ],
    }),
    [chartSeries, isDark]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          titleAlign: "right" as const,
          bodyAlign: "right" as const,
          backgroundColor: isDark ? "#0b1220" : "#0f172a",
          titleColor: "#f8fafc",
          bodyColor: "#e2e8f0",
          borderColor: isDark ? "rgba(148,163,184,0.3)" : "rgba(148,163,184,0.35)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDark ? "#8ca3c3" : "#5b708f",
            font: { size: 10 },
          },
        },
        y: {
          grid: {
            color: isDark ? "rgba(44,62,89,0.75)" : "rgba(203,213,225,0.75)",
          },
          ticks: {
            color: isDark ? "#8ca3c3" : "#5b708f",
            font: { size: 10 },
          },
        },
      },
    }),
    [isDark]
  );

  return (
    <div className={`${styles.dashboardRoot} flex h-dvh w-full flex-col`}>
      <TopNav currentLabel="لوحة البيانات" />

      <div
        className="flex min-h-0 w-full flex-1 gap-0 px-3 pt-4 sm:px-4 sm:pt-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4 pb-4 sm:pb-6" dir="rtl">
          {productsError || invoicesError ? (
            <section className="grid gap-3 md:grid-cols-2">
              {productsError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {productsError}
                </div>
              ) : null}
              {invoicesError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {invoicesError}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>قيمة المخزون (تكلفة)</p>
              <p className={styles.metricValue}>{toCurrency(totalInventoryCost)}</p>
              <p className={styles.metricHint}>إجمالي وحدات المخزون: {totalInventoryUnits}</p>
            </article>

            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>إجمالي المنتجات</p>
              <p className={styles.metricValue}>{products.length}</p>
              <p className={styles.metricHint}>
                منتجات بها ضريبة: {products.filter((product) => product.taxMode !== "none").length}
              </p>
            </article>

            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>تنبيهات المخزون</p>
              <p className={styles.metricValue}>{stockAlerts.length}</p>
              <p className={styles.metricHint}>
                حرج: {criticalAlertsCount} | إعادة طلب: {reorderAlertsCount}
              </p>
            </article>

            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>متوسط الضريبة</p>
              <p className={styles.metricValue}>{averageTax.toFixed(1)}%</p>
              <p className={styles.metricHint}>اعتمادًا على المنتجات الخاضعة للضريبة</p>
            </article>
          </section>

          <section>
            <article className={styles.panel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className={styles.panelTitle}>التحليل الشهري</h2>
                  <p className={styles.panelHint}>أداء الفواتير والدفعات خلال آخر 30 يوم</p>
                </div>
                <div className={styles.legendRow}>
                  <span className={styles.legendItem}>
                    <span className={styles.dotTeal} />
                    الفواتير
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.dotAmber} />
                    الدفعات
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.dotSky} />
                    المدفوع
                  </span>
                </div>
              </div>
              <div className="mt-4 h-64 sm:h-80 lg:h-96">
                <Line data={chartData} options={chartOptions} />
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>ملخص التحصيل</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className={styles.panelHint}>نسبة التحصيل</span>
                    <span className={styles.valueInline}>{paymentProgress}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${paymentProgress}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className={styles.smallKpi}>
                    <p className={styles.smallKpiLabel}>الإجمالي</p>
                    <p className={styles.smallKpiValue}>{toCurrency(paymentTotal)}</p>
                  </div>
                  <div className={styles.smallKpi}>
                    <p className={styles.smallKpiLabel}>المدفوع</p>
                    <p className={styles.smallKpiValue}>{toCurrency(paymentPaid)}</p>
                  </div>
                  <div className={styles.smallKpi}>
                    <p className={styles.smallKpiLabel}>المستحق</p>
                    <p className={styles.smallKpiValue}>{toCurrency(due)}</p>
                  </div>
                  <div className={styles.smallKpi}>
                    <p className={styles.smallKpiLabel}>الخصم</p>
                    <p className={styles.smallKpiValue}>{toCurrency(discount)}</p>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={styles.panelTitle}>تنبيهات المخزون</h2>
                <span className={styles.alertBadge}>{stockAlerts.length}</span>
              </div>

              {topAlerts.length === 0 ? (
                <div className={styles.emptyState}>لا توجد منتجات بحاجة لإعادة طلب الآن.</div>
              ) : (
                <div className="space-y-2">
                  {topAlerts.map((alert) => (
                    <div
                      key={`${alert.product.id}-${alert.product.code}`}
                      className={styles.alertCard}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={alert.product.imageUrl || "/file.svg"}
                          alt={alert.product.name}
                          className={styles.alertImage}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={styles.alertTitle}>{alert.product.name}</p>
                          <p className={styles.alertSub}>
                            {alert.product.code} | {alert.product.supplierName}
                          </p>
                        </div>
                        <span
                          className={
                            alert.level === "critical"
                              ? styles.alertLevelCritical
                              : styles.alertLevelReorder
                          }
                        >
                          {alert.level === "critical" ? "حرج" : "إعادة طلب"}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <p className={styles.metaLine}>
                          الكمية: {alert.product.quantity} {alert.product.unit}
                        </p>
                        <p className={styles.metaLine}>حد إعادة الطلب: {alert.product.reorderPoint}</p>
                        <p className={styles.metaLine}>
                          سعر الشراء: {alert.product.purchasePrice} {alert.product.currency}
                        </p>
                        <p className={styles.metaLine}>
                          الضريبة:{" "}
                          {alert.product.taxMode === "none"
                            ? "بدون"
                            : `${alert.product.defaultTaxRate}%`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className={styles.panel}>
              <h2 className={styles.panelTitle}>توزيع نوع الضريبة</h2>
              <div className="mt-3 space-y-2">
                <div className={styles.rowBetween}>
                  <span className={styles.panelHint}>شامل ضريبة</span>
                  <span className={styles.valueInline}>
                    {products.filter((product) => product.taxMode === "inclusive").length}
                  </span>
                </div>
                <div className={styles.rowBetween}>
                  <span className={styles.panelHint}>نسبة ضريبة</span>
                  <span className={styles.valueInline}>
                    {products.filter((product) => product.taxMode === "rate").length}
                  </span>
                </div>
                <div className={styles.rowBetween}>
                  <span className={styles.panelHint}>بدون ضريبة</span>
                  <span className={styles.valueInline}>
                    {products.filter((product) => product.taxMode === "none").length}
                  </span>
                </div>
              </div>
            </article>
          </section>

          <div className={styles.footerNote}>جميع الحقوق محفوظة فاتورة+ © 2026</div>
        </main>

        <Sidebar activeLabel="لوحة البيانات" />
      </div>
    </div>
  );
}
