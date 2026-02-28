import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import SidebarToggle from "../../../components/SidebarToggle";

export default function NewPaymentMethodPage() {
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

      <div className="flex w-full gap-5 px-6 py-6" dir="ltr">
        <main className="flex-1 space-y-4" dir="rtl">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-right text-lg font-semibold text-slate-700">وسيلة دفع جديدة</div>
            <Link
              href="/projects-pages/payment-methods"
              className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              رجوع
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">اسم الوسيلة</label>
                <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">النوع</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>بنكي</option>
                  <option>بطاقة</option>
                  <option>محفظة رقمية</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">العملة</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>USD</option>
                  <option>OMR</option>
                  <option>SAR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">الوصف</label>
                <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button className="rounded-full bg-brand-900 px-8 py-2 text-sm text-white">حفظ</button>
              <Link
                href="/projects-pages/payment-methods"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </Link>
            </div>
          </div>
        </main>

        <Sidebar activeLabel="وسائل الدفع" />
      </div>
    </div>
  );
}
