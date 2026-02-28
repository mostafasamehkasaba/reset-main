import Sidebar from "../../../components/Sidebar";
import SidebarToggle from "../../../components/SidebarToggle";

export default function ViewInvoicePage() {
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
              تفاصيل الفاتورة
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">رقم الفاتورة</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  24092000038
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">العميل</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">أحمد سعيد</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">التاريخ</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">17-09-2024</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">تاريخ الاستحقاق</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">لا يوجد</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3">المنتج</th>
                    <th className="px-3 py-3 text-center">السعر</th>
                    <th className="px-3 py-3 text-center">الكمية</th>
                    <th className="px-3 py-3 text-center">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200">
                    <td className="px-3 py-3 font-semibold text-slate-700">قالب ووردبريس</td>
                    <td className="px-3 py-3 text-center text-slate-600">20</td>
                    <td className="px-3 py-3 text-center text-slate-600">1</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">20</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الملاحظات</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  لا يوجد
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">الإجمالي</span>
                  <span className="font-semibold text-slate-700">20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">الخصم</span>
                  <span className="font-semibold text-slate-700">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">المستحق</span>
                  <span className="font-semibold text-rose-600">20</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button className="rounded-md bg-brand-900 px-4 py-2 text-sm text-white">
                طباعة
              </button>
              <button className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600">
                إرسال للعميل
              </button>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}
