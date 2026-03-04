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
import Sidebar from "../../../components/Sidebar";
import { clients } from "../data";
import TopNav from "../../../components/TopNav";
import type { ClientViewPageProps } from "../../../types";

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
      data: [0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1],
      borderColor: "#1e88e5",
      backgroundColor: "rgba(30,136,229,0.2)",
      pointRadius: 3,
      tension: 0.35,
    },
    {
      label: "الدفعات",
      data: [0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1],
      borderColor: "#f39c12",
      backgroundColor: "rgba(243,156,18,0.2)",
      pointRadius: 3,
      tension: 0.35,
    },
    {
      label: "المدفوع",
      data: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
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
    legend: { display: false },
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
    x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } },
    y: { grid: { color: "rgba(226,232,240,0.8)" }, ticks: { color: "#94a3b8", font: { size: 10 } } },
  },
};

export default function ClientViewPage({ params }: ClientViewPageProps) {
  const clientId = Number(params.id);
  const client = clients.find((item) => item.id === clientId);
  const currency = client?.currency ?? "USD";
  const stats = client?.stats ?? {
    total: 0,
    paid: 0,
    discount: 0,
    due: 0,
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="العملاء" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm">◀</button>
              <span className="text-sm font-semibold">{currency}</span>
              <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm">▶</button>
              <div className="app-search">
                <span className="grid h-10 w-10 place-items-center bg-emerald-500 text-white">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <input className="app-search-input h-10 w-40 px-3 text-sm outline-none" placeholder="بحث" />
              </div>
            </div>
            <div className="text-right text-lg font-semibold text-slate-700">
              العملاء - {client?.name ?? "غير معروف"}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                    <select className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm">
                      <option>سبتمبر</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>السنة:</span>
                    <input
                      className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-center"
                      defaultValue="2024"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <div className="font-semibold text-slate-700">
                    {currency === "USD"
                      ? "دولار أمريكي"
                      : currency === "QAR"
                      ? "ريال قطري"
                      : "ريال عماني"}
                  </div>
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
                  <div className="text-xs font-semibold text-slate-600">{currency}</div>
                </div>

                <div className="mt-3 h-56">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </section>

            <aside className="space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-100 p-4">
                <div className="flex items-center justify-between text-blue-900">
                  <div className="rounded-full bg-blue-200/60 p-2">🧾</div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{client?.recentInvoices.length ?? 0}</div>
                    <div className="text-xs text-blue-800">
                      الفواتير - من أصل {client?.invoices ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-100 p-4">
                <div className="flex items-center justify-between text-yellow-900">
                  <div className="rounded-full bg-yellow-200/70 p-2">∑</div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {currency} {stats.total}
                    </div>
                    <div className="text-xs">المجموع</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-lg border border-emerald-200 bg-emerald-100 p-4">
                  <div className="flex items-center justify-between text-emerald-900">
                    <div className="rounded-full bg-emerald-200/70 p-2">✓</div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {currency} {stats.paid}
                      </div>
                      <div className="text-xs">المبلغ المدفوع</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-100 p-4">
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="rounded-full bg-slate-200-70 p-2">—</div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {currency} {stats.discount}
                      </div>
                      <div className="text-xs">التخفيض</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-100 p-4">
                <div className="flex items-center justify-between text-rose-900">
                  <div className="rounded-full bg-rose-200/70 p-2">⏳</div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {currency} {stats.due}
                    </div>
                    <div className="text-xs">المستحق</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">#</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المنتجات</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المجموع</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المدفوع</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">التخفيض</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">المستحق</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">العملة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">الحالة</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">التاريخ</th>
                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center">تاريخ الاستحقاق</th>
                  </tr>
                </thead>
                <tbody>
                  {(client?.recentInvoices ?? []).map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-700">{row.id}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">{row.products}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center font-semibold text-slate-700">{row.total}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-sky-600">{row.paid}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-slate-600">{row.discount}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center text-rose-600">{row.due}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">{row.currency}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">{row.status}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">{row.date}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">{row.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="العملاء" />
      </div>
    </div>
  );
}
