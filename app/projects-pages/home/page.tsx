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
import {
  defaultProducts,
  getStockAlerts,
  loadProductsFromStorage,
} from "../../lib/product-store";
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

const days = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, "0"));
const invoicesSeries = [
  0, 6, 2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 5, 0, 0, 0, 6, 2, 8, 3, 6,
];
const paymentsSeries = [
  0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 3, 0, 0, 5, 0, 7,
];
const paidSeries = [
  0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 2, 0, 2,
];

const toCurrency = (value: number) => `OMR ${value.toLocaleString()}`;
const getThemeState = () => {
  if (typeof window === "undefined") return false;
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export default function HomePage() {
  const [products, setProducts] = useState(defaultProducts);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setProducts(loadProductsFromStorage());
  }, []);

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
    const syncProducts = () => setProducts(loadProductsFromStorage());
    window.addEventListener("storage", syncProducts);
    window.addEventListener("focus", syncProducts);
    return () => {
      window.removeEventListener("storage", syncProducts);
      window.removeEventListener("focus", syncProducts);
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

  const paymentTotal = 1110;
  const paymentPaid = 555;
  const discount = 5;
  const due = 630;
  const paymentProgress = Math.min(100, Math.round((paymentPaid / paymentTotal) * 100));
  const topAlerts = stockAlerts.slice(0, 5);

  const chartData = useMemo(
    () => ({
      labels: days,
      datasets: [
        {
          label: "الفواتير",
          data: invoicesSeries,
          borderColor: isDark ? "#2dd4bf" : "#0f766e",
          backgroundColor: isDark ? "rgba(45,212,191,0.15)" : "rgba(15,118,110,0.14)",
          pointRadius: 2.5,
          borderWidth: 2.2,
          tension: 0.35,
          fill: true,
        },
        {
          label: "الدفعات",
          data: paymentsSeries,
          borderColor: isDark ? "#fbbf24" : "#d97706",
          backgroundColor: "transparent",
          pointRadius: 2.5,
          borderWidth: 2,
          tension: 0.35,
        },
        {
          label: "المدفوع",
          data: paidSeries,
          borderColor: isDark ? "#7dd3fc" : "#0284c7",
          backgroundColor: "transparent",
          pointRadius: 2.5,
          borderWidth: 2,
          tension: 0.35,
        },
      ],
    }),
    [isDark]
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

  const currentDate = new Date().toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`${styles.dashboardRoot} flex h-dvh w-full flex-col`}>
      <TopNav currentLabel="لوحة البيانات" />

      <div
        className="flex min-h-0 w-full flex-1 gap-0 px-3 pt-4 sm:px-4 sm:pt-6 lg:gap-5 lg:px-6"
        dir="ltr"
      >
        <main className="min-w-0 flex-1 space-y-4 pb-4 sm:pb-6" dir="rtl">
          <section className={styles.heroSection}>
            <div>
              <p className={styles.heroTag}>مركز التحكم المالي</p>
              <h1 className={styles.heroTitle}>لوحة بيانات احترافية لإدارة الفواتير والمخزون</h1>
              <p className={styles.heroSubtitle}>
                رؤية لحظية للمبيعات، التوريد، الضرائب، وتنبيهات المخزون في واجهة واحدة.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <span>{currentDate}</span>
              <span>آخر تحديث: الآن</span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>قيمة المخزون (تكلفة)</p>
              <p className={styles.metricValue}>{toCurrency(totalInventoryCost)}</p>
              <p className={styles.metricHint}>إجمالي وحدات المخزون: {totalInventoryUnits}</p>
            </article>

            <article className={styles.metricCard}>
              <p className={styles.metricLabel}>إجمالي المنتجات</p>
              <p className={styles.metricValue}>{products.length}</p>
              <p className={styles.metricHint}>منتجات بها ضريبة: {products.filter((p) => p.taxMode !== "none").length}</p>
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
                  <p className={styles.panelHint}>أداء الفواتير والدفعات خلال 30 يوم</p>
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
                        <p className={styles.metaLine}>
                          حد إعادة الطلب: {alert.product.reorderPoint}
                        </p>
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

          <div className={styles.footerNote}>
            جميع الحقوق محفوظة فاتورة+ © 2026
          </div>
        </main>

        <Sidebar activeLabel="لوحة البيانات" />
      </div>
    </div>
  );
}
