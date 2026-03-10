"use client";

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  type TooltipItem,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend
);

export type RevenueChartPoint = {
  label: string;
  value: number;
};

export type StatusChartPoint = {
  label: string;
  value: number;
  color: string;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function RevenueChart({
  data,
  currency,
  isDark,
}: {
  data: RevenueChartPoint[];
  currency: string;
  isDark: boolean;
}) {
  const latestValue = data.at(-1)?.value ?? 0;

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "الإيراد الشهري",
        data: data.map((item) => item.value),
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14,165,233,0.14)",
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 4,
        tension: 0.38,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: isDark ? "#0f172a" : "#111827",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${moneyFormatter.format(context.parsed.y ?? 0)} ${currency}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? "#94a3b8" : "#64748b" },
      },
      y: {
        grid: {
          color: isDark ? "rgba(51,65,85,0.55)" : "rgba(226,232,240,0.95)",
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          callback: (value: string | number) => moneyFormatter.format(Number(value)),
        },
      },
    },
  };

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.24)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
            الإيراد
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">الإيراد الشهري</h2>
          <p className="mt-1 text-sm text-slate-500">
            اتجاه التحصيل الفعلي خلال آخر ستة أشهر.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          آخر 6 أشهر
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-950">
        {moneyFormatter.format(latestValue)} {currency}
      </p>

      <div className="mt-5 h-64 sm:h-72">
        <Line data={chartData} options={chartOptions} />
      </div>
    </article>
  );
}

export function InvoiceStatusChart({
  data,
  isDark,
}: {
  data: StatusChartPoint[];
  isDark: boolean;
}) {
  const totalInvoices = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderColor: isDark ? "#0f172a" : "#ffffff",
        borderWidth: 4,
        hoverOffset: 6,
      },
    ],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "76%",
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: isDark ? "#0f172a" : "#111827",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
      },
    },
  };

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.24)] sm:p-5">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-sky-700">
          الحالات
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">حالات الفواتير</h2>
        <p className="mt-1 text-sm text-slate-500">توزيع حالات السداد الحالية.</p>
      </div>

      <div className="relative mt-5 h-52">
        <Doughnut data={chartData} options={chartOptions} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-semibold text-slate-950">{totalInvoices}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">فاتورة</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
