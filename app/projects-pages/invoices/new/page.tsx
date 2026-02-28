import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import SidebarToggle from "../../../components/SidebarToggle";

const items = [
  { name: "قالب ووردبريس", price: 20, qty: 1, total: 20 },
  { name: "تصميم موقع", price: 30, qty: 1, total: 30 },
  { name: "إعداد سيرفر", price: 50, qty: 1, total: 50 },
];

export default function NewInvoicePage() {
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
              فاتورة جديدة
            </div>
            <Link
              href="/projects-pages/invoices"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  العملة
                </label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>ريال سعودي</option>
                  <option>ريال عُماني</option>
                  <option>دولار</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  تاريخ الإصدار
                </label>
                <div className="relative">
                  <input
                    type="text"
                    defaultValue="28/09/2024"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    📅
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  تاريخ الاستحقاق
                </label>
                <div className="relative">
                  <input
                    type="text"
                    defaultValue="01/10/2024"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    📅
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  الحالة
                </label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>غير مدفوع</option>
                  <option>مدفوع</option>
                  <option>مدفوع جزئيًا</option>
                </select>
              </div>
            </aside>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    اسم العميل
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="مثال: أحمد سعيد"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="example@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    الهاتف
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="+966 50 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    العنوان
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="الرياض"
                  />
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
                    {items.map((item) => (
                      <tr key={item.name} className="border-t border-slate-200">
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          {item.name}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">
                          {item.price}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">
                          {item.qty}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700">
                          {item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    ملاحظات
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="أضف ملاحظات إضافية للفاتورة"
                  />
                </div>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">الإجمالي</span>
                    <span className="font-semibold text-slate-700">100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">الخصم</span>
                    <span className="font-semibold text-slate-700">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">الإجمالي النهائي</span>
                    <span className="font-semibold text-emerald-700">100</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white">
                  حفظ الفاتورة
                </button>
                <Link
                  href="/projects-pages/invoices"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                >
                  إلغاء
                </Link>
              </div>
            </section>
          </div>
        </main>

        <Sidebar activeLabel="الفواتير" />
      </div>
    </div>
  );
}
