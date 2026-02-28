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
import Sidebar from "../../components/Sidebar";
import SidebarToggle from "../../components/SidebarToggle";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

const days = Array.from({ length: 30 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const chartData = {
  labels: days,
  datasets: [
    {
      label: "الفواتير",
      data: [
        0, 6, 2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0,
        5, 0, 0, 0, 6, 2, 8, 3, 6,
      ],
      borderColor: "#1e88e5",
      backgroundColor: "rgba(30,136,229,0.2)",
      pointRadius: 3,
      tension: 0.35,
    },
    {
      label: "الدفعات",
      data: [
        0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0,
        0, 0, 0, 0, 3, 0, 0, 5, 0, 7,
      ],
      borderColor: "#f39c12",
      backgroundColor: "rgba(243,156,18,0.2)",
      pointRadius: 3,
      tension: 0.35,
    },
    {
      label: "المدفوع",
      data: [
        0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
        0, 2, 0, 0, 0, 1, 0, 2, 0, 2,
      ],
      borderColor: "#2ecc71",
      backgroundColor: "rgba(46,204,113,0.2)",
      pointRadius: 3,
      tension: 0.35,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      rtl: true,
      titleAlign: "right" as const,
      bodyAlign: "right" as const,
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#f8fafc",
      borderColor: "rgba(148,163,184,0.4)",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 10,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(226,232,240,0.8)",
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 10,
        },
      },
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <header className="bg-brand-900 text-white shadow-sm" dir="ltr">
        <div className="flex h-14 w-full items-center justify-between px-6">
          <div className="flex items-center gap-3 text-slate-200">
            <SidebarToggle />
          </div>
          <div className="text-right text-base font-semibold">فاتورة+</div>
        </div>
      </header>

      <div className="flex w-full gap-5 px-6 pt-6" dir="ltr">
        <main className="flex-1 space-y-4" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <button
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm"
                aria-label="السابق"
              >
                ◀
              </button>
              <span className="text-sm font-semibold">OMR</span>
              <button
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm shadow-sm"
                aria-label="التالي"
              >
                ▶
              </button>
            </div>
            <div className="text-right text-lg font-semibold text-slate-700">
              لوحة البيانات
            </div>
          </div>

          <div
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
            dir="ltr"
          >
            <section
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              dir="rtl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-3 py-1 text-white shadow-sm">
                    فلترة
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M7 10l5 5 5-5" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-4" dir="rtl">
                  <div className="flex items-center gap-2">
                    <span>الشهر</span>
                    <div className="relative">
                      <select
                        className="appearance-none rounded-md border border-slate-200 bg-white px-3 py-1 pl-8 text-sm"
                        aria-label="الشهر"
                        defaultValue="09"
                      >
                        <option value="09">سبتمبر</option>
                        <option value="10">أكتوبر</option>
                        <option value="11">نوفمبر</option>
                      </select>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M7 10l5 5 5-5" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>السنة:</span>
                    <input
                      className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-center"
                      defaultValue="2024"
                      aria-label="السنة"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <div className="font-semibold text-slate-700">ريال عماني</div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#1e88e5]" />
                      الفواتير
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#f39c12]" />
                      الدفعات
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#2ecc71]" />
                      المدفوع
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">OMR</div>
                </div>

                <div className="mt-3">
                  <div className="h-72 lg:h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-3" dir="rtl">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <div className="flex items-center justify-between text-blue-900">
                  <div className="rounded-full bg-blue-200/60 p-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M6 2h9l3 3v17H6z" />
                      <path d="M9 11h6M9 15h6M9 7h3" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">19</div>
                    <div className="text-xs text-blue-800">
                      الفواتير - من أصل 30
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                <div className="flex items-center justify-between text-yellow-900">
                  <div className="rounded-full bg-yellow-200/70 p-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="5" y="3" width="14" height="18" rx="2" />
                      <path d="M8 8h8M8 12h8M8 16h5" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">OMR 1110</div>
                    <div className="text-xs">المجموع</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-900">
                    <div className="rounded-full bg-emerald-200/70 p-2">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 12l2.5 2.5L16 9" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">OMR 555</div>
                      <div className="text-xs">المبلغ المدفوع</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="rounded-full bg-slate-200-70 p-2">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 12h8" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">OMR 5</div>
                      <div className="text-xs">التخفيض</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm">
                <div className="flex items-center justify-between text-rose-900">
                  <div className="rounded-full bg-rose-200/70 p-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v6l4 2" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">OMR 630</div>
                    <div className="text-xs">المستحق</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <Sidebar activeLabel="لوحة البيانات" />
      </div>

      <div className="px-6 pb-6" dir="rtl">
        <div className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 shadow-sm">
          جميع الحقوق محفوظة فاتورة+ © 2024 - بواسطة ديفر
        </div>
      </div>
    </div>
  );
}
