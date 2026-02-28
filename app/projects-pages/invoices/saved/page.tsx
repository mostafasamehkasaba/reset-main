import Sidebar from "../../../components/Sidebar";
import SidebarToggle from "../../../components/SidebarToggle";

const savedInvoices = [
  { id: "24092000038", total: "OMR 20", date: "17-09-2024" },
  { id: "24091900037", total: "USD 50", date: "16-09-2024" },
  { id: "24090700036", total: "OMR 0", date: "04-09-2024" },
];

export default function SavedInvoicesPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <header className="bg-brand-900 text-white shadow-sm" dir="ltr">
        <div className="flex h-14 w-full items-center justify-between px-6">
          <div className="flex items-center gap-3 text-slate-200">
            <button
              className="rounded-md p-1 transition hover:bg-white/10"
              aria-label="الصفحة الرئيسية"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 11.5L12 4l9 7.5" />
                <path d="M6 10v10h12V10" />
              </svg>
            </button>
            <button
              className="rounded-md p-1 transition hover:bg-white/10"
              aria-label="المستخدم"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c1.8-3 5-4.5 7.5-4.5s5.7 1.5 7.5 4.5" />
              </svg>
            </button>
            <SidebarToggle />
          </div>
          <div className="text-right text-base font-semibold">فاتورة+</div>
        </div>
      </header>

      <div className="flex w-full gap-5 px-6 py-6" dir="ltr">
        <main className="flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">
              الفواتير المحفوظة
            </div>
          </div>

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
                  {invoice.total}
                </div>
                <div className="mt-2 text-xs text-slate-500">{invoice.date}</div>
              </div>
            ))}
          </div>
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}
