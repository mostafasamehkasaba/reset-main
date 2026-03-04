import Sidebar from "../../../components/Sidebar";
import TopNav from "../../../components/TopNav";

const savedInvoices = [
  { id: "24092000038", total: "OMR 20", date: "17-09-2024" },
  { id: "24091900037", total: "USD 50", date: "16-09-2024" },
  { id: "24090700036", total: "OMR 0", date: "04-09-2024" },
];

export default function SavedInvoicesPage() {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800">
      <TopNav currentLabel="الفواتير" />

      <div className="flex w-full gap-0 px-3 py-4 sm:px-4 sm:py-6 lg:gap-5 lg:px-6" dir="ltr">
        <main className="min-w-0 flex-1 space-y-4" dir="rtl">
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
